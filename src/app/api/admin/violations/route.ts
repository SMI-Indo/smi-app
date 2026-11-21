import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";
import * as z from "zod";
import { EvidenceError, validateEvidenceFiles, uploadEvidence, removeEvidence, type StoredEvidence } from "@/lib/violationEvidence";

import { notifyByEmail } from "@/lib/email";

const evidenceEnabled = process.env.ENABLE_VIOLATION_EVIDENCE === "true";

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
    const emailSent = await notifyByEmail(record.user.email, "violation", "Catatan kedisiplinan baru", [
      "Ada catatan kedisiplinan yang perlu Anda tinjau.", "Buka halaman Digital ID untuk melihat rincian dan tindak lanjut.",
    ]);
    const evidence = evidenceEnabled ? await prisma.violationEvidence.findMany({ where: { violationId: record.id }, select: { id: true, fileName: true } }).catch(() => []) : [];
    return NextResponse.json({ success: true, violation: { ...record, evidence }, emailSent }, { status: 201 });
  } catch (error) {
    if (!committed) await removeEvidence(uploaded.map((file) => file.storagePath), false).catch(() => console.warn("[evidence] Cleanup needs retry"));
    if (error instanceof EvidenceError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Gagal mencatat poin pelanggaran" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await checkAdminSession();
  if (!admin) return NextResponse.json({ error: "Akses khusus pengurus." }, { status: 403 });
  const parsed = z.object({
    id: z.string().min(1),
    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"]),
    reason: z.string().trim().min(3).max(2000).optional(),
  }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Status atau alasan tidak valid." }, { status: 400 });
  const { id, status, reason } = parsed.data;
  if (status === "CANCELLED" && !reason) {
    return NextResponse.json({ error: "Isi alasan pembatalan." }, { status: 400 });
  }
  try {
    const violation = await prisma.$transaction(async (tx) => {
      const changed = await tx.violationRecord.updateMany({
        where: { id, status: { not: "CANCELLED" } },
        data: status === "CANCELLED"
          ? { status, cancellationReason: reason, cancelledById: admin.user.id, cancelledAt: new Date() }
          : { status },
      });
      if (changed.count === 0) return null;
      const record = await tx.violationRecord.findUniqueOrThrow({ where: { id } });
      if (status === "CANCELLED") {
        await tx.user.update({
          where: { id: record.userId },
          data: { violationPoints: { decrement: record.points } },
        });
      }
      return record;
    });
    if (!violation) return NextResponse.json({ error: "Catatan tidak ada atau sudah dibatalkan." }, { status: 409 });
    return NextResponse.json({ success: true, violation });
  } catch {
    return NextResponse.json({ error: "Status gagal diperbarui." }, { status: 500 });
  }
}
