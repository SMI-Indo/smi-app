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

    if (newBalance === null) return NextResponse.json({ error: "Misi ini sudah pernah Anda klaim sebelumnya." }, { status: 400 });
    return NextResponse.json({ success: true, newBalance }, { status: 200 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2034") {
      return NextResponse.json({ error: "Saldo sedang diperbarui. Coba lagi." }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
