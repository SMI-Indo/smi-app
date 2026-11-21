import { splitRegistrationTerms } from "@/lib/registrationTerms";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RegistrationForm } from "./RegistrationForm";
import { Countdown } from "./Countdown";
import { fieldsSchema, registrationClosesAt, registrationWindowOpen, remainingSlots } from "@/lib/registrationFields";

export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: "Asia/Jakarta",
});
const deadlineFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export default async function RegistrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const now = new Date();
  const event = await prisma.event.findUnique({
    where: { registrationSlug: slug },
    include: { _count: { select: { registrations: true } } },
  }).catch(() => undefined);
  const remaining = event ? remainingSlots(event.capacity, event._count.registrations) : null;
  const terms = splitRegistrationTerms(event?.registrationTerms ?? "");
  const fields = fieldsSchema.safeParse(event?.registrationFields);
  const open = event && registrationWindowOpen(event.status, event.registrationDeadline, now) && remaining !== 0;
  let accountEmail: string | null | undefined;
  let identityUnavailable = false;
  if (open) {
    try {
      const session = await getServerSession(authOptions);
      accountEmail = session?.user?.id ? session.user.email : undefined;
    } catch {
      identityUnavailable = true;
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
      <Link href="/daftar" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline">
        <span aria-hidden="true">←</span> Daftar acara
      </Link>
      <header className="mb-7 mt-4 border-b border-outline-variant pb-6">
        <h1 className="max-w-3xl wrap-anywhere text-3xl font-bold leading-tight text-on-surface sm:text-5xl">
          {event?.title ?? (slug === "lombanatal" ? "Lomba Natal" : "Pendaftaran acara")}
        </h1>
        {event && <Link href={"/daftar/" + encodeURIComponent(slug) + "/peserta"} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline">Lihat daftar peserta</Link>}
      </header>
      <div className={event ? "grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12" : "max-w-xl"}>
        {event && (
          <section aria-label="Detail kegiatan" className="min-w-0 space-y-6 wrap-anywhere">
            <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <dt className="text-on-surface-variant">Jadwal kegiatan</dt>
                <dd className="mt-1 font-semibold">{dateFormat.format(event.date)}{event.time && ` · ${event.time}`}</dd>
              </div>
              {event.location && <div>
                <dt className="text-on-surface-variant">Lokasi</dt>
                <dd className="mt-1 font-semibold">{event.location}</dd>
              </div>}
              {event.registrationDeadline && <div>
                <dt className="text-on-surface-variant">Batas pendaftaran</dt>
                <dd className="mt-1 font-semibold">{deadlineFormat.format(event.registrationDeadline)} WIB</dd>
                <dd className="mt-1 text-on-surface-variant">
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Makassar" }).format(event.registrationDeadline)} WITA
                  <br />
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jayapura" }).format(event.registrationDeadline)} WIT
                </dd>
              </div>}
              {open && <div>
                <dt className="text-on-surface-variant">Kuota</dt>
                <dd className="mt-1 font-semibold">{remaining === null ? "Tidak dibatasi" : `${remaining} tempat tersisa`}</dd>
              </div>}
            </dl>
            {open && event.registrationDeadline && <Countdown deadline={registrationClosesAt(event.registrationDeadline).toISOString()} serverNow={now.toISOString()} />}
            {event.description && <p className="whitespace-pre-wrap text-on-surface-variant">{event.description}</p>}
            {terms.text && (
              <div className="border-t border-outline-variant pt-4">
                <h2 className="font-semibold">Syarat pendaftaran</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">{terms.text}</p>
              </div>
            )}
          </section>
        )}
        <div className="min-w-0 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 sm:p-7">
          {terms.links.length > 0 && <section aria-labelledby="event-links" className="mb-6 border-b border-outline-variant pb-4">
            <h2 id="event-links" className="font-semibold">Tautan kegiatan</h2>
            <ul className="mt-1 divide-y divide-outline-variant">
              {terms.links.map(({ label, url }, index) => <li key={index}>
                <a href={url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center wrap-anywhere text-sm font-semibold text-primary underline">
                  {label}<span className="sr-only"> (tab baru)</span>
                </a>
              </li>)}
            </ul>
          </section>}
          {event === undefined || (open && (!fields.success || identityUnavailable)) ? (
            <section role="alert">
              <h2 className="text-xl font-semibold">Formulir gagal dimuat</h2>
              <p className="mt-2 text-sm text-on-surface-variant">Muat ulang halaman atau hubungi pengurus.</p>
            </section>
          ) : open && fields.success ? (
            <RegistrationForm slug={slug} categories={event.registrationCategories} fields={fields.data} accountEmail={accountEmail} />
          ) : (
            <section>
              <h2 className="text-xl font-semibold">{event && remaining === 0 ? "Kuota penuh" : !event ? "Kegiatan tidak ditemukan" : event.registrationDeadline && registrationClosesAt(event.registrationDeadline) <= now ? "Pendaftaran sudah ditutup" : "Pendaftaran belum tersedia"}</h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                {event && remaining === 0 ? "Semua tempat untuk kegiatan ini sudah terisi." : "Periksa daftar acara untuk melihat pendaftaran yang masih dibuka."}
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
