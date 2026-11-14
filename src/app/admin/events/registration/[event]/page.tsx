import { prisma } from "@/lib/prisma";
import { SettingsForm } from "../SettingsForm";
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

  return <section className="max-w-5xl space-y-5">
    <Link href="/admin/events/registration" className="inline-flex min-h-11 items-center text-primary underline">Kembali ke daftar kegiatan</Link>
    {saved === "1" && <p role="status">Pengaturan disimpan.</p>}
    <article className="min-w-0 space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:p-6">
      <header className="space-y-2">
        <h1 className="font-headline-lg break-words text-primary">{event.title}</h1>
        <p>{event.registrations.length} peserta · {event.capacity === null ? "Tanpa batas kuota" : `Kuota ${event.capacity}`}</p>
        {event.registrationSlug ? (
          <Link href={registrationHref(event.registrationSlug, origin)} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center font-semibold text-primary underline">Buka formulir {event.title} (tab baru)</Link>
        ) : <p className="text-sm">Simpan pengaturan untuk membuat tautan pendaftaran.</p>}
      </header>
      {fields.success ? <SettingsForm event={{
        id: event.id, slug: event.registrationSlug ?? suggestRegistrationSlug(event.title),
        deadline: event.registrationDeadline ? new Date(event.registrationDeadline.getTime() + 7 * 3600000).toISOString().slice(0, 16) : "",
        capacity: event.capacity, terms: event.registrationTerms ?? "", categories: event.registrationCategories.join("\n"),
        fields: fields.data,
      }} /> : <p role="alert">Konfigurasi kolom rusak. Hubungi pengelola sistem.</p>}
      <details className="border-t border-outline-variant">
        <summary className="flex min-h-11 items-center py-2 cursor-pointer font-semibold">Rekap peserta</summary>
        {event.registrations.length === 0 ? <p>Belum ada peserta.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr>{["Nama", "Email", "Asal paroki", "Cabang", "Kode", "Jawaban tambahan"].map((label) =>
                <th key={label} scope="col" className="border-b p-2">{label}</th>)}</tr></thead>
              <tbody>{event.registrations.map((item) => {
                const answers = answersSchema.safeParse(item.customAnswers);
                return <tr key={item.id} className="border-b align-top">
                  {[item.name, item.email, item.community, item.category || "Kegiatan tunggal", item.id].map((value, index) =>
                    <td key={index} className="p-2">{value}</td>)}
                  <td className="min-w-40 p-2">
                    <dl className="space-y-2">
                      {item.phone && <div><dt>WhatsApp</dt><dd>{item.phone}</dd></div>}
                      {item.notes && <div><dt>Catatan</dt><dd className="break-words">{item.notes}</dd></div>}
                      {answers.success && answers.data.map(({ id, label, type, value }) => (
                        <div key={id}>
                          <dt className="font-semibold">{label}</dt>
                          <dd className="break-words">{type === "url" && isWebLink(value)
                            ? <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-primary underline">Buka {label}</a>
                            : value}</dd>
                        </div>
                      ))}
                    </dl>
                  </td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </details>
    </article>
  </section>;
}
