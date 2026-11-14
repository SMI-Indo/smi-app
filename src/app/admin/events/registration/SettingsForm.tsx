"use client";

import { useActionState, useState } from "react";
import { saveRegistrationSettings } from "./actions";
import { registrationFieldLimit, type RegistrationField } from "@/lib/registrationFields";

type Settings = { id: string; slug: string; deadline: string; capacity: number | null; terms: string; categories: string; fields: RegistrationField[] };
export function SettingsForm({ event }: { event: Settings }) {
  const [message, action, pending] = useActionState(saveRegistrationSettings, "");
  const [fields, setFields] = useState(event.fields);
  const [slug, setSlug] = useState(event.slug);
  function updateField(id: string, changes: Partial<RegistrationField>) {
    setFields((current) => current.map((field) => field.id === id ? { ...field, ...changes } : field));
  }

  return <details open className="border-t border-outline-variant">
    <summary className="flex min-h-11 items-center py-2 cursor-pointer font-semibold">Pengaturan formulir</summary>
    <form action={action} className="smi-form mt-4 space-y-3">
      <input type="hidden" name="eventId" value={event.id} />
      <input type="hidden" name="fields" value={JSON.stringify(fields)} />
      <label>Nama unik tautan<input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)}
        required maxLength={80} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" aria-describedby={"slug-" + event.id} /></label>
      <p id={"slug-" + event.id} className="text-sm break-all">Alamat formulir: /daftar/{slug || "nama-kegiatan"}. Gunakan huruf kecil, angka, dan tanda hubung.</p>
      {event.slug && <p className="text-sm">Jika nama tautan berubah, bagikan alamat baru kepada peserta.</p>}
      <label>Batas pendaftaran (WIB)<input name="deadline" type="datetime-local" defaultValue={event.deadline} required /></label>
      <label>Kuota<input name="capacity" type="number" min={1} max={100000} defaultValue={event.capacity ?? undefined} aria-describedby={"capacity-" + event.id} /></label>
      <p id={"capacity-" + event.id} className="text-sm">Kosongkan jika tidak ada batas peserta.</p>
      <label>Syarat pendaftaran<textarea name="terms" defaultValue={event.terms} maxLength={10000} required /></label>
      <label>Cabang lomba (satu per baris)<textarea name="categories" defaultValue={event.categories} maxLength={1000} aria-describedby={"mode-" + event.id} /></label>
      <p id={"mode-" + event.id}>Kosongkan untuk kegiatan tunggal. Isi untuk membuka pilihan cabang lomba dengan kuota bersama.</p>
      <fieldset className="space-y-3">
        <legend className="font-semibold">Kolom tambahan</legend>
        <p className="text-sm">Formulir selalu meminta email, nama lengkap termasuk nama baptis, dan asal paroki.</p>
        {fields.map(({ id, label, type, required }, index) => (
          <fieldset key={id} className="rounded-lg border border-outline-variant p-3 space-y-2">
            <legend className="px-1">Kolom {index + 1}</legend>
            <label>Label<input required maxLength={100} value={label} onChange={(event) => updateField(id, { label: event.target.value })} /></label>
            <label>Jenis jawaban<select value={type} onChange={(event) => updateField(id, { type: event.target.value as RegistrationField["type"] })}>
              <option value="text">Teks singkat</option>
              <option value="textarea">Teks panjang</option>
              <option value="url">Tautan, misalnya Google Drive</option>
            </select></label>
            <label className="flex min-h-11 items-center gap-2">
              <input className="!w-auto" type="checkbox" checked={required} onChange={(event) => updateField(id, { required: event.target.checked })} /> Wajib diisi
            </label>
            <button type="button" className="min-h-11 underline" onClick={() => setFields((current) => current.filter((field) => field.id !== id))}>Hapus kolom {index + 1}</button>
          </fieldset>
        ))}
        <button type="button" className="min-h-11 underline disabled:opacity-50" disabled={fields.length >= registrationFieldLimit}
          onClick={() => setFields((current) => [...current, { id: crypto.randomUUID(), label: "", type: "text", required: false }])}>Tambah kolom</button>
      </fieldset>
      <p role="status">{message}</p>
      <button disabled={pending} className="rounded-lg bg-primary text-white px-4 py-2">Simpan pengaturan</button>
    </form>
  </details>;
}
