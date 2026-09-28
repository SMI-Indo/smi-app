import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";
import * as z from "zod";

export const revalidate = 0;

export async function GET() {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        questions: true,
        _count: {
          select: { attempts: true },
        },
      },
    });

    return NextResponse.json({ quizzes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json({ error: "Gagal memuat daftar kuis" }, { status: 500 });
  }
}

const quizQuestionSchema = z.object({
  question: z.string().min(1, "Pertanyaan tidak boleh kosong"),
  options: z.array(z.string().min(1, "Pilihan jawaban tidak boleh kosong")).min(2, "Minimal 2 pilihan"),
  correctIdx: z.number().int().min(0),
  explanation: z.string().optional().nullable(),
});

const createQuizSchema = z.object({
  title: z.string().min(2, "Judul kuis wajib diisi minimal 2 karakter"),
  description: z.string().optional().nullable(),
  rewardCoins: z.number().int().min(1).default(10),
  questions: z.array(quizQuestionSchema).min(1, "Kuis minimal harus memiliki 1 pertanyaan"),
});

export async function POST(req: NextRequest) {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createQuizSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data kuis tidak valid" },
        { status: 400 }
      );
    }

    const { title, description, rewardCoins, questions } = parsed.data;

    const newQuiz = await prisma.quiz.create({
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

    return NextResponse.json({ success: true, quiz: newQuiz }, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json({ error: "Gagal membuat kuis baru" }, { status: 500 });
  }
}
