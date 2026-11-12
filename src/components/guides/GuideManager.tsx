"use client";
import { useState } from "react";

type Guide = { id: string; title: string };
export function GuideManager({ initialGuides }: { initialGuides: Guide[] }) {
  const [guides, setGuides] = useState(initialGuides);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function add(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/guides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setGuides((old) => [...old, result.guide]); setTitle(""); setContent(""); setMessage("Panduan berhasil diterbitkan.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Panduan tidak dapat disimpan."); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus panduan ini?")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/guides", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!response.ok) throw new Error("Panduan tidak dapat dihapus.");
      setGuides((old) => old.filter((guide) => guide.id !== id)); setMessage("Panduan dihapus.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Panduan tidak dapat dihapus."); }
    finally { setBusy(false); }
  }
  return <div className="max-w-4xl space-y-8"><h1 className="font-headline-lg text-primary">Kelola Panduan Liturgis</h1><p role="status">{message}</p>
    <form onSubmit={add} className="space-y-4"><label className="block">Judul<input className="block w-full border border-outline rounded-lg p-3" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></label><label className="block">Isi panduan<textarea className="block w-full border border-outline rounded-lg p-3" required maxLength={100000} rows={12} value={content} onChange={(e) => setContent(e.target.value)} /></label><button disabled={busy} className="bg-primary text-white rounded-lg px-5 py-3">Terbitkan panduan</button></form>
    <section><h2 className="font-headline-md">Panduan diterbitkan</h2>{guides.length === 0 ? <p>Belum ada panduan.</p> : <ul>{guides.map((guide) => <li key={guide.id} className="flex justify-between gap-4 border-b border-outline-variant py-3"><span>{guide.title}</span><button disabled={busy} onClick={() => remove(guide.id)} className="text-error underline">Hapus</button></li>)}</ul>}</section>
  </div>;
}
