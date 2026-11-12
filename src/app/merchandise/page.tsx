import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Shop } from "./Shop";

export const dynamic = "force-dynamic";
export default async function MerchandisePage() {
  const [session, products] = await Promise.all([
    getServerSession(authOptions),
    prisma.merchandiseVariant.findMany({ where: { active: true }, orderBy: [{ name: "asc" }, { size: "asc" }] }).catch(() => null),
  ]);
  return <main className="max-w-6xl mx-auto px-4 py-12 space-y-6">
    <h1 className="font-headline-lg text-primary">Merchandise SMI</h1>
    {products ? <Shop products={products} signedIn={Boolean(session?.user.email)} /> : <p>Katalog gagal dimuat.</p>}
  </main>;
}
