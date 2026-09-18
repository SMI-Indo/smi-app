import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as z from "zod";

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
  reason: z.string().min(3, "Alasan pelanggaran minimal 3 karakter"),
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

    const { userId, points, reason } = parsed.data;

    // Tambah record dan akumulasi poin di user secara transaksional
    const record = await prisma.$transaction(async (tx) => {
      const createdRecord = await tx.violationRecord.create({
        data: {
          userId,
          points,
          reason,
          createdById: admin.id,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          violationPoints: { increment: points },
        },
      });

      return createdRecord;
    });

    return NextResponse.json({ success: true, violation: record }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal mencatat poin pelanggaran" }, { status: 500 });
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
