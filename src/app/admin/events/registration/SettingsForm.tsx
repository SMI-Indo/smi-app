"use client";

import { useActionState } from "react";
import { saveRegistrationSettings } from "./actions";

type Settings = { id: string; title: string; slug: string; deadline: string; capacity: number | null; terms: string; categories: string; count: number };
export function SettingsForm({ event }: { event: Settings }) {
  const [message, action, pending] = useActionState(saveRegistrationSettings, "");
  return <details className="rounded-lg border p-4">
    <summary className="cursor-pointer font-bold">{event.title} · {event.count} peserta</summary>
    <form action={action} className="smi-form mt-4 space-y-3">
      <input type="hidden" name="eventId" value={event.id} />
      <label>Slug (contoh: lombanatal)<input name="slug" defaultValue={event.slug} required maxLength={80} /></label>
      <label>Batas pendaftaran (WIB)<input name="deadline" type="datetime-local" defaultValue={event.deadline} required /></label>
      <label>Kuota<input name="capacity" type="number" min={1} max={100000} defaultValue={event.capacity ?? undefined} required /></label>
      <label>Syarat pendaftaran<textarea name="terms" defaultValue={event.terms} maxLength={10000} required /></label>
      <label>Kategori (satu per baris)<textarea name="categories" defaultValue={event.categories} maxLength={1000} required /></label>
      <p role="status">{message}</p>
      <button disabled={pending} className="rounded-lg bg-primary text-white px-4 py-2">Simpan pengaturan</button>
    </form>
  </details>;
}
