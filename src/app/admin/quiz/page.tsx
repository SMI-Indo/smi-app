import { liturgyQuizEnabled } from "@/lib/featureFlags";
import { prisma } from "@/lib/prisma";
import { AdminQuizManager, QuizData } from "@/components/admin/AdminQuizManager";

export const revalidate = 0; // Data admin selalu real-time

export default async function AdminQuizPage() {
  let quizzes: QuizData[] = [];

  try {
    const rawQuizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        questions: true,
        _count: {
          select: { attempts: true },
        },
      },
    });

    quizzes = rawQuizzes.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      rewardCoins: q.rewardCoins,
      createdAt: q.createdAt.toISOString(),
      questions: q.questions.map((qn) => ({
        id: qn.id,
        question: qn.question,
        options: qn.options,
        correctIdx: qn.correctIdx,
        explanation: qn.explanation,
      })),
      _count: q._count,
    }));
  } catch (error) {
    console.error("Error loading admin quizzes page:", error);
  }

  return <>
    {!liturgyQuizEnabled && <p role="status">Kuis belum dibuka untuk peserta.</p>}
    <AdminQuizManager initialQuizzes={quizzes} />
  </>;
}
