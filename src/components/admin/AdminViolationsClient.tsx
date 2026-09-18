"use client";

import { useState } from "react";

export interface ViolationItem {
  id: string;
  points: number;
  reason: string;
  date: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    memberId: string | null;
    violationPoints: number;
  };
}

export interface MemberOption {
  id: string;
  name: string | null;
  email: string;
  memberId: string | null;
  violationPoints: number;
}

interface AdminViolationsClientProps {
  initialViolations: ViolationItem[];
  members: MemberOption[];
}

export function AdminViolationsClient({
  initialViolations,
  members,
}: AdminViolationsClientProps) {
  const [violations, setViolations] = useState<ViolationItem[]>(initialViolations);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [points, setPoints] = useState<number>(5);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const quickReasons = [
    "Tidak hadir pertemuan online tanpa keterangan",
    "Terlambat bergabung webinar > 30 menit",
    "Indisipliner di ruang pertemuan virtual",
    "Tidak mengumpulkan tugas modul pembinaan daring",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setMessage({ type: "error", text: "Pilih anggota terlebih dahulu." });
      return;
    }
    if (!reason.trim()) {
      setMessage({ type: "error", text: "Tuliskan alasan pelanggaran." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          points: Number(points),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const targetMember = members.find((m) => m.id === selectedUserId);
        const newRecord: ViolationItem = {
          id: data.violation.id,
          points: Number(points),
          reason: reason.trim(),
          date: new Date().toISOString(),
          user: {
            id: selectedUserId,
            name: targetMember?.name || "Anggota",
            email: targetMember?.email || "",
            memberId: targetMember?.memberId || null,
            violationPoints: (targetMember?.violationPoints || 0) + Number(points),
          },
        };

        setViolations([newRecord, ...violations]);
        setReason("");
        setMessage({
          type: "success",
          text: `Poin pelanggaran (+${points}) berhasil dicatat untuk ${targetMember?.name || "anggota"}.`,
        });
      } else {
        setMessage({ type: "error", text: data.error || "Gagal mencatat pelanggaran." });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (violationId: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan/menghapus catatan pelanggaran ini?")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/violations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ violationId }),
      });

      if (res.ok) {
        setViolations((prev) => prev.filter((v) => v.id !== violationId));
        setMessage({ type: "success", text: "Catatan pelanggaran berhasil dihapus dan poin dikurangi." });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Gagal menghapus pelanggaran." });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div>
        <h1 className="font-headline-lg text-primary text-2xl md:text-3xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-3xl text-primary">gavel</span>
          <span>Pencatatan Poin Pelanggaran</span>
        </h1>
        <p className="font-body-md text-on-surface-variant text-sm mt-1">
          Halaman khusus pengurus untuk menginput poin penalti kedisiplinan pertemuan online anggota Sahabat Misdinar Indonesia.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-sm font-body-md flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-error-container border-error/20 text-error"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Input Form Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant card-glow space-y-6">
        <h2 className="font-headline-md text-primary text-lg font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">add_circle</span>
          <span>Form Input Poin Pelanggaran Baru</span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Member Selector */}
            <div className="space-y-1.5">
              <label className="font-label-sm text-on-surface-variant block font-bold">
                Pilih Anggota SMI
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-outline bg-surface text-on-surface font-body-md text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
              >
                <option value="">-- Pilih Anggota yang Melanggar --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name || m.email} ({m.memberId || "Belum ada ID"}) - Poin saat ini: {m.violationPoints}
                  </option>
                ))}
              </select>
            </div>

            {/* Points Selector */}
            <div className="space-y-1.5">
              <label className="font-label-sm text-on-surface-variant block font-bold">
                Jumlah Poin Penalti
              </label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPoints(p)}
                    className={`flex-1 py-2.5 rounded-xl font-mono text-sm font-bold border cursor-pointer transition-all ${
                      points === p
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-surface-container border-outline/30 text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    +{p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reason input */}
          <div className="space-y-1.5">
            <label className="font-label-sm text-on-surface-variant block font-bold">
              Alasan Pelanggaran
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder="Contoh: Tidak hadir pertemuan online tanpa keterangan..."
              className="w-full px-4 py-3 rounded-xl border border-outline bg-surface text-on-surface font-body-md text-sm focus:outline-none focus:border-primary transition-colors"
            />
            {/* Quick Templates */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs text-on-surface-variant/70 self-center">Template cepat:</span>
              {quickReasons.map((qr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(qr)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline/20 transition-colors cursor-pointer"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-8 py-3 rounded-full bg-primary text-white font-label-lg font-bold hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Menyimpan...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Catat Poin Pelanggaran</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* History of Violations Table */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant overflow-hidden shadow-sm space-y-4 p-6">
        <h2 className="font-headline-md text-on-surface text-lg font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          <span>Daftar Riwayat Pelanggaran Komunitas</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low border-b border-outline-variant text-xs text-on-surface-variant font-label-sm uppercase">
              <tr>
                <th className="py-3.5 px-4">Tanggal</th>
                <th className="py-3.5 px-4">Anggota</th>
                <th className="py-3.5 px-4">Poin Penalti</th>
                <th className="py-3.5 px-4">Alasan</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 font-body-md">
              {violations.length > 0 ? (
                violations.map((v) => (
                  <tr key={v.id} className="hover:bg-surface-container/40 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-mono text-on-surface-variant">
                      {new Date(v.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-on-surface">{v.user.name || v.user.email}</p>
                      <p className="text-xs font-mono text-primary font-semibold">
                        ID: {v.user.memberId || "-"}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-red-100 text-red-800">
                        +{v.points} Poin
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-on-surface text-sm max-w-xs truncate">
                      {v.reason}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="text-xs font-bold text-error hover:bg-error-container/20 px-3 py-1 rounded-full transition-colors cursor-pointer"
                        title="Batalkan/Hapus Pelanggaran"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-on-surface-variant">
                    Belum ada catatan pelanggaran yang diinput.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
