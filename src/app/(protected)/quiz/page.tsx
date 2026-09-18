import { prisma } from "@/lib/prisma";
import { QuizInteractive, QuizData } from "@/components/quiz/QuizInteractive";

export const revalidate = 60; // Cache 60 detik

const initialQuizSeeds: QuizData[] = [
  {
    id: "quiz-bejana-liturgi",
    title: "Mengenal Peralatan Suci Ekaristi (Bejana Liturgi)",
    description: "Kuis pengenalan piala, sibori, patena, ampul, dan kain-kain suci altar.",
    rewardCoins: 15,
    questions: [
      {
        id: "q1-bejana",
        question: "Wadah suci yang digunakan untuk meletakkan Tubuh Kristus (hosti besar) dalam perayaan Ekaristi disebut...",
        options: ["Piala", "Patena", "Sibori", "Monstrans"],
        correctIdx: 1,
        explanation: "Patena adalah piring logam suci berlapis emas untuk meletakkan Hosti besar Imam.",
      },
      {
        id: "q2-bejana",
        question: "Wadah bertutup yang digunakan untuk menyimpan dan membagikan Hosti Kudus umat adalah...",
        options: ["Sibori", "Piksis", "Piala", "Ampul"],
        correctIdx: 0,
        explanation: "Sibori adalah cawan suci bertutup untuk menyimpan Hosti Kudus di tabernakel.",
      },
      {
        id: "q3-bejana",
        question: "Dua botol kecil kaca bertutup untuk air dan anggur kurban disebut...",
        options: ["Lavabo", "Ampul", "Piksis", "Kruset"],
        correctIdx: 1,
        explanation: "Ampul adalah sepasang kendi kecil untuk air (A/Aq) dan anggur (V/Vin).",
      },
      {
        id: "q4-bejana",
        question: "Kain putih kecil yang digunakan misdinar dan imam untuk mengeringkan piala dan bibir cawan adalah...",
        options: ["Korporale", "Purifikatorium", "Palla", "Velum"],
        correctIdx: 1,
        explanation: "Purifikatorium adalah kain pembersih/pengering piala dan bejana suci.",
      },
    ],
  },
  {
    id: "quiz-tata-gerak-misdinar",
    title: "Tata Gerak & Sikap Doa Misdinar Daring",
    description: "Kuis etika berbusana liturgi, sikap tangan mengatup, dan penghormatan altar.",
    rewardCoins: 10,
    questions: [
      {
        id: "q1-gerak",
        question: "Sikap tangan mengatup di dada yang benar melambangkan...",
        options: [
          "Istirahat saat bertugas",
          "Kesiapsiagaan dan doa yang terarah kepada Tuhan",
          "Tanda penghormatan kepada rekan misdinar",
          "Tanda bahwa tugas telah selesai",
        ],
        correctIdx: 1,
        explanation: "Tangan mengatup di dada adalah simbol keterarahan hati dan jiwa yang siaga berdoa.",
      },
      {
        id: "q2-gerak",
        question: "Saat melintas di depan Tabernakel yang ada lilin bernyala, sikap penghormatan yang tepat adalah...",
        options: ["Membungkuk khidmat", "Berlutut dengan satu kaki (genuflectio)", "Mengangguk cepat", "Berjalan tegak"],
        correctIdx: 1,
        explanation: "Genufleksi (berlutut satu kaki ke lantai) dilakukan di hadapan Sakramen Mahakudus.",
      },
      {
        id: "q3-gerak",
        question: "Warna liturgi yang melambangkan pertobatan, penantian, dan masa prapaskah/adven adalah...",
        options: ["Merah", "Ungu", "Putih", "Hijau"],
        correctIdx: 1,
        explanation: "Warna liturgi ungu melambangkan pertobatan, matiraga, dan mawas diri.",
      },
    ],
  },
  {
    id: "quiz-komunitas-smi",
    title: "Hierarki & Ruang Lingkup Komunitas Sahabat Misdinar Indonesia (SMI)",
    description: "Wawasan pembinaan seputar kegiatan komunitas daring, solidaritas misdinar nusantara, dan pelayanan altar.",
    rewardCoins: 20,
    questions: [
      {
        id: "q1-smi",
        question: "Komunitas Sahabat Misdinar Indonesia (SMI) berfokus utama pada kegiatan...",
        options: [
          "Pertemuan online, webinar nasional, dan wadah persahabatan misdinar se-Indonesia",
          "Pengaturan jadwal sakristi paroki lokal",
          "Penjualan perlengkapan gereja komersial",
          "Latihan paduan suara gereja",
        ],
        correctIdx: 0,
        explanation: "SMI adalah wadah persahabatan, webinar daring, dan pembinaan nasional putra-putri altar Indonesia.",
      },
      {
        id: "q2-smi",
        question: "Sikap utama seorang putra-putri altar dalam melayani perjumpaan sesama misdinar adalah...",
        options: [
          "Sombong dan merasa paling tahu liturgi",
          "Rendah hati, disiplin, dan bersukacita dalam persaudaraan Kristus",
          "Bersaing mencari popularitas di media sosial",
          "Pasif dan tidak mempedulikan sesama",
        ],
        correctIdx: 1,
        explanation: "Putra-putri altar dipanggil untuk menjadi teladan kerendahan hati dan persaudaraan.",
      },
    ],
  },
];

export default async function QuizPage() {
  let quizzes: QuizData[] = initialQuizSeeds;

  try {
    let dbQuizzes = await prisma.quiz.findMany({
      include: { questions: true },
      orderBy: { createdAt: "desc" },
    });

    // Jika tabel kuis di database masih kosong, lakukan inisialisasi otomatis ke database
    if (dbQuizzes.length === 0) {
      for (const seed of initialQuizSeeds) {
        await prisma.quiz.create({
          data: {
            id: seed.id,
            title: seed.title,
            description: seed.description,
            rewardCoins: seed.rewardCoins,
            questions: {
              create: seed.questions.map((q) => ({
                id: q.id,
                question: q.question,
                options: q.options,
                correctIdx: q.correctIdx,
                explanation: q.explanation,
              })),
            },
          },
        });
      }

      dbQuizzes = await prisma.quiz.findMany({
        include: { questions: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (dbQuizzes.length > 0) {
      quizzes = dbQuizzes.map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description,
        rewardCoins: q.rewardCoins,
        questions: q.questions.map((ques) => ({
          id: ques.id,
          question: ques.question,
          options: ques.options,
          correctIdx: ques.correctIdx,
          explanation: ques.explanation,
        })),
      }));
    }
  } catch {
    quizzes = initialQuizSeeds;
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <QuizInteractive quizzes={quizzes} />
    </main>
  );
}
