import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { registrationHref, registrationOrigin } from "@/lib/registrationLinks";

export const dynamic = "force-dynamic";

export default async function RegistrationIndex() {
  const origin = registrationOrigin();
  const events = await prisma.event.findMany({
    where: { status: "UPCOMING", registrationSlug: { not: null }, registrationDeadline: { gt: new Date() } },
    orderBy: { date: "asc" },
  }).catch(() => null);
  return <main className="max-w-3xl mx-auto px-4 py-12 space-y-6">
    <h1 className="font-headline-lg text-primary">Pendaftaran Acara</h1>
    {!events ? <p>Daftar acara gagal dimuat.</p> : events.length === 0 ? <p>Belum ada pendaftaran yang dibuka.</p> :
      <ul className="space-y-3">{events.map((event) => <li key={event.id} className="border rounded-lg p-4">
        {event.registrationSlug && <Link className="underline font-bold" href={registrationHref(event.registrationSlug, origin)}>{event.title}</Link>}
        <p>{event.location} · {event.time}</p>
      </li>)}</ul>}
  </main>;
}
