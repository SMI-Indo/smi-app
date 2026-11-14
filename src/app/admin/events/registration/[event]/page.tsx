import { prisma } from "@/lib/prisma";
import { SettingsForm } from "../SettingsForm";
import { ParticipantControls } from "../ParticipantControls";
import { answersSchema, fieldsSchema, isWebLink } from "@/lib/registrationFields";
import { registrationHref, registrationOrigin } from "@/lib/registrationLinks";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { adminRegistrationHref, suggestRegistrationSlug } from "../paths";

export const dynamic = "force-dynamic";

export default async function EventRegistrationSettingsPage({ params, searchParams }: {
  params: Promise<{ event: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { event: route } = await params;
  const { saved } = await searchParams;
  const event = await prisma.event.findUnique({
    where: route.startsWith("~") ? { id: route.slice(1) } : { registrationSlug: route },
    include: { registrations: { orderBy: { createdAt: "desc" } } },
  });
  if (!event) notFound();
  if (route.startsWith("~") && event.registrationSlug) redirect(adminRegistrationHref(event.id, event.registrationSlug));

  const origin = registrationOrigin();
  const fields = fieldsSchema.safeParse(event.registrationFields);
  const publicHref = event.registrationSlug ? registrationHref(event.registrationSlug, origin) : null;

  return <section className="max-w-5xl space-y-6">
    <header className="border-b border-outline-variant pb-5">
      <Link href="/admin/events/registration" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline">
        <span aria-hidden="true">←</span> Daftar kegiatan
      </Link>
      <h1 className="mt-2 wrap-anywhere text-3xl font-bold leading-tight text-on-surface sm:text-4xl">{event.title}</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        {event.registrations.length} peserta terdaftar · {event.capacity === null ? "Tanpa batas kuota" : `Kuota ${event.capacity}`}
      </p>
      {publicHref ? (
        <Link href={publicHref} target="_blank" rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline px-3 text-sm font-semibold text-primary hover:bg-surface-container-low">
          Buka formulir publik <span aria-hidden="true">↗</span><span className="sr-only"> (tab baru)</span>
        </Link>
      ) : <p className="mt-3 text-sm text-on-surface-variant">Simpan pengaturan untuk membuat tautan pendaftaran.</p>}
    </header>
    {saved === "1" && <p role="status" className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-medium">Pengaturan disimpan.</p>}
    <section aria-labelledby="registration-settings-title" className="min-w-0 max-w-3xl rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-6">
      <h2 id="registration-settings-title" className="mb-5 border-b border-outline-variant pb-4 text-2xl font-semibold">Pengaturan formulir</h2>
      {fields.success ? <SettingsForm event={{
        id: event.id, slug: event.registrationSlug ?? suggestRegistrationSlug(event.title),
        deadline: event.registrationDeadline ? new Date(event.registrationDeadline.getTime() + 7 * 3600000).toISOString().slice(0, 16) : "",
        capacity: event.capacity, terms: event.registrationTerms ?? "", categories: event.registrationCategories.join("\n"),
        fields: fields.data,
      }} /> : <p role="alert" className="text-sm text-error">Konfigurasi kolom gagal dimuat. Hubungi pengelola sistem.</p>}
    </section>
    <details className="min-w-0 max-w-3xl rounded-xl border border-outline-variant bg-surface-container-lowest">
      <summary className="min-h-11 cursor-pointer rounded-xl px-4 py-3 text-lg font-semibold hover:text-primary sm:px-6">Rekap peserta</summary>
      {event.registrations.length === 0 ? <p className="border-t border-outline-variant px-4 py-4 text-sm text-on-surface-variant sm:px-6">Belum ada peserta.</p> : (
        <ul className="divide-y divide-outline-variant border-t border-outline-variant">
          {event.registrations.map((item) => {
            const answers = answersSchema.safeParse(item.customAnswers);
            return (
              <li key={item.id} className="grid gap-4 px-4 py-5 wrap-anywhere sm:grid-cols-2 sm:px-6">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-on-surface-variant">{item.email}</p>
                </div>
                <dl className="space-y-2 text-sm">
                  <div><dt className="font-medium">Asal paroki</dt><dd>{item.community}</dd></div>
                  {item.category && <div><dt className="font-medium">Cabang</dt><dd>{item.category}</dd></div>}
                  <div><dt className="font-medium">Kode registrasi</dt><dd>{item.id}</dd></div>
                  {item.phone && <div><dt className="font-medium">WhatsApp</dt><dd>{item.phone}</dd></div>}
                  {item.notes && <div><dt className="font-medium">Catatan</dt><dd className="whitespace-pre-wrap">{item.notes}</dd></div>}
                  {answers.success && answers.data.map(({ id, label, type, value }) => (
                    <div key={id}>
                      <dt className="font-medium">{label}</dt>
                      <dd className="whitespace-pre-wrap">{type === "url" && isWebLink(value)
                        ? <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-primary underline">
                          Buka tautan <span className="sr-only">{label} (tab baru)</span>
                        </a>
                        : value}</dd>
                    </div>
                  ))}
                </dl>
                <ParticipantControls eventId={event.id} id={item.id} name={item.name} email={item.email} />
              </li>
            );
          })}
        </ul>
      )}
    </details>
  </section>;
}
