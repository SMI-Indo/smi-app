"use client";

import Link from "next/link";
import { useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { checkout } from "./actions";
import { rupiah } from "@/lib/merchandise";
import type { MerchandiseVariant } from "@prisma/client";

const useCart = create<{
  items: Record<string, number>;
  adjust: (id: string, delta: number, limit: number) => void;
  clear: () => void;
}>()(persist((set) => ({
  items: {},
  adjust: (id, delta, limit) => set(({ items }) => ({
    items: { ...items, [id]: Math.max(0, Math.min(limit, (items[id] ?? 0) + delta)) },
  })),
  clear: () => set({ items: {} }),
}), { name: "smi-merchandise-cart" }));

export function Shop({ products, signedIn }: { products: MerchandiseVariant[]; signedIn: boolean }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const cart = useCart((state) => state.items);
  const adjust = useCart((state) => state.adjust);
  const clear = useCart((state) => state.clear);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const visible = products.filter((item) => (!category || item.category === category) &&
    (item.name + " " + item.description + " " + item.size).toLowerCase().includes(search.trim().toLowerCase()));
  const selected = products.filter((item) => cart[item.id] > 0);
  const unavailable = Object.entries(cart).filter(([id, quantity]) => quantity > 0 && !products.some((item) => item.id === id));
  const total = selected.reduce((sum, item) => sum + item.price * cart[item.id], 0);

  function change(item: MerchandiseVariant, delta: number) {
    adjust(item.id, delta, Math.min(20, item.stock));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setPending(true);
    setMessage("");
    try {
      const result = await checkout({ ...data, items: selected.map((item) => ({ id: item.id, quantity: cart[item.id] })) });
      if (result.code) {
        clear();
        form.reset();
        setMessage("Pesanan tersimpan. Kode: " + result.code);
      } else setMessage(result.error ?? "Pesanan gagal.");
    } catch {
      setMessage("Pesanan gagal. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
    <section>
      <div className="smi-form grid gap-3 sm:grid-cols-2 mb-5">
        <label>Cari merchandise<input value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <label>Kategori<select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Semua kategori</option>{[...new Set(products.map((item) => item.category))].map((value) => <option key={value}>{value}</option>)}
        </select></label>
      </div>
      {visible.length === 0 && <p>Belum ada produk yang cocok.</p>}
      <ul className="grid gap-4 sm:grid-cols-2">{visible.map((item) => <li key={item.id} className="rounded-xl border border-outline-variant overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="aspect-square w-full object-cover" src={item.imageUrl} alt={item.name} width={320} height={320} loading="lazy" />
        <div className="p-4 space-y-2">
          <h2 className="font-bold">{item.name}</h2><p>{item.description}</p>
          <p>{item.size} · Stok {item.stock}</p><p className="font-bold">{rupiah(item.price)}</p>
          <button type="button" disabled={pending || (cart[item.id] ?? 0) >= Math.min(item.stock, 20)} onClick={() => change(item, 1)} className="rounded-lg bg-primary text-white px-3 py-2 disabled:opacity-50">Tambah ke keranjang</button>
        </div>
      </li>)}</ul>
    </section>
    <aside className="space-y-4 rounded-xl border border-outline-variant p-5 self-start">
      <h2 className="font-headline-md">Keranjang</h2>
      {unavailable.length > 0 && <p role="status">Sebagian barang sudah tidak tersedia. <button type="button" className="underline" onClick={() => unavailable.forEach(([id, quantity]) => adjust(id, -quantity, 0))}>Hapus barang yang tidak tersedia</button></p>}
      {selected.length === 0 && <p>Keranjang masih kosong.</p>}
      {selected.map((item) => <div key={item.id} className="space-y-2 border-b pb-3">
        <p>{item.name} · {item.size}</p><div className="flex items-center gap-3">
          <button type="button" aria-label={"Kurangi " + item.name} disabled={pending} onClick={() => change(item, -1)} className="border rounded px-3 py-1">−</button>
          <output>{cart[item.id]}</output>
          <button type="button" aria-label={"Tambah " + item.name} disabled={pending || cart[item.id] >= Math.min(item.stock, 20)} onClick={() => change(item, 1)} className="border rounded px-3 py-1">+</button>
        </div>
      </div>)}
      <p className="font-bold">Total {rupiah(total)}</p>
      <p role="status">{message}</p>
      {signedIn ? <><Link href="/merchandise/pesanan" className="underline">Riwayat pesanan</Link>
        {selected.length > 0 && <form onSubmit={submit} className="smi-form space-y-3">
          <label>Nama pemesan<input name="name" required minLength={2} maxLength={120} /></label>
          <label>WhatsApp (08 atau +62)<input name="phone" type="tel" required /></label>
          <label>Catatan pesanan<textarea name="notes" maxLength={1000} /></label>
          <p className="text-sm">Pengurus akan menghubungi Anda untuk konfirmasi pembayaran.</p>
          <button disabled={pending} className="rounded-lg bg-primary text-white px-4 py-2">{pending ? "Menyimpan…" : "Konfirmasi pesanan"}</button>
        </form>}</> : <Link href="/login" className="underline">Masuk untuk memesan</Link>}
    </aside>
  </div>;
}
