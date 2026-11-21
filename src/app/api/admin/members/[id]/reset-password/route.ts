import { NextRequest, NextResponse } from "next/server";
import { apiError, hasDatabaseErrorCode, readJson } from "@/lib/apiErrors";
import { prisma } from "@/lib/prisma";
import { authorizeAdminApi } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";
import * as z from "zod";
import { newPassword, recordId } from "@/lib/accountInput";

const resetPasswordSchema = z.object({
  newPassword,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError } = await authorizeAdminApi();
  if (authError) return authError;

  const parsedId = recordId.safeParse((await params).id);
  if (!parsedId.success) return apiError(400, "ID anggota tidak valid.");
  const id = parsedId.data;

  try {
    const body = await readJson(req);
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message || "Password tidak valid");
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { success: true, message: "Kata sandi anggota berhasil direset." },
      { status: 200 }
    );
  } catch (error) {
    if (hasDatabaseErrorCode(error, "P2025")) return apiError(404, "Anggota tidak ditemukan.");
    console.error("Error resetting member password:", error);
    return apiError(500, "Gagal mereset kata sandi anggota");
  }
}
