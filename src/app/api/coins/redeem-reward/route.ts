import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as z from "zod";

const redeemSchema = z.object({
  rewardId: z.string().min(1, "Reward ID wajib disertakan"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = redeemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Reward ID tidak valid" },
        { status: 400 }
      );
    }

    const { rewardId } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, coins: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Atomic transaction: verify stock, verify balance, atomic decrement, log tx
    const newBalance = await prisma.$transaction(async (tx) => {
      const reward = await tx.reward.findUnique({
        where: { id: rewardId },
      });

      if (!reward || !reward.isAvailable || reward.stock <= 0) {
        throw new Error("OUT_OF_STOCK");
      }

      const freshUser = await tx.user.findUnique({
        where: { id: user.id },
        select: { coins: true },
      });

      if (!freshUser || freshUser.coins < reward.coinCost) {
        throw new Error("INSUFFICIENT_COINS");
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { coins: { decrement: reward.coinCost } },
        select: { coins: true },
      });

      await tx.reward.update({
        where: { id: reward.id },
        data: { stock: { decrement: 1 } },
      });

      await tx.userTransaction.create({
        data: {
          userId: user.id,
          amount: reward.coinCost,
          type: "REDEEM_REWARD",
          description: `Penukaran Koin: ${reward.title}`,
        },
      });

      return updatedUser.coins;
    });

    return NextResponse.json({ success: true, newBalance }, { status: 200 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "OUT_OF_STOCK") {
        return NextResponse.json(
          { error: "Merchandise tidak tersedia atau habis" },
          { status: 404 }
        );
      }
      if (err.message === "INSUFFICIENT_COINS") {
        return NextResponse.json(
          { error: "Saldo koin tidak mencukupi" },
          { status: 400 }
        );
      }
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
