"use client";

import { useState } from "react";
import Link from "next/link";

export interface QuestionData {
  id: string;
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string | null;
}

export interface QuizData {
  id: string;
  title: string;
  description: string | null;
  rewardCoins: number;
  questions: QuestionData[];
  isCompleted?: boolean;
}

export function QuizInteractive({ quizzes }: { quizzes: QuizData[] }) {
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
    coinsEarned: number;
    alreadyClaimed: boolean;
  } | null>(null);

  const handleStartQuiz = (quiz: QuizData) => {
    setActiveQuiz(quiz);
    setSelectedAnswers({});
    setResult(null);
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (result) return; // Kuis sudah disubmit
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;

    // Pastikan semua soal telah dijawab
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < activeQuiz.questions.length) {
      alert("Harap jawab semua pertanyaan sebelum mengirimkan kuis.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: activeQuiz.id,
          answers: selectedAnswers,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(data.error || "Gagal mengirim kuis.");
      }
    } catch {
      alert("Terjadi kendala jaringan saat mengirim kuis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">quiz</span>
        </div>
        <h1 className="font-headline-lg text-primary text-3xl font-bold">
          Kuis Liturgi &amp; Edukasi Online SMI
        </h1>
        <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto text-sm md:text-base">
          Uji pemahaman liturgi dan tradisi gereja Katolik secara interaktif. Akumulasikan koin SMI dan tukarkan dengan merchandise eksklusif!
        </p>
      </div>

      {!activeQuiz ? (
        /* Quiz Selection Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant card-glow flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase">
                    {quiz.questions.length} Pertanyaan
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-secondary-container/30 text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">token</span>
                    <span>+{quiz.rewardCoins} Koin</span>
                  </span>
                </div>

                <h2 className="font-headline-md text-xl text-on-surface font-bold">
                  {quiz.title}
                </h2>
                <p className="font-body-md text-sm text-on-surface-variant">
                  {quiz.description}
                </p>
              </div>

              <button
                onClick={() => handleStartQuiz(quiz)}
                className="w-full py-3 rounded-full bg-primary text-white font-label-lg font-bold hover:bg-primary-container transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Mulai Kuis</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Active Quiz Interface */
        <div className="space-y-8 bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant card-glow">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
            <div>
              <button
                onClick={() => setActiveQuiz(null)}
                className="text-xs text-on-surface-variant hover:text-primary flex items-center gap-1 mb-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Kembali ke Daftar Kuis</span>
              </button>
              <h2 className="font-headline-md text-xl text-on-surface font-bold">
                {activeQuiz.title}
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-secondary-container/20 text-secondary">
              Reward: +{activeQuiz.rewardCoins} Koin
            </span>
          </div>

          {/* Result Card if Submitted */}
          {result && (
            <div
              className={`p-6 rounded-3xl border text-center space-y-3 ${
                result.passed
                  ? "bg-green-50 border-green-200 text-green-900"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              <span className="material-symbols-outlined text-5xl">
                {result.passed ? "celebration" : "sentiment_dissatisfied"}
              </span>
              <h3 className="font-headline-md text-2xl font-bold">
                {result.passed ? "Selamat! Anda Lulus Kuis!" : "Belum Memenuhi Nilai Minimal"}
              </h3>
              <p className="text-sm">
                Skor Anda: <strong>{result.score}/100</strong> ({result.correctCount} dari{" "}
                {result.totalQuestions} benar)
              </p>

              {result.coinsEarned > 0 && (
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-200/60 font-mono text-sm font-black text-green-900 animate-bounce">
                  <span className="material-symbols-outlined text-base">token</span>
                  <span>+{result.coinsEarned} Koin Berhasil Ditambahkan ke Akun!</span>
                </div>
              )}

              {result.alreadyClaimed && (
                <p className="text-xs opacity-75">
                  (Anda sudah pernah mengklaim koin untuk kuis ini sebelumnya)
                </p>
              )}

              <div className="pt-2 flex justify-center gap-3">
                <Link
                  href="/coin"
                  className="px-6 py-2.5 rounded-full bg-primary text-white text-xs font-label-lg font-bold hover:bg-primary-container transition-all"
                >
                  Lihat Dompet Koin Saya
                </Link>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="px-6 py-2.5 rounded-full border border-outline text-xs font-label-lg font-bold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Pilih Kuis Lain
                </button>
              </div>
            </div>
          )}

          {/* Question Cards */}
          <div className="space-y-6">
            {activeQuiz.questions.map((q, idx) => {
              const selectedOpt = selectedAnswers[q.id];
              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/60 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <h4 className="font-body-lg text-sm md:text-base font-bold text-on-surface">
                      {q.question}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedOpt === optIdx;
                      const isCorrect = result && q.correctIdx === optIdx;
                      const isWrong = result && isSelected && q.correctIdx !== optIdx;

                      let btnStyle = "bg-surface border-outline/30 hover:bg-surface-container";
                      if (isSelected && !result) {
                        btnStyle = "bg-primary text-white border-primary";
                      } else if (isCorrect) {
                        btnStyle = "bg-green-600 text-white border-green-600";
                      } else if (isWrong) {
                        btnStyle = "bg-red-600 text-white border-red-600";
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          disabled={!!result}
                          className={`p-3 rounded-xl border text-left text-xs font-body-md transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isSelected && !result && (
                            <span className="material-symbols-outlined text-sm">check</span>
                          )}
                          {isCorrect && (
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                          )}
                          {isWrong && (
                            <span className="material-symbols-outlined text-sm">cancel</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Show explanation if result is revealed */}
                  {result && q.explanation && (
                    <div className="mt-2 p-3 rounded-xl bg-surface-container text-xs text-on-surface-variant font-body-md border border-outline/20">
                      <strong>Penjelasan:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Action */}
          {!result && (
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-full bg-primary text-white font-label-lg font-bold hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <span>Memeriksa Jawaban...</span>
                ) : (
                  <>
                    <span>Kirim Jawaban Kuis</span>
                    <span className="material-symbols-outlined text-sm">send</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
