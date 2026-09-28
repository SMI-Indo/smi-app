import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

// Load environment variables for seeding
config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  // 1. Create a Test Admin User
  const hashedPassword = await bcrypt.hash("password123", 10);

  const testUser = await prisma.user.upsert({
    where: { email: "admin@smi.org" },
    update: {
      isApproved: true,
      role: "ADMIN",
    },
    create: {
      email: "admin@smi.org",
      name: "Pengurus Pusat SMI",
      nickname: "Admin SMI",
      password: hashedPassword,
      role: "ADMIN",
      parish: "Komunitas Sahabat Misdinar Indonesia",
      rank: "Pengurus",
      memberId: "SMI-ADM-001",
      coins: 100,
      attendanceCount: 25,
      isApproved: true,
      violationPoints: 0,
      cardValidUntil: new Date("2028-12-31"),
    },
  });
  console.log("Seed: Test admin created/verified:", testUser.email);

  // 1.1 Create Public Relations Admin Users
  await prisma.user.upsert({
    where: { email: "publicrelation@smi.org" },
    update: {
      isApproved: true,
      role: "ADMIN",
    },
    create: {
      email: "publicrelation@smi.org",
      name: "Public Relations SMI",
      nickname: "PubRel SMI",
      password: hashedPassword,
      role: "ADMIN",
      parish: "Komunitas Sahabat Misdinar Indonesia",
      rank: "Pengurus Humas",
      memberId: "SMI-PUBREL-001",
      coins: 100,
      attendanceCount: 25,
      isApproved: true,
      violationPoints: 0,
      cardValidUntil: new Date("2028-12-31"),
    },
  });

  await prisma.user.upsert({
    where: { email: "publicrelationsahabatmisdinar@gmail.com" },
    update: {
      isApproved: true,
      role: "ADMIN",
      password: hashedPassword,
    },
    create: {
      email: "publicrelationsahabatmisdinar@gmail.com",
      name: "Public Relation SMI",
      nickname: "PubRel SMI",
      password: hashedPassword,
      role: "ADMIN",
      parish: "Komunitas Sahabat Misdinar Indonesia",
      rank: "Pengurus Humas",
      memberId: "SMI-PR-001",
      coins: 100,
      attendanceCount: 25,
      isApproved: true,
      violationPoints: 0,
      cardValidUntil: new Date("2028-12-31"),
    },
  });
  console.log("Seed: Public Relations admin accounts verified");

  // 2. Create Real SMI Online Community Events (Webinar, Temu Virtual)
  await prisma.event.deleteMany({});
  await prisma.event.createMany({
    data: [
      {
        title: "Webinar Nasional: Spiritualitas Pelayanan Putra-Putri Altar",
        description: "Pendalaman iman dan spiritualitas misdinar bersama Komisi Liturgi secara daring via Zoom",
        category: "WEBINAR",
        date: new Date("2026-09-25"),
        time: "19:00 - 21:00 WIB",
        location: "Zoom Meeting & YouTube Live SMI",
        status: "UPCOMING",
      },
      {
        title: "Temu Virtual Misdinar Nusantara: Berbagi Pengalaman Pelayanan",
        description: "Ruang temu akrab online antar putra-putri altar dari berbagai keuskupan di Indonesia",
        category: "TEMU_ONLINE",
        date: new Date("2026-10-04"),
        time: "15:00 - 17:30 WIB",
        location: "Google Meet SMI",
        status: "UPCOMING",
      },
      {
        title: "Workshop Daring: Tata Busana dan Perlengkapan Suci Liturgi",
        description: "Pelatihan daring visual mengenai pemeliharaan dan pemakaian perlengkapan liturgi",
        category: "WORKSHOP",
        date: new Date("2026-10-18"),
        time: "10:00 - 12:30 WIB",
        location: "Zoom Cloud Meeting",
        status: "UPCOMING",
      },
      {
        title: "Pertemuan Daring Evaluasi & Doa Bersama Pengurus SMI",
        description: "Sesi doa adorasi virtual dan koordinasi kegiatan bulanan Sahabat Misdinar Indonesia",
        category: "ACARA",
        date: new Date("2026-08-30"),
        time: "19:30 - 21:00 WIB",
        location: "Ruang Virtual SMI",
        status: "COMPLETED",
      },
    ],
  });
  console.log("Seed: SMI Online Events created");

  // 3. Create Videos
  await prisma.video.deleteMany({});
  await prisma.video.createMany({
    data: [
      {
        title: "Panduan Memahami Makna Peralatan Suci Ekaristi",
        description: "Penjelasan mendalam arti teologis piala, sibori, patena, dan perlengkapan suci lainnya.",
        category: "TUTORIAL",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://images.unsplash.com/photo-1548625361-155deee223d5",
        duration: "10:15",
        author: "Tim Katekese Liturgi SMI",
        isFeatured: true,
        viewsCount: 1450,
      },
      {
        title: "Fun Fact Komunitas Misdinar Indonesia",
        description: "Sejarah unik dan fakta menarik dibalik perhimpunan putra-putri altar nusantara.",
        category: "FUN_FACT",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8",
        duration: "06:30",
        author: "Media Daring SMI",
        isFeatured: false,
        viewsCount: 2200,
      },
      {
        title: "Dokumentasi Temu Daring Nasional Sahabat Misdinar Indonesia",
        description: "Keseruan kumpul virtual misdinar dari Sabang sampai Merauke.",
        category: "GALLERY",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622",
        duration: "14:20",
        author: "Humas SMI Pusat",
        isFeatured: false,
        viewsCount: 3100,
      },
    ],
  });
  console.log("Seed: Videos created");

  // 4. Create Mission Tasks (Online participation)
  await prisma.missionTask.deleteMany({});
  await prisma.missionTask.createMany({
    data: [
      {
        title: "Hadir Webinar Liturgi Daring SMI",
        description: "Ikuti webinar nasional bulanan bersama narasumber liturgi Katolik",
        rewardCoins: 20,
        category: "Webinar Online",
      },
      {
        title: "Partisipasi Temu Virtual Misdinar",
        description: "Hadir dalam ruang temu virtual komunitas Sahabat Misdinar Indonesia",
        rewardCoins: 15,
        category: "Temu Virtual",
      },
      {
        title: "Selesaikan Kuis Liturgi Mingguan",
        description: "Uji wawasan liturgi dan raih koin kuis di menu Kuis Edukasi",
        rewardCoins: 10,
        category: "Kuis Edukasi",
      },
    ],
  });
  console.log("Seed: Mission tasks created");

  // 5. Create Rewards Merchandise
  await prisma.reward.deleteMany({});
  await prisma.reward.createMany({
    data: [
      {
        title: "Kaos Polo Resmi SMI 2026",
        description: "Polo shirt bordir logo Sahabat Misdinar Indonesia bahan katun premium.",
        coinCost: 50,
        stock: 25,
        isAvailable: true,
      },
      {
        title: "Pin Enamel Sahabat Misdinar Indonesia",
        description: "Pin logam enamel emas edisi khusus Sahabat Misdinar Indonesia.",
        coinCost: 20,
        stock: 100,
        isAvailable: true,
      },
      {
        title: "Buku Saku Liturgi Digital & Fisik SMI",
        description: "Buku pedoman pengetahuan bejana liturgi, warna liturgi, dan doa putra-putri altar.",
        coinCost: 30,
        stock: 45,
        isAvailable: true,
      },
    ],
  });
  console.log("Seed: Rewards merchandise created");

  // 6. Create Real Quizzes and Quiz Questions in Database
  await prisma.userQuizAttempt.deleteMany({});
  await prisma.quizQuestion.deleteMany({});
  await prisma.quiz.deleteMany({});

  await prisma.quiz.create({
    data: {
      id: "quiz-bejana-liturgi",
      title: "Mengenal Peralatan Suci Ekaristi (Bejana Liturgi)",
      description: "Kuis pengenalan piala, sibori, patena, ampul, dan kain-kain suci altar.",
      rewardCoins: 15,
      questions: {
        create: [
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
    },
  });

  await prisma.quiz.create({
    data: {
      id: "quiz-tata-gerak-misdinar",
      title: "Tata Gerak & Sikap Doa Misdinar Daring",
      description: "Kuis etika berbusana liturgi, sikap tangan mengatup, dan penghormatan altar.",
      rewardCoins: 10,
      questions: {
        create: [
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
    },
  });

  await prisma.quiz.create({
    data: {
      id: "quiz-komunitas-smi",
      title: "Hierarki & Ruang Lingkup Komunitas Sahabat Misdinar Indonesia (SMI)",
      description: "Wawasan pembinaan seputar kegiatan komunitas daring, solidaritas misdinar nusantara, dan pelayanan altar.",
      rewardCoins: 20,
      questions: {
        create: [
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
    },
  });
  console.log("Seed: Quizzes and Questions created in Database");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
