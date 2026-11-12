import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function RegistrationSettingsPage() {
  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: { registrations: { orderBy: { createdAt: "desc" } } },
  });
  return <section className="max-w-3xl space-y-5">
    <h1 className="font-headline-lg text-primary">Pengaturan Pendaftaran</h1>
    {events.length === 0 && <p>Buat jadwal kegiatan terlebih dahulu.</p>}
    {events.map((event) => <article key={event.id} className="space-y-2">
      <SettingsForm event={{
      id: event.id, title: event.title, slug: event.registrationSlug ?? "", count: event.registrations.length,
      deadline: event.registrationDeadline ? new Date(event.registrationDeadline.getTime() + 7 * 3600000).toISOString().slice(0, 16) : "",
      capacity: event.capacity, terms: event.registrationTerms ?? "", categories: event.registrationCategories.join("\n"),
    }} />
      <details className="rounded-lg border border-outline-variant p-4">
        <summary className="min-h-11 cursor-pointer font-semibold">Peserta {event.title}</summary>
        {event.registrations.length === 0 ? <p>Belum ada peserta.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr>{["Nama", "Email", "WhatsApp", "Asal unit", "Cabang", "Kode"].map((label) =>
                <th key={label} scope="col" className="border-b p-2">{label}</th>)}</tr></thead>
              <tbody>{event.registrations.map((item) => <tr key={item.id} className="border-b">
                {[item.name, item.email, item.phone, item.community, item.category || "Kegiatan tunggal", item.id].map((value, index) =>
                  <td key={index} className="p-2">{value}</td>)}
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </details>
    </article>)}
  </section>;
}
