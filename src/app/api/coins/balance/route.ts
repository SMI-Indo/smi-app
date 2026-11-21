import { NextResponse } from "next/server";
import { apiError } from "@/lib/apiErrors";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiError(401, "Masuk kembali untuk melanjutkan.");
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, coins: true },
    });

    if (!user) {
      return apiError(404, "Akun tidak ditemukan.");
    }

    const history = await prisma.userTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ balance: user.coins, history }, { status: 200 });
  } catch {
    return apiError(500, "Saldo koin belum dapat dimuat.");
  }
}
