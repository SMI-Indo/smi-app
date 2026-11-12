import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as z from "zod";
import { notifyByEmail } from "@/lib/email";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (user?.role !== "ADMIN") return null;
  return user;
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  try {
    const violations = await prisma.violationRecord.findMany({
      orderBy: { createdAt: "desc" },
      include: {
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
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createViolationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }

    const { userId, points, reason, severity, followUp, date } = parsed.data;

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
          createdById: admin.id,
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

    await notifyByEmail(record.user.email, "violation", "Catatan kedisiplinan baru", [
      "Ada catatan kedisiplinan yang perlu Anda tinjau.", "Buka halaman Digital ID untuk melihat rincian dan tindak lanjut.",
    ]);
    return NextResponse.json({ success: true, violation: record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal mencatat poin pelanggaran" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Akses khusus pengurus." }, { status: 403 });
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
  const admin = await checkAdmin();
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

    await prisma.$transaction(async (tx) => {
      await tx.violationRecord.delete({
        where: { id: violationId },
      });

      await tx.user.update({
        where: { id: existing.userId },
        data: {
          violationPoints: { decrement: existing.points },
        },
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus catatan pelanggaran" }, { status: 500 });
  }
}
