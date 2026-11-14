import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { adminRegistrationHref } from "./paths";

export const dynamic = "force-dynamic";

export default async function RegistrationSettingsPage() {
  const events = await prisma.event.findMany({
    orderBy: [{ date: "desc" }, { id: "asc" }],
    select: {
      id: true, title: true, date: true, registrationSlug: true, capacity: true,
      _count: { select: { registrations: true } },
    },
  });

  return (
    <section className="max-w-4xl space-y-5">
      <h1 className="font-headline-lg text-primary">Pendaftaran Acara</h1>
      {events.length === 0 ? (
        <p>Belum ada kegiatan. <Link href="/admin/events" className="underline">Buka jadwal kegiatan</Link>.</p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {events.map((event) => (
            <li key={event.id} className="min-w-0">
              <Link href={adminRegistrationHref(event.id, event.registrationSlug)}
                className="block h-full space-y-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <p className="text-sm">{event.date.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "long" })}</p>
                <h2 className="font-headline-md break-words text-primary">{event.title}</h2>
                <p className="text-sm">{event.registrationSlug
                  ? `${event._count.registrations} peserta · ${event.capacity === null ? "Tanpa batas kuota" : `Kuota ${event.capacity}`}`
                  : "Pendaftaran belum diatur"}</p>
                <p className="font-semibold text-primary underline">Kelola pendaftaran</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
