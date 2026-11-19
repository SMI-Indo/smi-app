"use client";

import { useActionState, useState } from "react";
import { viewParticipants, type ViewState } from "./actions";

export function ParticipantView({ slug }: { slug: string }) {
  const [code, setCode] = useState("");
  const [state, action, pending] = useActionState<ViewState, FormData>(
    (_, fields) => viewParticipants(slug, code, Number(fields.get("page") ?? 1)), {},
  );
  return <form action={action} className="smi-form registration-form space-y-4">
    <label>Kode akses<input type="password" value={code} onChange={(event) => setCode(event.target.value)}
      maxLength={40} required autoComplete="off" spellCheck={false} /></label>
    <p className="text-sm text-on-surface-variant">Gunakan kode akses yang diberikan pengurus kegiatan.</p>
    <button className="registration-submit" type="submit" disabled={pending}>{pending ? "Memuat…" : "Lihat peserta"}</button>
    {state.error && <p role="alert" className="text-error">{state.error}</p>}
    {state.participants && <section aria-label="Peserta terdaftar" className="space-y-3 border-t border-outline-variant pt-4">
      <p role="status">{state.total} peserta terdaftar</p>
      {state.participants.length > 0 && <ul className="divide-y divide-outline-variant">
        {state.participants.map((item, index) => <li key={index} className="flex flex-wrap justify-between gap-2 py-3 wrap-anywhere">
          <span className="font-semibold">{item.name}</span>{item.category && <span>{item.category}</span>}
        </li>)}
      </ul>}
      {state.page && state.pages && state.pages > 1 && <nav aria-label="Halaman peserta" className="flex flex-wrap items-center gap-3">
        {state.page > 1 && <button className="min-h-11 underline" name="page" value={state.page - 1} disabled={pending}>Sebelumnya</button>}
        <span>Halaman {state.page} dari {state.pages}</span>
        {state.page < state.pages && <button className="min-h-11 underline" name="page" value={state.page + 1} disabled={pending}>Berikutnya</button>}
      </nav>}
    </section>}
  </form>;
}
