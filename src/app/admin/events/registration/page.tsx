import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function RegistrationSettingsPage() {
  const events = await prisma.event.findMany({ orderBy: { date: "desc" }, include: { _count: { select: { registrations: true } } } });
  return <section className="max-w-3xl space-y-5">
    <h1 className="font-headline-lg text-primary">Pengaturan Pendaftaran</h1>
    {events.length === 0 && <p>Buat jadwal kegiatan terlebih dahulu.</p>}
    {events.map((event) => <SettingsForm key={event.id} event={{
      id: event.id, title: event.title, slug: event.registrationSlug ?? "", count: event._count.registrations,
      deadline: event.registrationDeadline ? new Date(event.registrationDeadline.getTime() + 7 * 3600000).toISOString().slice(0, 16) : "",
      capacity: event.capacity, terms: event.registrationTerms ?? "", categories: event.registrationCategories.join("\n"),
    }} />)}
  </section>;
}
