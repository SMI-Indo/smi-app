"use client";
import { useState } from "react";
import { readApiError } from "@/lib/apiErrorMessage";

type Guide = { id: string; title: string; content: string };
export function GuideManager({ initialGuides }: { initialGuides: Guide[] }) {
  const [guides, setGuides] = useState(initialGuides);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  function selectGuide(guide?: Guide) {
    setEditingId(guide?.id ?? null);
    setTitle(guide?.title ?? "");
    setContent(guide?.content ?? "");
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/guides", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, title, content }),
      });
      if (!response.ok) throw new Error(await readApiError(response, "Panduan tidak dapat disimpan."));
      const result = await response.json();
      setGuides((old) => editingId ? old.map((guide) => guide.id === editingId ? result.guide : guide) : [...old, result.guide]);
      setMessage(editingId ? "Perubahan panduan tersimpan." : "Panduan diterbitkan.");
      selectGuide();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Panduan tidak dapat disimpan."); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus panduan ini?")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/guides", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!response.ok) throw new Error(await readApiError(response, "Panduan tidak dapat dihapus."));
      if (id === editingId) selectGuide();
      setGuides((old) => old.filter((guide) => guide.id !== id)); setMessage("Panduan dihapus.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Panduan tidak dapat dihapus."); }
    finally { setBusy(false); }
  }
  return <div className="max-w-4xl space-y-8"><h1 className="font-headline-lg text-primary">Kelola Panduan Liturgis</h1><p role="status">{message}</p>
    <form onSubmit={save} className="smi-form space-y-4">
      <h2 className="font-headline-md">{editingId ? "Edit panduan" : "Tambah panduan"}</h2>
      <label>Judul<input required minLength={2} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label>Isi panduan<textarea required maxLength={100000} rows={12} value={content} onChange={(e) => setContent(e.target.value)} /></label>
      <div className="flex flex-wrap gap-3">
        <button disabled={busy} className="min-h-11 bg-primary text-white rounded-lg px-5 py-3">{busy ? "Menyimpan…" : editingId ? "Simpan perubahan" : "Terbitkan panduan"}</button>
        {editingId && <button type="button" disabled={busy} onClick={() => selectGuide()} className="min-h-11 px-3 underline">Batal edit</button>}
      </div>
    </form>
    <section><h2 className="font-headline-md">Panduan diterbitkan</h2>{guides.length === 0 ? <p>Belum ada panduan.</p> : <ul>{guides.map((guide) => (
      <li key={guide.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant py-3">
        <span className="min-w-0 break-words">{guide.title}</span>
        <div className="flex gap-3">
          <button disabled={busy} onClick={() => selectGuide(guide)} className="min-h-11 px-2 underline">Edit</button>
          <button disabled={busy} onClick={() => remove(guide.id)} className="min-h-11 px-2 text-error underline">Hapus</button>
        </div>
      </li>
    ))}</ul>}</section>
  </div>;
}
