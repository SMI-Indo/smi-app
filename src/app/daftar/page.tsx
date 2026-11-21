import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { registrationHref, registrationOrigin } from "@/lib/registrationLinks";
import { earliestOpenDeadline } from "@/lib/registrationFields";

export const dynamic = "force-dynamic";

export default async function RegistrationIndex() {
  const origin = registrationOrigin();
  const events = await prisma.event.findMany({
    where: { status: "UPCOMING", registrationSlug: { not: null }, registrationDeadline: { gte: earliestOpenDeadline(new Date()) } },
    include: { _count: { select: { registrations: true } } },
    orderBy: { date: "asc" },
  }).catch(() => null);
  return <main className="max-w-3xl mx-auto px-4 py-12 space-y-6">
    <h1 className="font-headline-lg text-primary">Pendaftaran Acara</h1>
    {!events ? <p>Daftar acara gagal dimuat.</p> : events.length === 0 ? <p>Belum ada pendaftaran yang dibuka.</p> :
      <ul className="space-y-3">{events.map((event) => <li key={event.id} className="border rounded-lg p-4">
        {event.registrationSlug && <Link className="underline font-bold" href={registrationHref(event.registrationSlug, origin)}>{event.title}</Link>}
        <p>{event.date.toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" })} · {event.time} · {event.location}</p>
        <p>{event.capacity !== null && event._count.registrations >= event.capacity ? "Kuota penuh" : "Pendaftaran dibuka"}</p>
        {event.registrationDeadline && <p>Batas daftar {event.registrationDeadline.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} WIB</p>}
      </li>)}</ul>}
  </main>;
}
