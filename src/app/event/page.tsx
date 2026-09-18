import { prisma } from "@/lib/prisma";
import { EventScheduler } from "@/components/event/EventScheduler";
import { Event as PrismaEvent } from "@prisma/client";

export const revalidate = 60; // Cache selama 60 detik

export default async function EventPage() {
  let events: PrismaEvent[] = [];
  try {
    events = await prisma.event.findMany({
      where: {
        category: { in: ["WEBINAR", "TEMU_ONLINE", "WORKSHOP", "ACARA"] },
      },
      orderBy: { date: "asc" },
      take: 100,
    });
  } catch {
    // Graceful degradation bila database tidur atau koneksi terputus
    events = [];
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Wide documentation banner */}
      <section className="relative h-64 bg-neutral-900 overflow-hidden flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 to-transparent" />
        <div className="relative text-center z-10 space-y-2">
          <h1 className="font-headline-lg text-white">Jadwal Pertemuan Daring &amp; Webinar SMI</h1>
          <p className="font-body-md text-surface-container-high text-sm md:text-base">
            Pantau terus agenda webinar, temu virtual, dan ruang pembinaan daring Sahabat Misdinar Indonesia.
          </p>
        </div>
      </section>

      {/* Scheduler Interactive area */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <EventScheduler initialEvents={events} />
      </section>
    </main>
  );
}
