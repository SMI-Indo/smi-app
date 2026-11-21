"use client";

import { useActionState } from "react";
import { saveVariant, updateOrder } from "./actions";
import { orderLabels } from "@/lib/merchandise";
import type { MerchandiseVariant } from "@prisma/client";

export function ProductForm({ item }: { item?: MerchandiseVariant }) {
  const [message, action, pending] = useActionState(saveVariant, "");
  return <details className="rounded-lg border p-4"><summary className="cursor-pointer font-bold">{item ? item.name + " · " + item.size : "Tambah varian produk"}</summary>
    <form action={action} className="smi-form grid sm:grid-cols-2 gap-3 mt-4">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <label>Nama<input name="name" defaultValue={item?.name} required maxLength={120} /></label>
      <label>Kategori<input name="category" defaultValue={item?.category} required maxLength={80} /></label>
      <label>Deskripsi<textarea name="description" defaultValue={item?.description} required maxLength={1000} /></label>
      <label>URL foto (HTTPS)<input name="imageUrl" type="url" defaultValue={item?.imageUrl} required /></label>
      <label>Ukuran atau varian<input name="size" defaultValue={item?.size} required maxLength={60} /></label>
      <label>Harga Rupiah<input name="price" type="number" min={1} max={3000000} defaultValue={item?.price} required /></label>
      <label>Stok<input name="stock" type="number" min={0} max={100000} defaultValue={item?.stock} required /></label>
      <label>Tampilkan di katalog<input name="active" type="checkbox" defaultChecked={item?.active ?? true} style={{ width: "auto" }} /></label>
      <p role="status">{message}</p>
      <button disabled={pending} className="bg-primary text-white rounded-lg px-4 py-2">Simpan varian</button>
    </form>
  </details>;
}

export function OrderStatusForm({ id, status }: { id: string; status: string }) {
  const [result, action, pending] = useActionState(updateOrder, null);
  const next = status === "PENDING" ? "PROCESSING" : status === "PROCESSING" ? "DONE" : null;
  if (!next) return null;
  return <form action={action} className="smi-form space-y-2">
    <input type="hidden" name="id" value={id} />
    <label>Status baru<select name="status"><option value={next}>{orderLabels[next]}</option><option value="CANCELLED">{orderLabels.CANCELLED}</option></select></label>
    <button disabled={pending} className="bg-primary text-white rounded-lg px-4 py-2">Perbarui status</button>
    {result && <p role={result.ok ? "status" : "alert"}>{result.message}</p>}
  </form>;
}
