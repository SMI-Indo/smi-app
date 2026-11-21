import { NextRequest, NextResponse } from "next/server";
import { apiError, readJson } from "@/lib/apiErrors";
import { prisma } from "@/lib/prisma";
import { authorizeAdminApi } from "@/lib/adminAuth";
import * as z from "zod";
import { updateMemberSafely, deleteMemberSafely, memberMutationError } from "@/lib/memberAdmin";
import { accountEmail, memberName, memberNumber, optionalProfileText, recordId } from "@/lib/accountInput";

const updateMemberSchema = z.object({
  name: memberName.optional(),
  nickname: optionalProfileText,
  email: accountEmail.optional(),
  phone: optionalProfileText,
  parish: optionalProfileText,
  rank: optionalProfileText,
  role: z.enum(["MEMBER", "ADMIN"]).optional(),
  coins: z.number().int().min(0).optional(),
  isApproved: z.boolean().optional(),
  memberId: memberNumber.nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, error: authError } = await authorizeAdminApi();
  if (authError) return authError;

  const parsedId = recordId.safeParse((await params).id);
  if (!parsedId.success) return apiError(400, "ID anggota tidak valid.");
  const id = parsedId.data;

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
        where: { email: data.email },
      });
      if (existingEmail && existingEmail.id !== id) {
        return apiError(409, "Email sudah terdaftar pada pengguna lain.");
      }
    }

    // Check if memberId changed and duplicates another user
    if (data.memberId) {
      const existingMemberId = await prisma.user.findUnique({
        where: { memberId: data.memberId },
      });
      if (existingMemberId && existingMemberId.id !== id) {
        return apiError(409, "Nomor anggota sudah digunakan oleh pengguna lain.");
      }
    }

    const { nickname, phone, parish, rank, memberId, ...otherFields } = data;
    const updated = await updateMemberSafely(id, {
      ...otherFields,
      ...(nickname !== undefined && { nickname: nickname || null }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(parish !== undefined && { parish: parish || null }),
      ...(rank !== undefined && { rank: rank || null }),
      ...(memberId !== undefined && { memberId: memberId || null }),
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

  const parsedId = recordId.safeParse((await params).id);
  if (!parsedId.success) return apiError(400, "ID anggota tidak valid.");
  const id = parsedId.data;

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
