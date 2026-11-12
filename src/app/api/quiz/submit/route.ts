import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as z from "zod";
import { liturgyQuizEnabled } from "@/lib/featureFlags";

const submitQuizSchema = z.object({
  quizId: z.string().min(1),
  answers: z.record(z.string(), z.number()), // questionId -> selectedOptionIdx
});

export async function POST(req: NextRequest) {
  if (!liturgyQuizEnabled) return NextResponse.json({ error: "Kuis tidak tersedia." }, { status: 404 });
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
    const { coinsEarned, alreadyClaimed } = await prisma.$transaction(async (tx) => {
      const where = { userId: user.id, quizId };
      await tx.userQuizAttempt.createMany({ data: [{ ...where, score: 0 }], skipDuplicates: true });
      const updated = await tx.userQuizAttempt.updateMany({ where: { ...where, score: { lt: 60 } }, data: { score } });
      if (!passed || updated.count === 0) return { coinsEarned: 0, alreadyClaimed: updated.count === 0 };
      await tx.user.update({ where: { id: user.id }, data: { coins: { increment: quiz.rewardCoins } } });
      await tx.userTransaction.create({ data: {
        userId: user.id, amount: quiz.rewardCoins, type: "CLAIM_TASK",
        description: "Menyelesaikan kuis: " + quiz.title,
      } });
      return { coinsEarned: quiz.rewardCoins, alreadyClaimed: false };
    });

    return NextResponse.json(
      {
        success: true,
        score,
        passed,
        correctCount,
        totalQuestions: quiz.questions.length,
        coinsEarned,
        alreadyClaimed,
        review: passed || alreadyClaimed ? Object.fromEntries(quiz.questions.map((question) => [
          question.id, { correctIdx: question.correctIdx, explanation: question.explanation },
        ])) : undefined,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Gagal memproses jawaban kuis" }, { status: 500 });
  }
}
