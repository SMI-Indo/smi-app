import { prisma } from "@/lib/prisma";
import { orderLabels, rupiah } from "@/lib/merchandise";
import { ProductForm, OrderStatusForm } from "./Forms";

export const dynamic = "force-dynamic";
export default async function MerchandiseAdminPage() {
  const [products, orders] = await Promise.all([
    prisma.merchandiseVariant.findMany({ orderBy: { name: "asc" } }),
    prisma.merchandiseOrder.findMany({ orderBy: { createdAt: "desc" }, include: { items: true } }),
  ]);
  return <section className="max-w-4xl space-y-5">
    <h1 className="font-headline-lg text-primary">Kelola Merchandise</h1>
    <ProductForm />
    {products.map((item) => <ProductForm key={item.id} item={item} />)}
    <h2 className="font-headline-md">Pesanan</h2>
    {orders.length === 0 && <p>Belum ada pesanan.</p>}
    {orders.map((order) => <article key={order.id} className="border rounded-lg p-4 space-y-2">
      <h3 className="font-bold break-all">{order.id} · {order.name}</h3>
      <p>{order.phone} · {orderLabels[order.status]} · {rupiah(order.total)}</p>
      {order.notes && <p>{order.notes}</p>}
      <ul>{order.items.map((item) => <li key={item.id}>{item.quantity} × {item.label}</li>)}</ul>
      <OrderStatusForm id={order.id} status={order.status} />
    </article>)}
  </section>;
}
