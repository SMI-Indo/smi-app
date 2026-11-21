import { NextRequest, NextResponse } from "next/server";
import { apiError, readJson } from "@/lib/apiErrors";
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
      return apiError(401, "Masuk kembali untuk melanjutkan.");
    }

    const body = await readJson(req);
    const parsed = redeemSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message || "Reward ID tidak valid");
    }

    const { rewardId } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, coins: true },
    });

    if (!user) {
      return apiError(404, "Akun tidak ditemukan.");
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
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ success: true, newBalance }, { status: 200 });
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2034") {
      return apiError(409, "Saldo atau stok sedang diperbarui. Coba lagi.");
    }
    if (err instanceof Error) {
      if (err.message === "OUT_OF_STOCK") {
        return apiError(404, "Merchandise tidak tersedia atau habis");
      }
      if (err.message === "INSUFFICIENT_COINS") {
        return apiError(400, "Saldo koin tidak mencukupi");
      }
    }
    return apiError(500, "Hadiah belum dapat ditukar.");
  }
}
