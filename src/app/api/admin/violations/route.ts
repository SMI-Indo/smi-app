import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";
import * as z from "zod";
import { EvidenceError, validateEvidenceFiles, uploadEvidence, removeEvidence, type StoredEvidence } from "@/lib/violationEvidence";

import { notifyByEmail } from "@/lib/email";
import { recordId } from "@/lib/accountInput";
import { readJson } from "@/lib/apiErrors";
import { cancelledViolationStatus, violationSeverities } from "@/lib/violations";
import { violationPointsByMember } from "@/lib/violationTotals";

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
          },
        },
      },
    });

    const totals = await violationPointsByMember(prisma, violations.map(({ userId }) => userId));
    return NextResponse.json({ violations: violations.map((record) => ({
      ...record, user: { ...record.user, violationPoints: totals.get(record.userId) ?? 0 },
    })) }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal memuat data pelanggaran" }, { status: 500 });
  }
}

const createViolationSchema = z.object({
  userId: recordId,
  points: z.number().int().positive("Poin pelanggaran harus angka positif").max(2_147_483_647),
  reason: z.string().trim().min(3, "Alasan pelanggaran minimal 3 karakter").max(2000),
  severity: z.enum(violationSeverities),
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
      const form = await req.formData().catch(() => null);
      if (!form) return NextResponse.json({ error: "Formulir pelanggaran tidak valid." }, { status: 400 });
      const raw = form.get("data");
      try { body = typeof raw === "string" ? JSON.parse(raw) : null; }
      catch { return NextResponse.json({ error: "Data pelanggaran tidak valid." }, { status: 400 }); }
      files = form.getAll("evidence").filter((file): file is File => typeof file !== "string" && file.size > 0);
    } else body = await readJson(req);
    if (files.length && !evidenceEnabled) return NextResponse.json({ error: "Unggah bukti belum tersedia." }, { status: 503 });
    const parsed = createViolationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }

    const { userId, points, reason, severity, followUp, date } = parsed.data;

    uploaded = await uploadEvidence(await validateEvidenceFiles(files));

    // Keep the legacy cache in the same transaction for older deployments.
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
        select: { id: true, name: true, email: true, memberId: true },
      });

      const totals = await violationPointsByMember(tx, [userId]);
      return { ...createdRecord, user: { ...user, violationPoints: totals.get(userId) ?? 0 } };
    });

    committed = true;
    if (uploaded.length) await prisma.evidenceCleanup.deleteMany({ where: { storagePath: { in: uploaded.map((file) => file.storagePath) } } }).catch(() => console.warn("[evidence] Journal cleanup deferred"));
    const emailSent = await notifyByEmail(record.user.email, "violation", "Catatan kedisiplinan baru", [
      "Ada catatan kedisiplinan yang perlu Anda tinjau.", "Buka halaman Digital ID untuk melihat catatan kedisiplinan Anda.",
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
    id: recordId,
    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", cancelledViolationStatus]),
    reason: z.string().trim().min(3).max(2000).optional(),
  }).safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Status atau alasan tidak valid." }, { status: 400 });
  const { id, status, reason } = parsed.data;
  if (status === cancelledViolationStatus && !reason) {
    return NextResponse.json({ error: "Isi alasan pembatalan." }, { status: 400 });
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const changed = await tx.violationRecord.updateMany({
        where: { id, status: { not: cancelledViolationStatus } },
        data: status === cancelledViolationStatus
          ? { status, cancellationReason: reason, cancelledById: admin.user.id, cancelledAt: new Date() }
          : { status },
      });
      if (changed.count === 0) return null;
      const record = await tx.violationRecord.findUniqueOrThrow({ where: { id } });
      if (status === cancelledViolationStatus) {
        await tx.user.update({
          where: { id: record.userId },
          data: { violationPoints: { decrement: record.points } },
        });
      }
      const totals = await violationPointsByMember(tx, [record.userId]);
      return { violation: record, memberPoints: totals.get(record.userId) ?? 0 };
    });
    if (!result) return NextResponse.json({ error: "Catatan tidak ada atau sudah dibatalkan." }, { status: 409 });
    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ error: "Status gagal diperbarui." }, { status: 500 });
  }
}
