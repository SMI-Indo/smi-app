"use client";

import { useActionState } from "react";
import { register, type RegistrationResult } from "./actions";
import type { RegistrationField } from "@/lib/registrationFields";

export function RegistrationForm({ slug, categories, fields }: { slug: string; categories: string[]; fields: RegistrationField[] }) {
  const [result, action, pending] = useActionState<RegistrationResult, FormData>(register.bind(null, slug), {});
  if (result.code) return <section role="status" className="rounded-xl border p-5">
    <h2 className="font-bold">Pendaftaran tersimpan</h2>
    <p>Kode registrasi <strong>{result.code}</strong></p>
    {!result.emailSent && <p>Email belum terkirim. Simpan kode ini sebagai bukti.</p>}
  </section>;
  return <form action={action} className="smi-form space-y-4">
    <p>Anda bisa mendaftar tanpa akun SMI. Gunakan email aktif untuk menerima konfirmasi.</p>
    <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
    <label>Nama lengkap termasuk nama baptis<input name="name" autoComplete="name" required minLength={2} maxLength={120} /></label>
    <label>Asal paroki<input name="community" required minLength={2} maxLength={120} /></label>
    {categories.length > 0 && <label>Cabang lomba<select name="category" defaultValue="" required>
      <option value="" disabled>Pilih cabang lomba</option>
      {categories.map((category) => <option key={category}>{category}</option>)}
    </select></label>}
    {fields.map(({ id, label, type, required }) => <label key={id}>
      {label}{!required && " (opsional)"}
      {type === "textarea" ? <textarea name={"field-" + id} rows={3} required={required} maxLength={2000} />
        : <input name={"field-" + id} type={type} required={required} maxLength={type === "text" ? 300 : 2000} />}
    </label>)}
    {result.error && <p role="alert" className="text-error">{result.error}</p>}
    <button disabled={pending} className="rounded-lg bg-primary text-white px-5 py-3">{pending ? "Menyimpan…" : "Kirim pendaftaran"}</button>
  </form>;
}
