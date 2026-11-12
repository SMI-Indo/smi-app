"use client";

import { useActionState } from "react";
import { register, type RegistrationResult } from "./actions";

export function RegistrationForm({ slug, categories }: { slug: string; categories: string[] }) {
  const [result, action, pending] = useActionState<RegistrationResult, FormData>(register.bind(null, slug), {});
  if (result.code) return <section role="status" className="rounded-xl border p-5">
    <h2 className="font-bold">Pendaftaran tersimpan</h2>
    <p>Kode registrasi <strong>{result.code}</strong></p>
    {!result.emailSent && <p>Email belum terkirim. Simpan kode ini sebagai bukti.</p>}
  </section>;
  return <form action={action} className="smi-form space-y-4">
    <label>Nama lengkap<input name="name" required maxLength={120} /></label>
    <label>Email<input name="email" type="email" required maxLength={254} /></label>
    <label>WhatsApp (08 atau +62)<input name="phone" type="tel" required /></label>
    {categories.length > 0 && <label>Cabang lomba<select name="category" defaultValue="" required>
      <option value="" disabled>Pilih cabang lomba</option>
      {categories.map((category) => <option key={category}>{category}</option>)}
    </select></label>}
    <label>Asal unit atau komunitas<input name="community" required maxLength={120} /></label>
    <label>Catatan tambahan<textarea name="notes" maxLength={1000} /></label>
    {result.error && <p role="alert" className="text-error">{result.error}</p>}
    <button disabled={pending} className="rounded-lg bg-primary text-white px-5 py-3">{pending ? "Menyimpan…" : "Kirim pendaftaran"}</button>
  </form>;
}
