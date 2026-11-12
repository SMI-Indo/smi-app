import { prisma } from "@/lib/prisma";
import { GuideManager } from "@/components/guides/GuideManager";

export const dynamic = "force-dynamic";
export default async function AdminPanduanPage() {
  const guides = await prisma.liturgicalGuide.findMany({ select: { id: true, title: true, content: true }, orderBy: { title: "asc" } }).catch(() => null);
  if (!guides) return <p>Panduan tidak dapat dimuat. Periksa koneksi database.</p>;
  return <GuideManager initialGuides={guides} />;
}
