import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as z from "zod";

// Hanya role ADMIN yang boleh mengakses API ini
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
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        role: true,
        isApproved: true,
        memberId: true,
        parish: true,
        rank: true,
        coins: true,
        violationPoints: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal memuat data pengguna" }, { status: 500 });
  }
}

const updateMemberSchema = z.object({
  userId: z.string().min(1),
  isApproved: z.boolean(),
  memberId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak valid" }, { status: 400 });
    }

    const { userId, isApproved, memberId } = parsed.data;

    // Cek jika memberId diisi, pastikan tidak duplikat dengan user lain
    if (memberId && memberId.trim() !== "") {
      const existingWithId = await prisma.user.findUnique({
        where: { memberId: memberId.trim() },
      });
      if (existingWithId && existingWithId.id !== userId) {
        return NextResponse.json({ error: `ID Unik "${memberId}" sudah digunakan oleh anggota lain.` }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isApproved,
        memberId: memberId && memberId.trim() !== "" ? memberId.trim() : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isApproved: true,
        memberId: true,
      },
    });

    return NextResponse.json({ success: true, user: updated }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui status anggota" }, { status: 500 });
  }
}
