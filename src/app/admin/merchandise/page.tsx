import { prisma } from "@/lib/prisma";
import { orderLabels, rupiah } from "@/lib/merchandise";
import { ProductForm, OrderStatusForm } from "./Forms";
import Link from "next/link";
import { participantPage, participantPageSize } from "../events/registration/participants";

export const dynamic = "force-dynamic";
export default async function MerchandiseAdminPage({ searchParams }: {
  searchParams: Promise<{ q?: string; status?: string; products?: string; orders?: string }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status = typeof params.status === "string" && Object.hasOwn(orderLabels, params.status) ? params.status : "";
  const name = q ? { contains: q.replace(/[\\%_]/g, "\\$&"), mode: "insensitive" as const } : undefined;
  const productWhere = { name };
  const orderWhere = { name, ...(status && { status }) };
  const [productCount, orderCount] = await Promise.all([
    prisma.merchandiseVariant.count({ where: productWhere }),
    prisma.merchandiseOrder.count({ where: orderWhere }),
  ]);
  const productPage = participantPage(params.products, productCount);
  const orderPage = participantPage(params.orders, orderCount);
  const [products, orders] = await Promise.all([
    prisma.merchandiseVariant.findMany({ where: productWhere, orderBy: [{ name: "asc" }, { id: "asc" }], skip: productPage.skip, take: participantPageSize }),
    prisma.merchandiseOrder.findMany({ where: orderWhere, orderBy: [{ createdAt: "desc" }, { id: "desc" }], include: { items: true }, skip: orderPage.skip, take: participantPageSize }),
  ]);
  function pagination(key: "products" | "orders", { page, pages }: typeof productPage) {
    const href = (value: number) => "/admin/merchandise?" + new URLSearchParams({
      q, status, products: String(productPage.page), orders: String(orderPage.page), [key]: String(value),
    }) + "#" + key;
    return pages > 1 && <nav aria-label={key === "products" ? "Halaman produk" : "Halaman pesanan"} className="flex gap-4">
      {page > 1 && <Link href={href(page - 1)} className="underline">Sebelumnya</Link>}
      <span>Halaman {page} dari {pages}</span>
      {page < pages && <Link href={href(page + 1)} className="underline">Berikutnya</Link>}
    </nav>;
  }
  return <section className="max-w-4xl space-y-5">
    <h1 className="font-headline-lg text-primary">Kelola Merchandise</h1>
    <form className="smi-form flex flex-wrap items-end gap-3">
      <label>Cari nama produk atau pemesan<input name="q" defaultValue={q} maxLength={100} /></label>
      <label>Status pesanan<select name="status" defaultValue={status}><option value="">Semua status</option>
        {Object.entries(orderLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <button className="registration-submit">Cari</button>
    </form>
    <h2 id="products" className="font-headline-md">Produk</h2>
    <ProductForm />
    {products.map((item) => <ProductForm key={item.id} item={item} />)}
    {products.length === 0 && <p>Tidak ada produk yang cocok.</p>}
    {pagination("products", productPage)}
    <h2 id="orders" className="font-headline-md">Pesanan</h2>
    {orders.length === 0 && <p>Tidak ada pesanan yang cocok.</p>}
    {orders.map((order) => <article key={order.id} className="border rounded-lg p-4 space-y-2">
      <h3 className="font-bold break-all">{order.id} · {order.name}</h3>
      <p>{order.phone} · {orderLabels[order.status]} · {rupiah(order.total)}</p>
      {order.notes && <p>{order.notes}</p>}
      <ul>{order.items.map((item) => <li key={item.id}>{item.quantity} × {item.label}</li>)}</ul>
      <OrderStatusForm id={order.id} status={order.status} />
    </article>)}
    {pagination("orders", orderPage)}
  </section>;
}
