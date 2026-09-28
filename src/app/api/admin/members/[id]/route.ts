import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";
import * as z from "zod";

const updateMemberSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong").optional(),
  nickname: z.string().optional().nullable(),
  email: z.string().email("Format email tidak valid").optional(),
  parish: z.string().optional().nullable(),
  rank: z.string().optional().nullable(),
  role: z.enum(["MEMBER", "ADMIN"]).optional(),
  coins: z.number().int().min(0).optional(),
  isApproved: z.boolean().optional(),
  memberId: z.string().optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data input tidak valid" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if email changed and duplicates another user
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase().trim() },
      });
      if (existingEmail && existingEmail.id !== id) {
        return NextResponse.json(
          { error: `Email ${data.email} sudah terdaftar pada pengguna lain.` },
          { status: 400 }
        );
      }
    }

    // Check if memberId changed and duplicates another user
    if (data.memberId && data.memberId.trim() !== "") {
      const trimmedId = data.memberId.trim().toUpperCase();
      const existingMemberId = await prisma.user.findUnique({
        where: { memberId: trimmedId },
      });
      if (existingMemberId && existingMemberId.id !== id) {
        return NextResponse.json(
          { error: `ID Anggota "${trimmedId}" sudah digunakan oleh pengguna lain.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.nickname !== undefined && { nickname: data.nickname ? data.nickname.trim() : null }),
        ...(data.email && { email: data.email.toLowerCase().trim() }),
        ...(data.parish !== undefined && { parish: data.parish ? data.parish.trim() : null }),
        ...(data.rank !== undefined && { rank: data.rank ? data.rank.trim() : null }),
        ...(data.role && { role: data.role }),
        ...(data.coins !== undefined && { coins: data.coins }),
        ...(data.isApproved !== undefined && { isApproved: data.isApproved }),
        ...(data.memberId !== undefined && {
          memberId: data.memberId && data.memberId.trim() !== "" ? data.memberId.trim().toUpperCase() : null,
        }),
      },
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
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Gagal memperbarui data anggota" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  const { id } = await params;

  // Protect admin from deleting own account
  if (auth.user.id === id) {
    return NextResponse.json(
      { error: "Anda tidak dapat menghapus akun admin yang sedang Anda gunakan saat ini." },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Anggota berhasil dihapus." }, { status: 200 });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json({ error: "Gagal menghapus anggota dari basis data" }, { status: 500 });
  }
}
