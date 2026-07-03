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
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID wajib disertakan" }, { status: 400 });
    }

    const task = await prisma.missionTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Misi tidak ditemukan" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const newBalance = user.coins + task.rewardCoins;

    // Credit coins & log transaction
    await prisma.user.update({
      where: { id: user.id },
      data: { coins: newBalance },
    });

    await prisma.userTransaction.create({
      data: {
        userId: user.id,
        amount: task.rewardCoins,
        type: "CLAIM_TASK",
        description: `Klaim Misi: ${task.title}`,
      },
    });

    return NextResponse.json({ success: true, newBalance }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
