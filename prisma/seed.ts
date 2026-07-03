import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

// Load environment variables for seeding
config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  // 1. Create a dummy Test User
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const testUser = await prisma.user.upsert({
    where: { email: "admin@smi.org" },
    update: {},
    create: {
      email: "admin@smi.org",
      name: "Stefanus Mario",
      nickname: "Mario",
      password: hashedPassword,
      role: "ADMIN",
      parish: "Paroki Katedral Jakarta",
      rank: "Utama",
      memberId: "SMI-2026-0001",
      coins: 20,
      attendanceCount: 15,
      cardValidUntil: new Date("2028-12-31"),
    },
  });
  console.log("Seed: Test user created:", testUser.email);

  // 2. Create Dummy Events
  // Clear first to avoid duplicate seeds on local runs
  await prisma.event.deleteMany({});
  await prisma.event.createMany({
    data: [
      {
        title: "Tugas Misa Hari Minggu Raya",
        description: "Tugas misdinar untuk Misa Minggu Pagi di Katedral",
        category: "TUGAS",
        date: new Date("2026-07-12"),
        time: "07:30 - 09:00 WIB",
        location: "Gereja Katedral Jakarta",
        status: "UPCOMING",
      },
      {
        title: "Latihan Rutin Liturgi & Sakramen",
        description: "Latihan rutin pengenalan tata cara sakramen baptis & pernikahan",
        category: "LATIHAN",
        date: new Date("2026-07-08"),
        time: "15:00 - 17:00 WIB",
        location: "Gedung Pastoral Lt. 2",
        status: "UPCOMING",
      },
      {
        title: "Pertemuan Jambore Misdinar Keuskupan",
        description: "Sosialisasi pendaftaran Jambore Misdinar tingkat Keuskupan",
        category: "ACARA",
        date: new Date("2026-06-30"),
        time: "10:00 - 12:00 WIB",
        location: "Aula Paroki",
        status: "COMPLETED",
      },
    ],
  });
  console.log("Seed: Dummy events created");

  // 3. Create Dummy Videos
  await prisma.video.deleteMany({});
  await prisma.video.createMany({
    data: [
      {
        title: "Tata Cara Membawa Wiruk & Dupa Misa",
        description: "Panduan lengkap gerakan dan tata tertib pembawa dupa dalam misa meriah.",
        category: "TUTORIAL",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://images.unsplash.com/photo-1548625361-155deee223d5",
        duration: "08:45",
        author: "Tim Katekese Liturgi",
        isFeatured: true,
        viewsCount: 345,
      },
      {
        title: "Fun Fact Misdinar Indonesia Keuskupan Agung",
        description: "Sejarah unik dan fakta menarik dibalik perhimpunan putra-putri altar.",
        category: "FUN_FACT",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8",
        duration: "04:12",
        author: "Media SMI",
        isFeatured: false,
        viewsCount: 1200,
      },
      {
        title: "Highlight Jambore Nasional Misdinar VII",
        description: "Keseruan kumpul akbar misdinar seluruh Indonesia di wisma wisata.",
        category: "GALLERY",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622",
        duration: "12:30",
        author: "Panitia Jamnas",
        isFeatured: false,
        viewsCount: 890,
      },
    ],
  });
  console.log("Seed: Dummy videos created");

  // 4. Create Dummy Mission Tasks
  await prisma.missionTask.deleteMany({});
  await prisma.missionTask.createMany({
    data: [
      {
        title: "Mengikuti Event Bulanan",
        description: "Hadir dan bertugas di perayaan ekaristi bulanan paroki",
        rewardCoins: 10,
        category: "Event Bulanan",
      },
      {
        title: "Partisipan Aktif Misa",
        description: "Tingkatkan kehadiran tugas mingguan di paroki Anda",
        rewardCoins: 5,
        category: "Misi Harian",
      },
      {
        title: "Menyelesaikan Kursus Liturgi",
        description: "Pelajari modul liturgi sakramen ekaristi tingkat dasar",
        rewardCoins: 5,
        category: "Pendidikan",
      },
    ],
  });
  console.log("Seed: Mission tasks created");
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
