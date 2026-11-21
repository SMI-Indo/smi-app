"use client";

import { useState } from "react";
import Link from "next/link";
import { hasMemberId } from "@/lib/memberAccess";

export interface PendingMember {
  id: string;
  name: string | null;
  nickname: string | null;
  email: string;
  parish: string | null;
  memberId: string | null;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  pendingUsers: number;
  activeEvents: number;
  totalVideos: number;
  totalViolations: number;
}

interface AdminOverviewClientProps {
  initialStats: AdminStats;
  initialPending: PendingMember[];
}

export function AdminOverviewClient({
  initialStats,
  initialPending,
}: AdminOverviewClientProps) {
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [pending, setPending] = useState<PendingMember[]>(initialPending);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleQuickApprove = async (user: PendingMember) => {
    setApprovingId(user.id);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          isApproved: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== user.id));
        setStats((prev) => ({
          ...prev,
          pendingUsers: Math.max(0, prev.pendingUsers - 1),
        }));
        setMessage({
          type: "success",
          text: `Akun ${user.name || user.email} berhasil di-ACC (Status Aktif).`,
        });
      } else {
        setMessage({ type: "error", text: data.error || "Gagal menyetujui akun." });
      }
    } catch {
      setMessage({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-surface-container-lowest border border-outline-variant/70 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            Pusat Kendali Pengurus
          </span>
          <h1 className="font-headline-lg text-primary text-2xl sm:text-3xl font-extrabold mb-2">
            Selamat Datang di Portal Admin SMI
          </h1>
          <p className="font-body-md text-on-surface-variant text-sm sm:text-base leading-relaxed">
            Kelola data anggota, verifikasi kartu ID digital, publikasikan jadwal kegiatan, dan kelola galeri video katekese Sahabat Misdinar Indonesia secara terpusat.
          </p>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-6">
            <Link
              href="/admin/events"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-label-lg text-xs sm:text-sm font-semibold hover:bg-primary-container shadow-sm transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>Tambah Jadwal</span>
            </Link>

            <Link
              href="/admin/videos"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container border border-outline/30 text-on-surface font-label-lg text-xs sm:text-sm font-semibold hover:bg-surface-container-high transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg text-secondary">video_call</span>
              <span>Tambah Video</span>
            </Link>

            <Link
              href="/admin/members"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container border border-outline/30 text-on-surface font-label-lg text-xs sm:text-sm font-semibold hover:bg-surface-container-high transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg text-primary">manage_accounts</span>
              <span>Semua Anggota</span>
            </Link>
          </div>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute -right-8 -bottom-10 opacity-5 pointer-events-none text-primary select-none">
          <span className="material-symbols-outlined text-[200px]">shield</span>
        </div>
      </div>

      {/* Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-body-md flex items-center justify-between transition-all ${
            message.type === "success"
              ? "bg-secondary-container/20 text-on-surface border border-secondary-container"
              : "bg-error-container text-error border border-error/30"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">
              {message.type === "success" ? "check_circle" : "error"}
            </span>
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-label-lg text-on-surface-variant font-bold uppercase tracking-wider">
              Total Anggota
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">group</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface font-sans">
              {stats.totalUsers}
            </span>
            <span className="text-xs text-on-surface-variant/70">Terdaftar</span>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Akses belum aktif:</span>
            <span className={`font-bold px-2 py-0.5 rounded-full ${stats.pendingUsers > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
              {stats.pendingUsers} akun
            </span>
          </div>
        </div>

        {/* Active Events */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-label-lg text-on-surface-variant font-bold uppercase tracking-wider">
              Jadwal Aktif
            </span>
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">event_upcoming</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface font-sans">
              {stats.activeEvents}
            </span>
            <span className="text-xs text-on-surface-variant/70">Kegiatan</span>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Status:</span>
            <Link href="/admin/events" className="text-primary font-bold hover:underline">
              Kelola Jadwal &rarr;
            </Link>
          </div>
        </div>

        {/* Total Videos */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-label-lg text-on-surface-variant font-bold uppercase tracking-wider">
              Galeri Video
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary-container/10 text-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">play_circle</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface font-sans">
              {stats.totalVideos}
            </span>
            <span className="text-xs text-on-surface-variant/70">Konten</span>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Koleksi:</span>
            <Link href="/admin/videos" className="text-primary font-bold hover:underline">
              Kelola Video &rarr;
            </Link>
          </div>
        </div>

        {/* Violations */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 shadow-sm hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-label-lg text-on-surface-variant font-bold uppercase tracking-wider">
              Pelanggaran
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">warning</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface font-sans">
              {stats.totalViolations}
            </span>
            <span className="text-xs text-on-surface-variant/70">Catatan</span>
          </div>
          <div className="mt-3 pt-3 border-t border-outline-variant/40 flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">Kedisiplinan:</span>
            <Link href="/admin/pelanggaran" className="text-primary font-bold hover:underline">
              Lihat Log &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Approval Section */}
      <div className="bg-surface-container-lowest border border-outline-variant/70 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-headline-md text-primary text-lg sm:text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">pending_actions</span>
              Anggota dengan Akses Belum Aktif
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Daftar anggota terbaru yang belum diaktifkan kartu identitas digitalnya.
            </p>
          </div>

          <Link
            href="/admin/members"
            className="text-xs font-label-lg font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Lihat Semua Anggota</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-10 px-4 bg-surface-container-low/50 rounded-xl border border-outline-variant/40">
            <span className="material-symbols-outlined text-4xl text-emerald-600 mb-2 block">
              task_alt
            </span>
            <p className="font-headline-md text-on-surface font-bold text-sm">
              Semua Pendaftar Sudah Di-ACC!
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Tidak ada antrean anggota baru yang menunggu verifikasi saat ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-outline-variant/60 text-on-surface-variant font-label-lg uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-2">Nama &amp; Email</th>
                  <th className="pb-3 px-3">Asal Paroki</th>
                  <th className="pb-3 px-3">Tanggal Daftar</th>
                  <th className="pb-3 pr-2 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {pending.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="font-bold text-on-surface text-sm">
                        {user.name || "Tanpa Nama"}
                      </div>
                      <div className="text-on-surface-variant/70 text-xs">
                        {user.email}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-on-surface-variant">
                      {user.parish || "-"}
                    </td>
                    <td className="py-3 px-3 text-on-surface-variant/70">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      {!hasMemberId(user.memberId) ? (
                        <Link href="/admin/members" className="text-sm font-semibold text-primary underline">
                          Isi nomor anggota
                        </Link>
                      ) : <button
                        type="button"
                        onClick={() => handleQuickApprove(user)}
                        disabled={approvingId === user.id}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-600 text-white font-label-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-all inline-flex items-center gap-1 shadow-sm active:scale-95"
                      >
                        {approvingId === user.id ? (
                          <span className="material-symbols-outlined text-sm animate-spin">
                            progress_activity
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-sm">check</span>
                        )}
                        <span>ACC Sekarang</span>
                      </button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
