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

  return (
    <form action={action} className="smi-form registration-form space-y-7">
      <input type="hidden" name="eventId" value={event.id} />
      <input type="hidden" name="fields" value={JSON.stringify(fields)} />
      <fieldset className="min-w-0 space-y-4">
        <legend className="mb-4 text-lg font-semibold">Tautan dan jadwal</legend>
        <div>
          <label>Nama unik tautan<input name="slug" value={slug} onChange={(event) => setSlug(event.target.value)}
            required maxLength={80} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" aria-describedby="registration-slug-hint" /></label>
          <p id="registration-slug-hint" className="mt-2 wrap-anywhere text-sm text-on-surface-variant">
            <span className="font-medium">/daftar/{slug || "nama-kegiatan"}</span><br />
            Gunakan huruf kecil, angka, dan tanda hubung. Jika diubah, bagikan tautan baru kepada peserta.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>Batas pendaftaran (WIB)<input name="deadline" type="datetime-local" defaultValue={event.deadline} required /></label>
          <div>
            <label>Kuota peserta<input name="capacity" type="number" min={1} max={100000} defaultValue={event.capacity ?? undefined}
              placeholder="Tanpa batas" aria-describedby="registration-capacity-hint" /></label>
            <p id="registration-capacity-hint" className="mt-2 text-sm text-on-surface-variant">Kosongkan jika kuota tidak dibatasi.</p>
          </div>
        </div>
      </fieldset>
      <fieldset className="min-w-0 space-y-4 border-t border-outline-variant pt-4">
        <legend className="pr-3 text-lg font-semibold">Ketentuan kegiatan</legend>
        <label>Syarat pendaftaran<textarea name="terms" rows={5} defaultValue={event.terms} maxLength={10000} required aria-describedby="registration-terms-hint" /></label>
        <p id="registration-terms-hint" className="text-sm text-on-surface-variant">Untuk menambahkan panduan atau dokumen, tulis tiap tautan pada baris tersendiri. Gunakan format <code>Panduan teknis | https://alamat-dokumen</code>.</p>
        <div>
          <label>Cabang lomba<textarea name="categories" rows={3} defaultValue={event.categories}
            maxLength={1000} aria-describedby="registration-categories-hint" /></label>
          <p id="registration-categories-hint" className="mt-2 text-sm text-on-surface-variant">
            Tulis satu cabang per baris. Semua cabang berbagi kuota. Kosongkan untuk kegiatan tunggal.
          </p>
        </div>
      </fieldset>
      <fieldset className="min-w-0 space-y-3 border-t border-outline-variant pt-4">
        <legend className="pr-3 text-lg font-semibold">Kolom tambahan</legend>
        <p className="text-sm text-on-surface-variant">Email, nama lengkap termasuk nama baptis, dan asal paroki sudah tersedia.</p>
        {fields.map(({ id, label, type, required }, index) => (
          <fieldset key={id} className="min-w-0 rounded-lg border border-outline-variant p-3 sm:p-4">
            <legend className="px-2 text-sm font-semibold">Kolom {index + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>Label<input required maxLength={100} value={label} onChange={(event) => updateField(id, { label: event.target.value })} /></label>
              <label>Jenis jawaban<select value={type} onChange={(event) => updateField(id, { type: event.target.value as RegistrationField["type"] })}>
                <option value="text">Teks singkat</option>
                <option value="textarea">Teks panjang</option>
                <option value="url">Tautan, misalnya Google Drive</option>
              </select></label>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4">
              <label className="registration-check text-sm">
                <input type="checkbox" checked={required} onChange={(event) => updateField(id, { required: event.target.checked })} /> Wajib diisi
              </label>
              <button type="button" aria-label={`Lepas kolom ${index + 1} dari formulir`} className="min-h-11 cursor-pointer text-sm text-error hover:underline"
                onClick={() => setFields((current) => current.filter((field) => field.id !== id))}>Lepas kolom</button>
            </div>
          </fieldset>
        ))}
        <button type="button" className="min-h-11 cursor-pointer rounded-lg border border-outline px-3 text-sm font-semibold text-primary hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60" disabled={fields.length >= registrationFieldLimit}
          onClick={() => setFields((current) => [...current, { id: crypto.randomUUID(), label: "", type: "text", required: false }])}>Tambah kolom</button>
      </fieldset>
      <div className="space-y-3 border-t border-outline-variant pt-5">
        {message && <p role="alert" className="rounded-md border border-error/30 px-3 py-2 text-sm text-error">{message}</p>}
        <button disabled={pending} className="registration-submit w-full sm:w-auto">{pending ? "Menyimpan…" : "Simpan pengaturan"}</button>
      </div>
    </form>
  );
}
