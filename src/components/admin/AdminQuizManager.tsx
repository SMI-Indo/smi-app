"use client";

import { useState } from "react";

export interface QuizQuestionData {
  id?: string;
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
  createdAt: string;
  questions: QuizQuestionData[];
  _count?: {
    attempts: number;
  };
}

interface AdminQuizManagerProps {
  initialQuizzes: QuizData[];
}

export function AdminQuizManager({ initialQuizzes }: AdminQuizManagerProps) {
  const [quizzes, setQuizzes] = useState<QuizData[]>(initialQuizzes);
  const [search, setSearch] = useState("");

  // Modal form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizData | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    rewardCoins: number;
    questions: QuizQuestionData[];
  }>({
    title: "",
    description: "",
    rewardCoins: 10,
    questions: [
      {
        question: "",
        options: ["", "", "", ""],
        correctIdx: 0,
        explanation: "",
      },
    ],
  });

  const [deletingQuiz, setDeletingQuiz] = useState<QuizData | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter
  const filtered = quizzes.filter((q) => {
    const term = search.toLowerCase();
    return (
      q.title.toLowerCase().includes(term) ||
      (q.description && q.description.toLowerCase().includes(term))
    );
  });

  // Open Create
  const openCreateModal = () => {
    setEditingQuiz(null);
    setFormData({
      title: "",
      description: "",
      rewardCoins: 10,
      questions: [
        {
          question: "",
          options: ["", "", "", ""],
          correctIdx: 0,
          explanation: "",
        },
      ],
    });
    setIsFormOpen(true);
  };

  // Open Edit
  const openEditModal = (quiz: QuizData) => {
    setEditingQuiz(quiz);
    setFormData({
      title: quiz.title,
      description: quiz.description || "",
      rewardCoins: quiz.rewardCoins,
      questions:
        quiz.questions.length > 0
          ? quiz.questions.map((q) => ({
              id: q.id,
              question: q.question,
              options: [...q.options],
              correctIdx: q.correctIdx,
              explanation: q.explanation || "",
            }))
          : [
              {
                question: "",
                options: ["", "", "", ""],
                correctIdx: 0,
                explanation: "",
              },
            ],
    });
    setIsFormOpen(true);
  };

  // Add Question
  const handleAddQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: "",
          options: ["", "", "", ""],
          correctIdx: 0,
          explanation: "",
        },
      ],
    }));
  };

  // Remove Question
  const handleRemoveQuestion = (idx: number) => {
    if (formData.questions.length <= 1) {
      setMessage({ type: "error", text: "Kuis harus memiliki minimal 1 pertanyaan." });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));
  };

  // Update Question text
  const handleQuestionTextChange = (idx: number, text: string) => {
    setFormData((prev) => {
      const q = [...prev.questions];
      q[idx] = { ...q[idx], question: text };
      return { ...prev, questions: q };
    });
  };

  // Update Question option
  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    setFormData((prev) => {
      const q = [...prev.questions];
      const opts = [...q[qIdx].options];
      opts[optIdx] = val;
      q[qIdx] = { ...q[qIdx], options: opts };
      return { ...prev, questions: q };
    });
  };

  // Update Correct Option
  const handleCorrectIdxChange = (qIdx: number, correctIdx: number) => {
    setFormData((prev) => {
      const q = [...prev.questions];
      q[qIdx] = { ...q[qIdx], correctIdx };
      return { ...prev, questions: q };
    });
  };

  // Update Explanation
  const handleExplanationChange = (qIdx: number, explanation: string) => {
    setFormData((prev) => {
      const q = [...prev.questions];
      q[qIdx] = { ...q[qIdx], explanation };
      return { ...prev, questions: q };
    });
  };

  // Save Quiz
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("save-quiz");
    setMessage(null);

    // Validation
    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.question.trim()) {
        setMessage({ type: "error", text: `Pertanyaan nomor ${i + 1} tidak boleh kosong.` });
        setLoadingAction(null);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setMessage({
            type: "error",
            text: `Pilihan ${String.fromCharCode(65 + j)} pada soal nomor ${i + 1} tidak boleh kosong.`,
          });
          setLoadingAction(null);
          return;
        }
      }
    }

    const isEdit = !!editingQuiz;
    const url = isEdit ? `/api/admin/quizzes/${editingQuiz.id}` : "/api/admin/quizzes";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        if (isEdit) {
          setQuizzes((prev) =>
            prev.map((qz) => (qz.id === editingQuiz.id ? { ...qz, ...data.quiz } : qz))
          );
          setMessage({
            type: "success",
            text: `Kuis "${formData.title}" berhasil diperbarui.`,
          });
        } else {
          setQuizzes((prev) => [data.quiz, ...prev]);
          setMessage({
            type: "success",
            text: `Kuis baru "${formData.title}" berhasil dibuat.`,
          });
        }
        setIsFormOpen(false);
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menyimpan kuis." });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoadingAction(null);
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async () => {
    if (!deletingQuiz) return;

    setLoadingAction("delete-quiz");
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/quizzes/${deletingQuiz.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        setQuizzes((prev) => prev.filter((qz) => qz.id !== deletingQuiz.id));
        setMessage({
          type: "success",
          text: `Kuis "${deletingQuiz.title}" berhasil dihapus.`,
        });
        setDeletingQuiz(null);
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menghapus kuis." });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-primary text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">
              quiz
            </span>
            Kuis &amp; Pembinaan Liturgi
          </h1>
          <p className="font-body-md text-on-surface-variant text-xs sm:text-sm mt-1">
            Buat materi soal pilihan ganda, atur kunci jawaban, kunci koin hadiah, dan evaluasi pemahaman anggota.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-label-lg text-xs sm:text-sm font-semibold hover:bg-primary-container shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>Tambah Kuis Baru</span>
        </button>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-body-md flex items-center justify-between transition-all ${
            message.type === "success"
              ? "bg-secondary-container/20 text-on-surface border border-secondary-container"
              : "bg-error-container text-error border border-error/30"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">
              {message.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Cari judul kuis atau materi pembinaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Quizzes List */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-12 text-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 block">
            assignment_late
          </span>
          <p className="font-headline-md text-on-surface font-bold text-sm">
            Belum ada kuis yang dibuat
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Klik tombol &quot;Tambah Kuis Baru&quot; untuk menyusun kuis katekese pertama.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary-container/30 text-secondary border border-secondary-container/50 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">monetization_on</span>
                    <span>+{item.rewardCoins} Koin</span>
                  </span>

                  <span className="text-xs font-mono font-bold text-on-surface-variant/70 bg-surface-container px-2.5 py-0.5 rounded-full border border-outline-variant/40">
                    {item.questions.length} Pertanyaan
                  </span>
                </div>

                <h2 className="font-headline-md text-on-surface font-bold text-base line-clamp-2 mb-1.5 leading-snug">
                  {item.title}
                </h2>

                {item.description && (
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-4">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-outline-variant/40 flex items-center justify-between mt-2">
                <span className="text-[11px] text-on-surface-variant/70">
                  {new Date(item.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="px-3 py-1.5 rounded-full border border-outline/30 text-xs font-label-lg font-semibold text-on-surface hover:bg-surface-container flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    <span>Kelola Soal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingQuiz(item)}
                    className="p-1.5 rounded-lg text-error/70 hover:bg-error-container/40 hover:text-error transition-colors"
                    title="Hapus Kuis"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Create / Edit Quiz */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  {editingQuiz ? "edit_note" : "quiz"}
                </span>
                <h2 className="font-headline-md text-primary font-bold text-base sm:text-lg">
                  {editingQuiz ? "Edit Kuis & Pertanyaan" : "Tambah Kuis Liturgi Baru"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-on-surface-variant/60 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
              {/* Quiz Header Information */}
              <div className="space-y-4 bg-surface-container-low/50 p-4 rounded-xl border border-outline-variant/50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                      Judul Kuis *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="misal: Kuis Liturgi: Peralatan Suci Ekaristi"
                      className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                      Reward Koin (+Koin)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.rewardCoins}
                      onChange={(e) =>
                        setFormData({ ...formData, rewardCoins: parseInt(e.target.value) || 10 })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm font-mono font-bold text-secondary focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                    Deskripsi Kuis (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Uji wawasan Anda seputar peralatan suci altar..."
                    className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-headline-md text-on-surface font-bold text-sm sm:text-base flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-lg">format_list_numbered</span>
                    <span>Daftar Pertanyaan ({formData.questions.length})</span>
                  </h3>

                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary-container/40 text-secondary border border-secondary-container font-label-lg text-xs font-bold hover:bg-secondary-container/60 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    <span>Tambah Soal</span>
                  </button>
                </div>

                {formData.questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="border border-outline-variant/70 rounded-2xl p-4 bg-surface space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                      <span className="font-headline-md font-bold text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                        Soal #{qIdx + 1}
                      </span>

                      {formData.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-error/70 hover:text-error text-xs flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                          <span>Hapus Soal</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                        Teks Pertanyaan *
                      </label>
                      <input
                        type="text"
                        required
                        value={q.question}
                        onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                        placeholder="Tuliskan pertanyaan di sini..."
                        className="w-full px-3.5 py-2 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface text-sm focus:border-primary focus:outline-none"
                      />
                    </div>

                    {/* Options A, B, C, D */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-label-lg text-on-surface-variant block">
                        Pilihan Jawaban (Pilih lingkaran untuk kunci jawaban yang benar) *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correctIdx === optIdx;
                          const letter = String.fromCharCode(65 + optIdx);
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                                isCorrect
                                  ? "border-emerald-500 bg-emerald-50/50"
                                  : "border-outline-variant bg-surface-container-low"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={isCorrect}
                                onChange={() => handleCorrectIdxChange(qIdx, optIdx)}
                                className="cursor-pointer text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="font-mono font-bold text-xs text-on-surface-variant w-4">
                                {letter}.
                              </span>
                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                placeholder={`Opsi ${letter}...`}
                                className="flex-1 bg-transparent text-xs text-on-surface focus:outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-label-lg text-on-surface-variant block mb-1">
                        Penjelasan Jawaban (Opsional)
                      </label>
                      <input
                        type="text"
                        value={q.explanation || ""}
                        onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                        placeholder="Penjelasan katekese mengapa jawaban tersebut benar..."
                        className="w-full px-3.5 py-1.5 rounded-xl border border-outline-variant bg-surface-container-low text-on-surface text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-full border border-outline/30 text-xs font-label-lg text-on-surface-variant hover:bg-surface-container"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction === "save-quiz"}
                  className="px-6 py-2 rounded-full bg-primary text-white text-xs font-label-lg font-bold hover:bg-primary-container shadow-sm disabled:opacity-50"
                >
                  {loadingAction === "save-quiz" ? "Menyimpan..." : "Simpan Kuis"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Quiz */}
      {deletingQuiz && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-error/30 rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-error/20 flex items-center justify-between bg-error-container/20">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-xl">warning</span>
                <h2 className="font-headline-md font-bold text-base">Hapus Kuis</h2>
              </div>
              <button
                type="button"
                onClick={() => setDeletingQuiz(null)}
                className="text-on-surface-variant/60 hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Apakah Anda yakin ingin menghapus kuis{" "}
                <span className="font-bold text-on-surface">&quot;{deletingQuiz.title}&quot;</span> beserta seluruh pertanyaan dan riwayat pengerjaannya?
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/60">
                <button
                  type="button"
                  onClick={() => setDeletingQuiz(null)}
                  className="px-4 py-2 rounded-full border border-outline/30 text-xs font-label-lg text-on-surface-variant hover:bg-surface-container"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteQuiz}
                  disabled={loadingAction === "delete-quiz"}
                  className="px-6 py-2 rounded-full bg-error text-white text-xs font-label-lg font-bold hover:bg-error/90 shadow-sm disabled:opacity-50"
                >
                  {loadingAction === "delete-quiz" ? "Menghapus..." : "Ya, Hapus Kuis"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
