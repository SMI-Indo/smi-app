import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { liturgyQuizEnabled } from "@/lib/featureFlags";
import { QuizInteractive } from "@/components/quiz/QuizInteractive";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  if (!liturgyQuizEnabled) notFound();

  const quizzes = await prisma.quiz.findMany({
    include: { questions: { select: { id: true, question: true, options: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      {quizzes.length ? <QuizInteractive quizzes={quizzes} /> : <p>Belum ada kuis yang tersedia.</p>}
    </main>
  );
}
