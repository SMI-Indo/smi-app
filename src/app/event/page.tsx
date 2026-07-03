import { prisma } from "@/lib/prisma";
import { EventScheduler } from "@/components/event/EventScheduler";

export const revalidate = 60; // Cache selama 60 detik

export default async function EventPage() {
  // Ambil semua jadwal kegiatan dari database Supabase
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
  });

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
          <h1 className="font-headline-lg text-white">Jadwal Tugas, Latihan &amp; Acara</h1>
          <p className="font-body-md text-surface-container-high text-sm md:text-base">
            Pantau terus agenda pelayanan liturgi Putra-Putri Altar secara real-time.
          </p>
        </div>
      </section>

      {/* Scheduler Interactive area */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <EventScheduler initialEvents={events as any} />
      </section>
    </main>
  );
}
