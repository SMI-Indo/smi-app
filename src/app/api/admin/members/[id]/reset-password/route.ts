import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";
import * as z from "zod";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Kata sandi minimal 8 karakter"),
});

export async function POST(
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
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Password tidak valid" },
        { status: 400 }
      );
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
    console.error("Error resetting member password:", error);
    return NextResponse.json({ error: "Gagal mereset kata sandi anggota" }, { status: 500 });
  }
}
