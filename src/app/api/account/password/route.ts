import { NextRequest, NextResponse } from "next/server";
import { apiError, readJson } from "@/lib/apiErrors";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { existingPassword, newPassword } from "@/lib/accountInput";

const input = z.object({
  currentPassword: existingPassword,
  newPassword,
  confirmation: z.string().max(72),
}).refine((data) => data.newPassword === data.confirmation);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return apiError(401, "Masuk kembali untuk mengganti kata sandi.");
    const parsed = input.safeParse(await readJson(request));
    if (!parsed.success) return apiError(400, "Gunakan minimal 8 karakter, maksimal 72 byte, dan konfirmasi yang sama.");
    const current = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } });
    if (!current?.password) return apiError(400, "Akun ini tidak menggunakan kata sandi lokal. Hubungi pengurus.");
    if (!await bcrypt.compare(parsed.data.currentPassword, current.password)) {
      return apiError(400, "Kata sandi saat ini tidak sesuai.");
    }
    const password = await bcrypt.hash(parsed.data.newPassword, 12);
    const changed = await prisma.user.updateMany({ where: { id: session.user.id, password: current.password }, data: { password } });
    if (!changed.count) return apiError(409, "Kata sandi telah berubah. Masuk kembali dan coba lagi.");
    return NextResponse.json({ success: true });
  } catch {
    return apiError(500, "Kata sandi belum dapat diubah. Coba lagi.");
  }
}
