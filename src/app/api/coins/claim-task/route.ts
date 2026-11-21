import { NextRequest, NextResponse } from "next/server";
import { apiError, readJson } from "@/lib/apiErrors";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as z from "zod";

const claimSchema = z.object({
  taskId: z.string().min(1, "Task ID wajib disertakan"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiError(401, "Masuk kembali untuk melanjutkan.");
    }

    const body = await readJson(req);
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message || "Task ID tidak valid");
    }

    const { taskId } = parsed.data;

    const task = await prisma.missionTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return apiError(404, "Misi tidak ditemukan");
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, coins: true },
    });

    if (!user) {
      return apiError(404, "Akun tidak ditemukan.");
    }

    const newBalance = await prisma.$transaction(async (tx) => {
      const description = `Klaim Misi: ${task.title}`;
      const existingClaim = await tx.userTransaction.findFirst({
        where: { userId: user.id, type: "CLAIM_TASK", OR: [{ description }, { description: { startsWith: `[misi:${task.id}] ` } }] },
      });
      if (existingClaim) return null;

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { coins: { increment: task.rewardCoins } },
        select: { coins: true },
      });

      await tx.userTransaction.create({
        data: {
          userId: user.id,
          amount: task.rewardCoins,
          type: "CLAIM_TASK",
          description: `[misi:${task.id}] ${description}`,
        },
      });

      return updatedUser.coins;
    }, { isolationLevel: "Serializable" });

    if (newBalance === null) return apiError(409, "Misi ini sudah pernah Anda klaim sebelumnya.");
    return NextResponse.json({ success: true, newBalance }, { status: 200 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      return apiError(409, "Saldo sedang diperbarui. Coba lagi.");
    }
    return apiError(500, "Misi belum dapat diklaim.");
  }
}
