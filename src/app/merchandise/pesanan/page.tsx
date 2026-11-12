import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { orderLabels, rupiah } from "@/lib/merchandise";

export default async function OrderHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.email) redirect("/login");
  const orders = await prisma.merchandiseOrder.findMany({
    where: { user: { email: session.user.email } }, include: { items: true }, orderBy: { createdAt: "desc" },
  });
  return <main className="max-w-3xl mx-auto px-4 py-12 space-y-5">
    <Link className="underline" href="/merchandise">Kembali ke katalog</Link>
    <h1 className="font-headline-lg text-primary">Riwayat Pesanan</h1>
    {orders.length === 0 && <p>Belum ada pesanan.</p>}
    {orders.map((order) => <article key={order.id} className="rounded-lg border p-4 space-y-2">
      <h2 className="font-bold break-all">{order.id}</h2>
      <p>{orderLabels[order.status]} · {rupiah(order.total)}</p>
      <ul>{order.items.map((item) => <li key={item.id}>{item.quantity} × {item.label} · {rupiah(item.price)}</li>)}</ul>
    </article>)}
  </main>;
}
