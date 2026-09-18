import { NextRequest, NextResponse } from "next/server";
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Task ID tidak valid" },
        { status: 400 }
      );
    }

    const { taskId } = parsed.data;

    const task = await prisma.missionTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Misi tidak ditemukan" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, coins: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Cek apakah misi ini sudah pernah diklaim oleh user (Anti-Replay / Infinite Claim exploit fix)
    const existingClaim = await prisma.userTransaction.findFirst({
      where: {
        userId: user.id,
        type: "CLAIM_TASK",
        description: { contains: task.title },
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "Misi ini sudah pernah Anda klaim sebelumnya." },
        { status: 400 }
      );
    }

    // Atomic transaction for coin credit & audit transaction log
    const newBalance = await prisma.$transaction(async (tx) => {
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
          description: `Klaim Misi: ${task.title}`,
        },
      });

      return updatedUser.coins;
    });

    return NextResponse.json({ success: true, newBalance }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
