import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RegistrationForm } from "./RegistrationForm";
import { fieldsSchema, remainingSlots } from "@/lib/registrationFields";

export const dynamic = "force-dynamic";

export default async function RegistrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const now = new Date();
  const event = await prisma.event.findUnique({
    where: { registrationSlug: slug },
    include: { _count: { select: { registrations: true } } },
  }).catch(() => undefined);
  const remaining = event ? remainingSlots(event.capacity, event._count.registrations) : null;
  const fields = fieldsSchema.safeParse(event?.registrationFields);
  const open = event && event.status === "UPCOMING" && event.registrationDeadline && event.registrationDeadline > now && remaining !== 0;
  return <main className="max-w-2xl mx-auto px-4 py-12 space-y-6">
    <Link href="/daftar" className="underline">Daftar acara</Link>
    <h1 className="font-headline-lg text-primary">{event?.title ?? (slug === "lombanatal" ? "Lomba Natal" : "Pendaftaran acara")}</h1>
    {event && <section className="space-y-2">
      <p>{event.date.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })} · {event.time}</p>
      <p>{event.location}</p>
      <p>{event.description}</p>
      <p className="whitespace-pre-wrap">{event.registrationTerms}</p>
      <p>{remaining === null ? "Kuota tidak dibatasi" : `Sisa kuota ${remaining}`}</p>
      {event.registrationDeadline && <p>Batas pendaftaran {event.registrationDeadline.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB</p>}
    </section>}
    {event === undefined || (open && !fields.success) ? <p role="alert">Formulir gagal dimuat. Coba muat ulang atau hubungi pengurus.</p>
      : open && fields.success ? <RegistrationForm slug={slug} categories={event.registrationCategories} fields={fields.data} />
      : <p>Pendaftaran belum tersedia atau sudah ditutup.</p>}
  </main>;
}
