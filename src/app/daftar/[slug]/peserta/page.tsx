import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ParticipantView } from "./ParticipantView";
import { registrationHref, registrationOrigin } from "@/lib/registrationLinks";

export const dynamic = "force-dynamic";
export const metadata = { title: "Daftar peserta", robots: { index: false, follow: false } };

export default async function ParticipantViewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { registrationSlug: slug }, select: { title: true } });
  if (!event) notFound();
  return <main className="mx-auto max-w-xl space-y-5 px-4 py-8">
    <Link className="inline-flex min-h-11 items-center text-primary underline" href={registrationHref(slug, registrationOrigin())}>Kembali ke pendaftaran</Link>
    <header>
      <h1 className="text-2xl font-bold">Daftar peserta</h1>
      <p className="wrap-anywhere text-on-surface-variant">{event.title}</p>
    </header>
    <ParticipantView slug={slug} />
  </main>;
}
