import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rewardId } = body;

    if (!rewardId) {
      return NextResponse.json({ error: "Reward ID wajib disertakan" }, { status: 400 });
    }

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward || !reward.isAvailable || reward.stock <= 0) {
      return NextResponse.json({ error: "Merchandise tidak tersedia atau habis" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (user.coins < reward.coinCost) {
      return NextResponse.json({ error: "Saldo koin tidak mencukupi" }, { status: 400 });
    }

    const newBalance = user.coins - reward.coinCost;

    // Deduct coins & reduce stock & log transaction
    await prisma.user.update({
      where: { id: user.id },
      data: { coins: newBalance },
    });

    await prisma.reward.update({
      where: { id: reward.id },
      data: { stock: reward.stock - 1 },
    });

    await prisma.userTransaction.create({
      data: {
        userId: user.id,
        amount: reward.coinCost,
        type: "REDEEM_REWARD",
        description: `Penukaran Koin: ${reward.title}`,
      },
    });

    return NextResponse.json({ success: true, newBalance }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
