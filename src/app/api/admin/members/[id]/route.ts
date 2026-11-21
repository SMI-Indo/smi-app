import { NextRequest, NextResponse } from "next/server";
import { apiError, readJson } from "@/lib/apiErrors";
import { prisma } from "@/lib/prisma";
import { authorizeAdminApi } from "@/lib/adminAuth";
import * as z from "zod";
import { updateMemberSafely, deleteMemberSafely, memberMutationError } from "@/lib/memberAdmin";

const updateMemberSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong").optional(),
  nickname: z.string().optional().nullable(),
  email: z.string().email("Format email tidak valid").optional(),
  phone: z.string().optional().nullable(),
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
  const { auth, error: authError } = await authorizeAdminApi();
  if (authError) return authError;

  const { id } = await params;

  try {
    const body = await readJson(req);
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message || "Data input tidak valid");
    }

    const data = parsed.data;
    if (id === auth.user.id && data.role === "MEMBER") {
      return apiError(400, "Anda tidak dapat menurunkan role akun admin yang sedang digunakan.");
    }

    // Check if email changed and duplicates another user
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase().trim() },
      });
      if (existingEmail && existingEmail.id !== id) {
        return apiError(409, "Email sudah terdaftar pada pengguna lain.");
      }
    }

    // Check if memberId changed and duplicates another user
    if (data.memberId && data.memberId.trim() !== "") {
      const trimmedId = data.memberId.trim().toUpperCase();
      const existingMemberId = await prisma.user.findUnique({
        where: { memberId: trimmedId },
      });
      if (existingMemberId && existingMemberId.id !== id) {
        return apiError(409, "Nomor anggota sudah digunakan oleh pengguna lain.");
      }
    }

    const updated = await updateMemberSafely(id, {
        ...(data.name && { name: data.name.trim() }),
        ...(data.nickname !== undefined && { nickname: data.nickname ? data.nickname.trim() : null }),
        ...(data.email && { email: data.email.toLowerCase().trim() }),
        ...(data.phone !== undefined && { phone: data.phone ? data.phone.trim() : null }),
        ...(data.parish !== undefined && { parish: data.parish ? data.parish.trim() : null }),
        ...(data.rank !== undefined && { rank: data.rank ? data.rank.trim() : null }),
        ...(data.role && { role: data.role }),
        ...(data.coins !== undefined && { coins: data.coins }),
        ...(data.isApproved !== undefined && { isApproved: data.isApproved }),
        ...(data.memberId !== undefined && {
          memberId: data.memberId && data.memberId.trim() !== "" ? data.memberId.trim().toUpperCase() : null,
        }),
    });

    return NextResponse.json({ success: true, user: updated }, { status: 200 });
  } catch (error) {
    const issue = memberMutationError(error);
    if (issue) return apiError(issue.status, issue.message);
    console.error("Error updating member:", error);
    return apiError(500, "Gagal memperbarui data anggota");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error: authError } = await authorizeAdminApi();
  if (authError) return authError;

  const { id } = await params;

  // Protect admin from deleting own account
  if (auth.user.id === id) {
    return apiError(400, "Anda tidak dapat menghapus akun admin yang sedang Anda gunakan saat ini.");
  }

  try {
    await deleteMemberSafely(id);

    return NextResponse.json({ success: true, message: "Anggota berhasil dihapus." }, { status: 200 });
  } catch (error) {
    const issue = memberMutationError(error);
    if (issue) return apiError(issue.status, issue.message);
    console.error("Error deleting member:", error);
    return apiError(500, "Gagal menghapus anggota dari basis data");
  }
}
