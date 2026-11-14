import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const input = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
  confirmation: z.string(),
}).refine((data) => data.newPassword === data.confirmation);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Masuk kembali untuk mengganti kata sandi." }, { status: 401 });
    const parsed = input.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Gunakan kata sandi 8–128 karakter dan konfirmasi yang sama." }, { status: 400 });
    const current = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } });
    if (!current?.password) return NextResponse.json({ error: "Akun ini tidak menggunakan kata sandi lokal. Hubungi pengurus." }, { status: 400 });
    if (!await bcrypt.compare(parsed.data.currentPassword, current.password)) {
      return NextResponse.json({ error: "Kata sandi saat ini tidak sesuai." }, { status: 400 });
    }
    const password = await bcrypt.hash(parsed.data.newPassword, 12);
    const changed = await prisma.user.updateMany({ where: { id: session.user.id, password: current.password }, data: { password } });
    if (!changed.count) return NextResponse.json({ error: "Kata sandi telah berubah. Masuk kembali dan coba lagi." }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Kata sandi belum dapat diubah. Coba lagi." }, { status: 500 });
  }
}
