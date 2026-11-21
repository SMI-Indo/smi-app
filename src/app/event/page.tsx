import { prisma } from "@/lib/prisma";
import { EventScheduler } from "@/components/event/EventScheduler";
import type { Event as PrismaEvent } from "@prisma/client";
import { registrationOrigin } from "@/lib/registrationLinks";

export const dynamic = "force-dynamic";

export default async function EventPage() {
  let events: (PrismaEvent & { _count: { registrations: number } })[] = [];
  let unavailable = false;
  try {
    events = await prisma.event.findMany({
      where: {
        category: { in: ["WEBINAR", "TEMU_ONLINE", "WORKSHOP", "ACARA"] },
      },
      include: { _count: { select: { registrations: true } } },
      orderBy: { date: "asc" },
    });
  } catch {
    unavailable = true;
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
        {unavailable ? <p role="alert">Jadwal belum bisa dimuat. Coba muat ulang halaman.</p> : <EventScheduler initialEvents={events} registrationBase={registrationOrigin()} serverNow={new Date().getTime()} />}
      </section>
    </main>
  );
}
