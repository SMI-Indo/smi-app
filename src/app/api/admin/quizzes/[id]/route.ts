import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";
import * as z from "zod";

const quizQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1, "Pertanyaan tidak boleh kosong"),
  options: z.array(z.string().min(1, "Pilihan jawaban tidak boleh kosong")).min(2, "Minimal 2 pilihan"),
  correctIdx: z.number().int().min(0),
  explanation: z.string().optional().nullable(),
});

const updateQuizSchema = z.object({
  title: z.string().min(2, "Judul kuis wajib diisi minimal 2 karakter"),
  description: z.string().optional().nullable(),
  rewardCoins: z.number().int().min(1).default(10),
  questions: z.array(quizQuestionSchema).min(1, "Kuis minimal harus memiliki 1 pertanyaan"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Kuis tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ quiz }, { status: 200 });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json({ error: "Gagal memuat kuis" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateQuizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data kuis tidak valid" },
        { status: 400 }
      );
    }

    const { title, description, rewardCoins, questions } = parsed.data;

    // Use transaction to update quiz and recreate questions cleanly
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Delete existing questions for this quiz
      await tx.quizQuestion.deleteMany({
        where: { quizId: id },
      });

      // 2. Update quiz info and create new questions
      return await tx.quiz.update({
        where: { id },
        data: {
          title: title.trim(),
          description: description ? description.trim() : null,
          rewardCoins,
          questions: {
            create: questions.map((q) => ({
              question: q.question.trim(),
              options: q.options.map((opt) => opt.trim()),
              correctIdx: q.correctIdx,
              explanation: q.explanation ? q.explanation.trim() : null,
            })),
          },
        },
        include: {
          questions: true,
        },
      });
    });

    return NextResponse.json({ success: true, quiz: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json({ error: "Gagal memperbarui kuis" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.quiz.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: "Kuis berhasil dihapus." }, { status: 200 });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    return NextResponse.json({ error: "Gagal menghapus kuis" }, { status: 500 });
  }
}
