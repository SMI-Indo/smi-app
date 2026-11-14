"use client";

import { useActionState } from "react";
import { register, type RegistrationResult } from "./actions";
import type { RegistrationField } from "@/lib/registrationFields";

export function RegistrationForm({ slug, categories, fields }: { slug: string; categories: string[]; fields: RegistrationField[] }) {
  const [result, action, pending] = useActionState<RegistrationResult, FormData>(register.bind(null, slug), {});
  if (result.code) return <section role="status" className="space-y-4">
    <h2 className="text-2xl font-semibold">Pendaftaran tersimpan</h2>
    <p className="border-y border-outline-variant py-4 text-sm">
      Kode registrasi
      <strong className="mt-1 block wrap-anywhere text-lg text-primary">{result.code}</strong>
    </p>
    <p className="text-sm text-on-surface-variant">
      {result.emailSent ? "Konfirmasi dikirim ke email Anda." : "Email belum terkirim. Simpan kode ini sebagai bukti."}
    </p>
  </section>;
  return <form action={action} className="smi-form registration-form space-y-5">
    <header>
      <h2 className="text-2xl font-semibold">Formulir pendaftaran</h2>
      <p className="mt-2 text-sm text-on-surface-variant">Gunakan email aktif untuk menerima konfirmasi. Anda dapat mendaftar tanpa akun SMI.</p>
    </header>
    <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
    <label>Nama lengkap termasuk nama baptis<input name="name" autoComplete="name" required minLength={2} maxLength={120} /></label>
    <label>Asal paroki<input name="community" required minLength={2} maxLength={120} /></label>
    {categories.length > 0 && <label>Cabang lomba<select name="category" defaultValue="" required>
      <option value="" disabled>Pilih cabang lomba</option>
      {categories.map((category) => <option key={category}>{category}</option>)}
    </select></label>}
    {fields.length > 0 && <fieldset className="space-y-4 border-t border-outline-variant pt-4">
      <legend className="pr-3 text-sm font-semibold">Informasi tambahan</legend>
      {fields.map(({ id, label, type, required }) => <label key={id} className="wrap-anywhere">
        {label}{!required && <span className="ml-1 text-sm font-normal text-on-surface-variant">(opsional)</span>}
        {type === "textarea" ? <textarea name={"field-" + id} rows={3} required={required} maxLength={2000} />
          : <input name={"field-" + id} type={type} required={required} maxLength={type === "text" ? 300 : 2000} />}
      </label>)}
    </fieldset>}
    {result.error && <p role="alert" className="rounded-md border border-error/30 px-3 py-2 text-sm text-error">{result.error}</p>}
    <button disabled={pending} className="registration-submit w-full">{pending ? "Mengirim…" : "Kirim pendaftaran"}</button>
  </form>;
}
