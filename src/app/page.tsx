import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AnnouncementMarquee } from "@/components/home/AnnouncementMarquee";
import { Event as PrismaEvent } from "@prisma/client";

export const revalidate = 60; // Cache for 60 seconds

export default async function HomePage() {
  // Fetch next 2 upcoming events
  const upcomingEvents = await prisma.event.findMany({
    where: { status: "UPCOMING" },
    orderBy: { date: "asc" },
    take: 2,
  });

  // Fetch featured video
  const featuredVideo = await prisma.video.findFirst({
    where: { isFeatured: true },
  });

  return (
    <main className="min-h-screen bg-background">
      {/* 1. Hero Section */}
      <section className="relative h-[80vh] md:h-[70vh] bg-neutral-900 overflow-hidden flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1548625361-155deee223d5?q=80&w=1200')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-900/80 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-4 w-full flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl space-y-6 text-left">
            <h1 className="font-display-lg text-white text-4xl md:text-5xl leading-tight">
              Melayani dengan Kasih, <br />
              <span className="text-secondary-container">Tumbuh Bersama Liturgi</span>
            </h1>
            <p className="font-body-md text-surface-container-high text-base md:text-lg">
              Sahabat Misdinar Indonesia adalah wadah kebersamaan, pembelajaran liturgi, dan apresiasi komitmen pelayanan Putra-Putri Altar di seluruh Indonesia.
            </p>
            <div className="flex gap-4">
              <Link
                href="/event"
                className="bg-primary text-white font-label-lg px-8 py-4 rounded-full hover:bg-primary-container transition-all active:scale-95"
              >
                Mulai Menjelajah
              </Link>
            </div>
          </div>
          {/* Circular Logo on Right (hidden on mobile) */}
          <div className="hidden md:flex w-64 h-64 rounded-full bg-secondary-container/10 border-4 border-secondary-container/45 items-center justify-center backdrop-blur-sm inner-glow animate-pulse">
            <div className="w-48 h-48 rounded-full bg-primary flex items-center justify-center text-white text-5xl font-display-lg border-2 border-outline-variant">
              SMI
            </div>
          </div>
        </div>
      </section>

      {/* 2. Announcement Marquee */}
      <AnnouncementMarquee />

      {/* 3. Main Content Previews Container */}
      <section className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Schedule Preview (2 Cards) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">calendar_month</span>
                <span>Jadwal Kegiatan Terdekat</span>
              </h2>
              <Link href="/event" className="font-label-sm text-secondary hover:underline">
                Lihat Semua
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((evt: PrismaEvent) => (
                  <div 
                    key={evt.id} 
                    className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant card-glow flex flex-col justify-between h-48"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-label-sm text-xs px-3 py-1 rounded-full bg-primary/10 text-primary">
                          {evt.category}
                        </span>
                        <span className="font-label-sm text-[10px] uppercase text-on-surface-variant font-bold">
                          {evt.status === "UPCOMING" ? "Akan Datang" : "Selesai"}
                        </span>
                      </div>
                      <h3 className="font-body-lg font-bold text-on-surface line-clamp-2">
                        {evt.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-mono mt-4">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>{evt.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-12 text-center rounded-2xl bg-surface-container-low border border-dashed border-outline text-on-surface-variant">
                  Tidak ada jadwal terdekat.
                </div>
              )}
            </div>
          </div>

          {/* Right: Featured Video Card */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">play_circle</span>
                <span>Video Unggulan</span>
              </h2>
              <Link href="/video" className="font-label-sm text-secondary hover:underline">
                Galeri
              </Link>
            </div>

            {featuredVideo ? (
              <div className="rounded-2xl overflow-hidden border border-outline-variant bg-surface-container-low card-glow flex flex-col">
                <div className="relative aspect-video bg-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredVideo.thumbnail || ""}
                    alt={featuredVideo.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Link
                      href="/video"
                      className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center card-glow hover:scale-105 transition-transform"
                    >
                      <span className="material-symbols-outlined text-3xl">play_arrow</span>
                    </Link>
                  </div>
                  <span className="absolute bottom-3 right-3 bg-neutral-900/80 px-2 py-1 rounded text-[10px] text-white font-mono">
                    {featuredVideo.duration}
                  </span>
                </div>
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <span className="font-label-sm text-[10px] text-primary uppercase font-bold tracking-wider">
                      {featuredVideo.category}
                    </span>
                    <h3 className="font-body-md font-bold text-on-surface mt-1 line-clamp-2">
                      {featuredVideo.title}
                    </h3>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2">
                    Oleh: {featuredVideo.author}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-center rounded-2xl bg-surface-container-low border border-dashed border-outline text-on-surface-variant">
                Belum ada video unggulan.
              </div>
            )}
          </div>
        </div>

        {/* 4. Coin Incentive Highlight Banner */}
        <div className="w-full p-8 md:p-12 rounded-[2rem] bg-gradient-to-r from-primary to-primary-container text-white card-glow flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
          <div className="space-y-3 z-10 text-left">
            <span className="font-label-lg bg-white/20 text-white px-4 py-1.5 rounded-full inline-block text-xs">
              SISTEM APRESIASI KOIN
            </span>
            <h2 className="font-headline-lg text-2xl md:text-3xl">
              Kumpulkan Koin &amp; Klaim Merchandise!
            </h2>
            <p className="font-body-md text-surface-container max-w-xl text-sm md:text-base">
              Setiap kali Anda menghadiri tugas misa bulanan, latihan bersama, atau menyelesaikan materi katekese, klaim koin Anda dan tukarkan di katalog merchandise resmi SMI.
            </p>
          </div>
          <Link
            href="/coin"
            className="z-10 bg-secondary-container hover:bg-secondary-container/90 text-on-background font-label-lg px-8 py-4 rounded-full transition-all active:scale-95 text-center whitespace-nowrap"
          >
            KUMPULKAN SEKARANG
          </Link>
        </div>
      </section>
    </main>
  );
}
