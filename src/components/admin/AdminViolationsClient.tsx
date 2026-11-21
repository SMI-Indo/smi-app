"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { severityLabels, violationStatus } from "@/lib/violations";
import { apiErrorMessage } from "@/lib/apiErrorMessage";
import { EvidencePicker } from "./EvidencePicker";

type Member = {
  id: string; name: string | null; email: string; memberId: string | null;
  parish: string | null; phoneSuffix: string | null;
};
type RecordItem = {
  id: string; points: number; reason: string; severity: string; status: string;
  date: string; followUp: string | null; cancellationReason?: string | null;
  cancelledAt?: string | null; cancelledById?: string | null; user: Member;
  evidence?: { id: string; fileName: string }[];
};
type History = { violations: RecordItem[]; page: number; totalPages: number; total: number; memberPoints?: number };
const field = "min-h-11 w-full min-w-0 rounded-md border border-outline bg-surface px-3 py-2";
const button = "inline-flex min-h-11 items-center justify-center rounded-md border border-outline px-3 py-2 text-sm font-semibold disabled:opacity-50";
const dateFormat = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" });

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  if (!response.ok) throw new Error(apiErrorMessage(await response.json().catch(() => null), "Permintaan gagal. Coba lagi."));
  return response.json();
}

export function AdminViolationsClient({ evidenceEnabled = false }: { evidenceEnabled?: boolean }) {
  const [files, setFiles] = useState<File[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [searchRevision, setSearchRevision] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Member | null>(null);
  const [filters, setFilters] = useState("");
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [history, setHistory] = useState<History | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);

  useEffect(() => {
    if (!search) return;
    const abort = new AbortController();
    request<{ members: Member[] }>("/api/admin/violations/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: search }),
      signal: abort.signal,
    })
      .then((data) => { if (!abort.signal.aborted) setMembers(data.members); })
      .catch((error: Error) => { if (!abort.signal.aborted) setSearchError(error.message); })
      .finally(() => { if (!abort.signal.aborted) setSearching(false); });
    return () => abort.abort();
  }, [search, searchRevision]);

  useEffect(() => {
    const abort = new AbortController();
    const params = new URLSearchParams(filters);
    params.set("page", String(page));
    request<History>("/api/admin/violations/history?" + params, { signal: abort.signal })
      .then((data) => { if (!abort.signal.aborted) setHistory(data); })
      .catch((error: Error) => { if (!abort.signal.aborted) setHistoryError(error.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [filters, page, revision]);

  function refresh() {
    setHistoryError("");
    setLoading(true);
    setRevision((value) => value + 1);
  }

  async function save(method: "POST" | "PATCH", data: object) {
    if (busy || (method === "POST" && preparing)) return false;
    setBusy(true);
    setMessage(null);
    try {
      const json = JSON.stringify(data);
      let options: RequestInit = { method, headers: { "Content-Type": "application/json" }, body: json };
      if (method === "POST" && evidenceEnabled && files.length) {
        const form = new FormData();
        form.set("data", json);
        files.forEach((file) => form.append("evidence", file));
        options = { method, body: form };
      }
      const result = await request<{ emailSent?: boolean }>("/api/admin/violations", options);
      setMessage({ text: method === "POST"
        ? result.emailSent ? "Catatan tersimpan. Email pemberitahuan dikirim." : "Catatan tersimpan. Email pemberitahuan belum terkirim."
        : "Catatan diperbarui." });
      refresh();
      return true;
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : "Perubahan gagal disimpan." });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">Poin Pelanggaran</h1>
        <a href="#riwayat" className="inline-flex min-h-11 items-center text-sm underline">Lihat riwayat</a>
      </header>
      <section className="space-y-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 sm:p-6" aria-labelledby="catat">
        <h2 id="catat" className="text-xl font-semibold">Catat pelanggaran</h2>
        <form className="space-y-2" onSubmit={(event) => {
          event.preventDefault();
          const value = query.trim();
          if (!value) return;
          if (value === search && !searchError) return;
          setSearchError("");
          setMembers([]);
          setSearching(true);
          setSearch(value);
          setSearchRevision((current) => current + 1);
        }}>
          <label htmlFor="member-query" className="block font-semibold">Cari anggota</label>
          <div className="flex flex-wrap gap-2">
            <input id="member-query" type="search" className={field + " flex-1 basis-48"} value={query} maxLength={100} required
              placeholder="Nomor HP, nama, email, atau ID" onChange={(event) => setQuery(event.target.value)} />
            <button className={button} disabled={searching || busy}>Cari</button>
          </div>
        </form>
        {searching && <p role="status">Mencari anggota…</p>}
        {searchError && <p role="alert" className="text-error">{searchError}</p>}
        {search && !searching && !searchError && members.length === 0 && <p role="status" className="text-sm">
          Anggota tidak ditemukan. Coba nama atau ID, atau periksa nomor di <Link className="underline" href="/admin/members">Manajemen Anggota</Link>.
        </p>}
        {!searching && members.length > 0 && <ul className="divide-y divide-outline-variant rounded-md border border-outline-variant">
          {members.map((member) => <li key={member.id}>
            <button type="button" disabled={busy || preparing} aria-pressed={selected?.id === member.id}
              className="block min-h-11 w-full break-words px-3 py-2 text-left hover:bg-surface-container aria-pressed:bg-surface-container"
              onClick={() => {
                if (selected?.id === member.id) return;
                setFiles([]);
                setSelected(member);
              }}>
              <strong>{member.name || member.email}</strong>
              <span className="block text-sm text-on-surface-variant">
                {[member.memberId ?? "Tanpa ID", member.parish, member.phoneSuffix && "HP •••• " + member.phoneSuffix].filter(Boolean).join(" · ")}
              </span>
            </button>
          </li>)}
        </ul>}
        {selected && <form key={selected.id} className="grid gap-4 border-t border-outline-variant pt-4 sm:grid-cols-2" onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const values = Object.fromEntries(new FormData(form));
          if (await save("POST", { ...values, userId: selected.id, points: Number(values.points) })) {
            form.reset();
            setFiles([]);
            setSelected(null);
          }
        }}>
          <p className="break-words text-sm sm:col-span-2">Anggota dipilih <strong>{selected.name || selected.email}</strong> · {selected.memberId ?? selected.parish ?? "Tanpa ID"}{selected.phoneSuffix && " · HP •••• " + selected.phoneSuffix}</p>
          <label>Tanggal kejadian<input name="date" type="date" className={field} required /></label>
          <label>Tingkat keparahan<select name="severity" className={field}>
            {Object.entries(severityLabels).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
          </select></label>
          <label>Poin<input name="points" type="number" min={1} step={1} defaultValue={5} className={field} required /></label>
          <label className="sm:col-span-2">Alasan<textarea name="reason" className={field} rows={2} required minLength={3} maxLength={2000} /></label>
          <label className="sm:col-span-2">Tindak lanjut<textarea name="followUp" className={field} rows={2} required minLength={3} maxLength={2000} /></label>
          {evidenceEnabled && <div className="sm:col-span-2"><EvidencePicker files={files} onChange={setFiles} onBusyChange={setPreparing} disabled={busy || preparing} /></div>}
          <button className="registration-submit sm:col-span-2 sm:w-fit" disabled={busy || preparing}>{busy ? "Menyimpan…" : "Catat untuk anggota ini"}</button>
        </form>}
      </section>
      {message && <p role={message.error ? "alert" : "status"} className={"rounded-md border border-outline-variant p-3 " + (message.error ? "text-error" : "")}>{message.text}</p>}
      <section id="riwayat" className="scroll-mt-24 space-y-4" aria-labelledby="judul-riwayat">
        <h2 id="judul-riwayat" className="text-xl font-semibold">Riwayat pelanggaran</h2>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const values = new URLSearchParams();
          const filteredMember = new URLSearchParams(filters).get("memberId");
          if (filteredMember) values.set("memberId", filteredMember);
          for (const key of ["status", "severity", "from", "to"]) {
            const value = String(data.get(key) || "");
            if (value) values.set(key, value);
          }
          setFilters(values.toString());
          setPage(1);
          refresh();
        }}>
          <label>Status<select name="status" className={field}><option value="">Semua status</option>
            {Object.entries(violationStatus).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label>Tingkat<select name="severity" className={field}><option value="">Semua tingkat</option>
            {Object.entries(severityLabels).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
          </select></label>
          <label>Dari tanggal<input name="from" type="date" className={field} /></label>
          <label>Sampai tanggal<input name="to" type="date" className={field} /></label>
          <div className="flex flex-wrap items-end gap-2">
            <button className={button}>Terapkan filter</button>
            {selected && <button type="button" className={button} onClick={() => {
              const next = new URLSearchParams(filters);
              next.set("memberId", selected.id);
              setFilters(next.toString()); setPage(1); refresh();
            }}>Riwayat anggota ini</button>}
          </div>
        </form>
        {new URLSearchParams(filters).has("memberId") && <button className={button} type="button" onClick={() => {
          const next = new URLSearchParams(filters);
          next.delete("memberId");
          setFilters(next.toString()); setPage(1); refresh();
        }}>Tampilkan semua anggota</button>}
        {!loading && !historyError && history?.memberPoints !== undefined &&
          <p className="font-semibold">Total poin anggota: {history.memberPoints}</p>}
        {loading ? <p role="status">Memuat riwayat…</p> : historyError ? <p role="alert">{historyError} <button className={button} onClick={refresh}>Coba lagi</button></p>
          : history?.violations.length === 0 ? <p>{filters ? "Tidak ada catatan yang sesuai dengan filter." : "Belum ada catatan pelanggaran."}</p>
          : history && <>
            <p className="text-sm text-on-surface-variant">{history.total} catatan</p>
            <ul className="space-y-3">{history.violations.map((item) => (
              <li key={item.id} className="min-w-0 space-y-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 wrap-anywhere">
                <div className="flex flex-wrap justify-between gap-2">
                  <h3 className="font-semibold">{item.user.name || item.user.email}</h3>
                  <span className="text-sm">{dateFormat.format(new Date(item.date))}</span>
                </div>
                <p className="text-sm">{item.user.memberId ?? "Tanpa ID"} · {item.points} poin{item.status === "CANCELLED" ? " (tidak dihitung)" : ""} · {severityLabels[item.severity]?.label ?? item.severity}</p>
                <p className="text-sm font-semibold">{violationStatus[item.status] ?? item.status}</p>
                <p className="whitespace-pre-wrap">{item.reason}</p>
                {item.followUp && <p className="whitespace-pre-wrap text-sm">Tindak lanjut: {item.followUp}</p>}
                {evidenceEnabled && !!item.evidence?.length && <ul className="space-y-1 text-sm">{item.evidence.map((file) =>
                  <li key={file.id}><a className="underline" target="_blank" rel="noopener noreferrer"
                    href={"/api/admin/violations/" + encodeURIComponent(item.id) + "/evidence/" + encodeURIComponent(file.id)}>{file.fileName}</a></li>
                )}</ul>}
                {item.status === "CANCELLED" ? <div className="text-sm">
                  <p>Alasan pembatalan: {item.cancellationReason}</p>
                  {item.cancelledAt && <p>Dibatalkan {dateFormat.format(new Date(item.cancelledAt))}</p>}
                </div> : <div className="space-y-2">
                  <label className="block max-w-sm text-sm">Ubah status
                    <select className={field} value={item.status} disabled={busy} onChange={(event) => void save("PATCH", { id: item.id, status: event.target.value })}>
                      {Object.entries(violationStatus).filter(([value]) => value !== "CANCELLED").map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  {cancelId === item.id ? <form className="space-y-2" onSubmit={async (event) => {
                    event.preventDefault();
                    const reason = new FormData(event.currentTarget).get("reason");
                    if (await save("PATCH", { id: item.id, status: "CANCELLED", reason })) setCancelId(null);
                  }}>
                    <label className="block">Alasan pembatalan<textarea name="reason" className={field} required minLength={3} maxLength={2000} /></label>
                    <div className="flex flex-wrap gap-2">
                      <button disabled={busy} className={button + " text-error"}>Konfirmasi pembatalan</button>
                      <button disabled={busy} className={button} type="button" onClick={() => setCancelId(null)}>Kembali</button>
                    </div>
                  </form> : <button type="button" disabled={busy} className={button + " text-error"} onClick={() => setCancelId(item.id)}>Batalkan catatan</button>}
                </div>}
              </li>
            ))}</ul>
            {history.totalPages > 1 && <nav aria-label="Halaman riwayat" className="flex flex-wrap items-center gap-3">
              <button className={button} disabled={history.page <= 1} onClick={() => { setPage(history.page - 1); refresh(); }}>Sebelumnya</button>
              <span>Halaman {history.page} dari {history.totalPages}</span>
              <button className={button} disabled={history.page >= history.totalPages} onClick={() => { setPage(history.page + 1); refresh(); }}>Berikutnya</button>
            </nav>}
          </>}
      </section>
    </section>
  );
}
