import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as z from "zod";

const submitQuizSchema = z.object({
  quizId: z.string().min(1),
  answers: z.record(z.string(), z.number()), // questionId -> selectedOptionIdx
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = submitQuizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Format jawaban kuis tidak valid" }, { status: 400 });
    }

    const { quizId, answers } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, coins: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Cek apakah user sudah pernah menyelesaikan kuis ini
    const existingAttempt = await prisma.userQuizAttempt.findUnique({
      where: {
        userId_quizId: {
          userId: user.id,
          quizId,
        },
      },
    });

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz || quiz.questions.length === 0) {
      return NextResponse.json({ error: "Kuis tidak ditemukan" }, { status: 404 });
    }

    // Hitung skor kuis
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      const selected = answers[q.id];
      if (selected !== undefined && selected === q.correctIdx) {
        correctCount += 1;
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= 60; // Lulus jika minimal 60%
    let coinsEarned = 0;

    // Jika lulus dan belum pernah klaim reward untuk kuis ini:
    if (passed && !existingAttempt) {
      coinsEarned = quiz.rewardCoins;

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { coins: { increment: coinsEarned } },
        });

        await tx.userTransaction.create({
          data: {
            userId: user.id,
            amount: coinsEarned,
            type: "CLAIM_TASK",
            description: `Menyelesaikan Kuis Online: ${quiz.title}`,
          },
        });

        await tx.userQuizAttempt.create({
          data: {
            userId: user.id,
            quizId,
            score,
          },
        });
      });
    } else if (!existingAttempt) {
      // Catat percobaan walau belum lulus
      await prisma.userQuizAttempt.create({
        data: {
          userId: user.id,
          quizId,
          score,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        score,
        passed,
        correctCount,
        totalQuestions: quiz.questions.length,
        coinsEarned,
        alreadyClaimed: !!existingAttempt,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Gagal memproses jawaban kuis" }, { status: 500 });
  }
}
