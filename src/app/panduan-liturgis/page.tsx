import { GuideReader } from "@/components/guides/GuideReader";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PanduanLiturgisPage() {
  const guides = await prisma.liturgicalGuide.findMany({ select: { id: true, title: true, content: true }, orderBy: { title: "asc" } }).catch(() => null);
  if (!guides) return <main className="max-w-4xl mx-auto p-8"><h1 className="font-headline-lg">Panduan Liturgis</h1><p>Panduan belum dapat dimuat. Silakan coba lagi nanti.</p></main>;
  return <GuideReader guides={guides} />;
}
