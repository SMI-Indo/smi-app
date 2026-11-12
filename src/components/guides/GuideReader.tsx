"use client";

import { useEffect, useRef, useState } from "react";

type Guide = { id: string; title: string; content: string };
const notice = "Panduan Liturgis ini hanya untuk dibaca (tidak dapat disalin atau diunduh).";

export function GuideReader({ guides }: { guides: Guide[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(guides[0]?.id);
  const [message, setMessage] = useState("");
  const contentRef = useRef<HTMLElement>(null);
  const current = guides.find((guide) => guide.id === selected);
  const filtered = guides.filter((guide) => guide.title.toLocaleLowerCase("id").includes(search.toLocaleLowerCase("id")));

  useEffect(() => {
    const content = contentRef.current;
    const onSelectStart = (event: Event) => { event.preventDefault(); event.stopPropagation(); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (((event.ctrlKey || event.metaKey) && ["c", "x", "a", "s", "p", "u"].includes(event.key.toLowerCase())) || event.key === "F12" || (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "i")) {
        event.preventDefault(); event.stopPropagation(); setMessage(notice);
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    content?.addEventListener("selectstart", onSelectStart);
    return () => { document.removeEventListener("keydown", onKeyDown, true); content?.removeEventListener("selectstart", onSelectStart); };
  }, []);

  const block = (event: React.SyntheticEvent) => { event.preventDefault(); event.stopPropagation(); setMessage(notice); };
  return (
    <main className="guide-reader max-w-6xl mx-auto px-4 py-12 space-y-6">
      <h1 className="font-headline-lg text-primary">Panduan Liturgis</h1>
      <p className="text-on-surface-variant">Baca panduan yang diterbitkan oleh pengurus SMI.</p>
      <div role="status" aria-live="polite" className="text-sm text-primary">{message}</div>
      <div className="grid md:grid-cols-[16rem_1fr] gap-6">
        <aside className="space-y-3">
          <label htmlFor="guide-search" className="block font-bold">Cari panduan</label>
          <input id="guide-search" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-outline p-3" />
          <div className="space-y-2">{filtered.map((guide) => <button type="button" key={guide.id} onClick={() => { setSelected(guide.id); setMessage(""); }} aria-pressed={guide.id === selected} className="block w-full text-left rounded-lg border border-outline p-3 hover:bg-surface-container">{guide.title}</button>)}</div>
          {filtered.length === 0 && <p>Tidak ada panduan yang cocok.</p>}
        </aside>
        <article ref={contentRef} className="guide-content min-h-64 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 md:p-10" onCopy={block} onCut={block} onPaste={block} onContextMenu={block} onDragStart={block} onMouseDown={(event) => { if (event.detail > 1) event.preventDefault(); }}>
          {current ? <><h2 className="font-headline-md text-primary mb-6">{current.title}</h2><div className="whitespace-pre-wrap leading-relaxed">{current.content}</div></> : <p>Belum ada panduan yang diterbitkan.</p>}
        </article>
      </div>
    </main>
  );
}
