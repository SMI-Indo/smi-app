import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";
import * as z from "zod";
import { EvidenceError, validateEvidenceFiles, uploadEvidence, removeEvidence, evidenceSchemaReady, type StoredEvidence } from "@/lib/violationEvidence";

const evidenceEnabled = process.env.ENABLE_VIOLATION_EVIDENCE === "true";
import { notifyByEmail } from "@/lib/email";

export async function GET() {
  const admin = await checkAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  try {
    const violations = await prisma.violationRecord.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ...(evidenceEnabled && { evidence: { select: { id: true, fileName: true } } }),
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            memberId: true,
            violationPoints: true,
          },
        },
      },
    });

    return NextResponse.json({ violations }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal memuat data pelanggaran" }, { status: 500 });
  }
}

const createViolationSchema = z.object({
  userId: z.string().min(1, "Anggota wajib dipilih"),
  points: z.number().int().positive("Poin pelanggaran harus angka positif"),
  reason: z.string().trim().min(3, "Alasan pelanggaran minimal 3 karakter").max(2000),
  severity: z.enum(["RINGAN", "SEDANG", "BERAT"]),
  followUp: z.string().trim().min(3).max(2000),
  date: z.iso.date(),
});

export async function POST(req: NextRequest) {
  const admin = await checkAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  let uploaded: StoredEvidence[] = [];
  let committed = false;
  try {
    let body: unknown;
    let files: File[] = [];
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const form = await req.formData();
      const raw = form.get("data");
      body = typeof raw === "string" ? JSON.parse(raw) : null;
      files = form.getAll("evidence").filter((file): file is File => typeof file !== "string" && file.size > 0);
    } else body = await req.json();
    if (files.length && !evidenceEnabled) return NextResponse.json({ error: "Unggah bukti belum tersedia." }, { status: 503 });
    const parsed = createViolationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }

    const { userId, points, reason, severity, followUp, date } = parsed.data;

    uploaded = await uploadEvidence(await validateEvidenceFiles(files));

    // Tambah record dan akumulasi poin di user secara transaksional
    const record = await prisma.$transaction(async (tx) => {
      const createdRecord = await tx.violationRecord.create({
        data: {
          userId,
          points,
          reason,
          severity,
          followUp,
          date: new Date(date + "T00:00:00+07:00"),
          createdById: admin.user.id,
          ...(uploaded.length && { evidence: { create: uploaded } }),
        },
      });

      const user = await tx.user.update({
        where: { id: userId, role: "MEMBER" },
        data: {
          violationPoints: { increment: points },
        },
        select: { id: true, name: true, email: true, memberId: true, violationPoints: true },
      });

      return { ...createdRecord, user };
    });

    committed = true;
    if (uploaded.length) await prisma.evidenceCleanup.deleteMany({ where: { storagePath: { in: uploaded.map((file) => file.storagePath) } } }).catch(() => console.warn("[evidence] Journal cleanup deferred"));
    await notifyByEmail(record.user.email, "violation", "Catatan kedisiplinan baru", [
      "Ada catatan kedisiplinan yang perlu Anda tinjau.", "Buka halaman Digital ID untuk melihat rincian dan tindak lanjut.",
    ]);
    const evidence = evidenceEnabled ? await prisma.violationEvidence.findMany({ where: { violationId: record.id }, select: { id: true, fileName: true } }).catch(() => []) : [];
    return NextResponse.json({ success: true, violation: { ...record, evidence } }, { status: 201 });
  } catch (error) {
    if (!committed) await removeEvidence(uploaded.map((file) => file.storagePath), false).catch(() => console.warn("[evidence] Cleanup needs retry"));
    if (error instanceof EvidenceError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Gagal mencatat poin pelanggaran" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!await checkAdminSession()) return NextResponse.json({ error: "Akses khusus pengurus." }, { status: 403 });
  const parsed = z.object({
    id: z.string().min(1),
    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
  }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
  try {
    await prisma.violationRecord.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Status gagal diperbarui." }, { status: 500 });
  }
}

const deleteViolationSchema = z.object({
  violationId: z.string().min(1),
});

export async function DELETE(req: NextRequest) {
  const admin = await checkAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = deleteViolationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "ID pelanggaran tidak valid" }, { status: 400 });
    }

    const { violationId } = parsed.data;

    const existing = await prisma.violationRecord.findUnique({
      where: { id: violationId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Catatan pelanggaran tidak ditemukan" }, { status: 404 });
    }

    const hasEvidenceSchema = await evidenceSchemaReady();
    const paths = await prisma.$transaction(async (tx) => {
      const evidence = hasEvidenceSchema ? await tx.violationEvidence.findMany({ where: { violationId }, select: { storagePath: true } }) : [];
      if (evidence.length) await tx.evidenceCleanup.createMany({ data: evidence.map((file) => ({ storagePath: file.storagePath, notBefore: new Date() })), skipDuplicates: true });
      await tx.violationRecord.delete({
        where: { id: violationId },
      });

      await tx.user.update({
        where: { id: existing.userId },
        data: {
          violationPoints: { decrement: existing.points },
        },
      });
      return evidence.map((file) => file.storagePath);
    });

    await removeEvidence(paths).catch(() => console.warn("[evidence] Cleanup needs retry"));
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus catatan pelanggaran" }, { status: 500 });
  }
}
