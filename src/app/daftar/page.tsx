import { prisma } from "@/lib/prisma";
import { registrationOrigin } from "@/lib/registrationLinks";
import { earliestOpenDeadline } from "@/lib/registrationFields";
import { RegistrationList } from "@/components/event/RegistrationList";

export const dynamic = "force-dynamic";

export default async function RegistrationIndex() {
  const origin = registrationOrigin();
  const now = new Date();
  const events = await prisma.event.findMany({
    where: { status: "UPCOMING", registrationSlug: { not: null }, registrationDeadline: { gte: earliestOpenDeadline(now) } },
    select: {
      id: true, title: true, date: true, time: true, location: true, status: true,
      registrationSlug: true, registrationDeadline: true, capacity: true,
      _count: { select: { registrations: true } },
    },
    orderBy: { date: "asc" },
  }).catch(() => null);
  return <main className="max-w-3xl mx-auto px-4 py-12 space-y-6">
    <h1 className="font-headline-lg text-primary">Pendaftaran Acara</h1>
    {!events ? <p>Daftar acara gagal dimuat.</p> : events.length === 0 ? <p>Belum ada pendaftaran yang dibuka.</p> :
      <RegistrationList events={events} origin={origin} serverNow={+now} />}
  </main>;
}
