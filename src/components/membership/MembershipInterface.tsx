"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { cancelledViolationStatus, isActiveViolation, severityLabels, violationStatus } from "@/lib/violations";

export interface UserViolationRecord {
  id: string;
  points: number;
  reason: string;
  severity: string;
  status: string;
  date: string;
}

export interface UserProfile {
  name: string;
  nickname: string;
  email: string;
  image: string | null;
  parish: string;
  rank: string;
  memberId: string | null;
  coins: number;
  attendanceCount: number;
  violationPoints: number;
  violations: UserViolationRecord[];
  cardValidUntil: string | null;
  joinedAt: string;
  isApproved: boolean;
  cardExpired: boolean;
}

export function MembershipInterface({ profile }: { profile: UserProfile }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    setErrorMsg(null);
    try {
      // Ekspor DOM ke file gambar PNG resolusi tinggi
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        style: {
          transform: "scale(1)",
          borderRadius: "1.5rem",
        },
      });
      const link = document.createElement("a");
      link.download = `SMI-ID-${profile.nickname.toUpperCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setErrorMsg("Gagal mengunduh gambar kartu keanggotaan.");
    } finally {
      setDownloading(false);
    }
  };

  const formattedDate = profile.cardValidUntil ? new Date(profile.cardValidUntil).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }) : "Belum ditentukan";
  const joinedDate = new Date(profile.joinedAt).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric", month: "long", year: "numeric",
  });
  const memberStatus = !profile.isApproved ? "Menunggu persetujuan" : profile.cardExpired ? "Masa berlaku habis" : "Aktif";

  const getDisciplineStatus = (points: number) => {
    if (points === 0) {
      return {
        label: "Disiplin Baik",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: "check_circle",
        description: "Saat ini tidak ada poin pelanggaran yang berlaku.",
      };
    }
    return {
      label: "Poin pelanggaran tercatat",
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: "info",
      description: "Hubungi pengurus jika ada catatan yang perlu ditinjau.",
    };
  };

  const discipline = getDisciplineStatus(profile.violationPoints);
  const activeViolations = profile.violations.filter((item) => isActiveViolation(item.status)).length;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {activeViolations > 0 && <aside className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-950">
        <p className="font-bold">{activeViolations} catatan pelanggaran perlu perhatian</p>
        <a href="#catatan-pelanggaran" className="underline">Baca rincian catatan</a>
      </aside>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Digital ID Card Container */}
        <div className="flex flex-col items-center space-y-4">
          <div
            ref={cardRef}
            className="w-full max-w-[360px] aspect-[1.58/1] rounded-3xl p-6 membership-card-texture card-glow border border-secondary text-on-background flex flex-col justify-between select-none relative"
          >
            {/* Logo Emblem Header */}
            <div className="flex justify-between items-start z-10">
              <div>
                <h3 className="font-display-lg text-primary text-base font-extrabold leading-none">
                  KARTU ANGGOTA
                </h3>
                <p className="font-label-sm text-[10px] text-on-surface-variant font-bold mt-1 uppercase">
                  Sahabat Misdinar Indonesia
                </p>
              </div>
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/20 bg-surface-container flex items-center justify-center transition-transform hover:scale-105 shadow-sm inner-glow">
                <Image
                  src="/logo_smi.png"
                  alt="Logo Sahabat Misdinar Indonesia"
                  fill
                  sizes="32px"
                  priority
                  className="object-cover"
                />
              </div>
            </div>

            {/* Member Profile Details Info */}
            <div className="flex items-center gap-4 z-10 pt-4">
              <div className="shrink-0 relative">
                {profile.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="w-16 h-16 rounded-full border-2 border-primary/20 object-cover bg-white"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
                    {profile.name[0]}
                  </div>
                )}
                <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${memberStatus === "Aktif" ? "bg-green-600" : "bg-amber-600"}`} title={memberStatus} />
              </div>
              <div className="min-w-0">
                <h4 className="font-headline-md text-lg text-on-surface font-bold truncate leading-snug">
                  {profile.name}
                </h4>
                <p className="font-label-sm text-[9px] text-on-surface-variant font-bold truncate uppercase">
                  {profile.rank} &bull; {profile.parish}
                </p>
                <p className="font-label-lg text-xs font-mono text-primary font-bold mt-1">
                  ID: {profile.memberId || "Belum tersedia"}
                </p>
                <p className="text-[10px] font-semibold">{memberStatus}</p>
              </div>
            </div>

            {/* Footer containing valid dates & static QR code */}
            <div className="flex justify-between items-end z-10 pt-4 border-t border-outline-variant/30">
              <div>
                <p className="text-[8px] text-on-surface-variant font-mono uppercase">Masa Berlaku</p>
                <p className="text-[10px] text-on-surface font-bold font-mono">{formattedDate}</p>
                <p className="text-[9px] text-on-surface">Bergabung: {joinedDate}</p>
              </div>
              {/* Barcode QR Verifikasi */}
              {profile.memberId ? (
                <div className="w-14 h-14 bg-white p-1 rounded-lg border border-outline/20 flex items-center justify-center">
                  <QRCodeSVG value={profile.memberId} size={48} marginSize={2} aria-label={`Kode anggota ${profile.memberId}`} />
                </div>
              ) : <span className="text-[10px]">ID belum tersedia</span>}
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-error font-body-md text-center">{errorMsg}</p>
          )}

          {/* Action Button: Export to PNG */}
          <button
            onClick={handleDownloadCard}
            disabled={downloading}
            className="bg-primary text-white font-label-lg px-8 py-3 rounded-full hover:bg-primary-container transition-all active:scale-95 text-sm flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span>{downloading ? "Menyimpan..." : "Simpan Kartu (PNG)"}</span>
          </button>
        </div>

        {/* Right: Servicing & Discipline Stats Container */}
        <div className="space-y-6">
          <h2 className="font-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">analytics</span>
            <span>Statistik &amp; Kedisiplinan Anggota</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            {/* Stat 1: Total Online Attendance */}
            <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant card-glow text-center space-y-1">
              <span className="material-symbols-outlined text-primary text-2xl">video_camera_front</span>
              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold">Temu Online</p>
              <h4 className="font-display-lg text-2xl text-on-surface font-black mt-2">{profile.attendanceCount}x</h4>
            </div>

            {/* Stat 2: Loyalty Points Balance */}
            <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant card-glow text-center space-y-1">
              <span className="material-symbols-outlined text-secondary text-2xl">token</span>
              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold">Koin Terkumpul</p>
              <h4 className="font-display-lg text-2xl text-secondary font-black mt-2">{profile.coins}</h4>
            </div>

            {/* Stat 3: Loyalty Rank */}
            <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant card-glow text-center space-y-1">
              <span className="material-symbols-outlined text-primary text-2xl">grade</span>
              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold">Tingkat Anggota</p>
              <h4 className="font-display-lg text-base text-on-surface font-bold mt-2 truncate uppercase" title={profile.rank}>
                {profile.rank}
              </h4>
            </div>

            {/* Stat 4: Violation Points */}
            <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant card-glow text-center space-y-1">
              <span className="material-symbols-outlined text-error text-2xl">gavel</span>
              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold">Poin Pelanggaran</p>
              <h4 className="font-display-lg text-2xl text-error font-black mt-2">
                {profile.violationPoints}
              </h4>
            </div>
          </div>

          {/* Discipline Card Banner */}
          <div className={`p-5 rounded-2xl border flex items-start gap-3.5 ${discipline.color}`}>
            <span className="material-symbols-outlined text-2xl shrink-0 mt-0.5">
              {discipline.icon}
            </span>
            <div className="space-y-1">
              <h4 className="font-label-lg font-bold text-sm">Status: {discipline.label}</h4>
              <p className="font-body-md text-xs leading-relaxed opacity-90">
                {discipline.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Violation History List Section */}
      <div id="catatan-pelanggaran" className="scroll-mt-24 bg-surface-container-lowest rounded-3xl border border-outline-variant p-6 md:p-8 card-glow space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">assignment_late</span>
            <h3 className="font-headline-md text-on-surface text-lg font-bold">
              Catatan Poin Pelanggaran Saya
            </h3>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-surface-container text-on-surface-variant">
            Total: {profile.violationPoints} Poin
          </span>
        </div>

        {profile.violations.length > 0 ? (
          <div className="divide-y divide-outline-variant/30">
            {profile.violations.map((v) => (
              <div key={v.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-1 break-words">
                  <p className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded px-2 py-1 ${severityLabels[v.severity]?.color ?? ""}`}>{severityLabels[v.severity]?.label ?? v.severity}</span>
                    <span>{violationStatus[v.status] ?? v.status}</span>
                  </p>
                  <p className="font-body-md text-sm font-semibold text-on-surface">{v.reason}</p>
                  <p className="text-xs font-mono text-on-surface-variant">
                    {new Date(v.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "Asia/Jakarta",
                    })}
                  </p>
                </div>
                {v.status !== cancelledViolationStatus && <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-100 text-red-800 shrink-0">
                  +{v.points} Poin
                </span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-on-surface-variant text-sm space-y-1">
            <span className="material-symbols-outlined text-3xl text-green-600">verified</span>
            <p className="font-bold text-on-surface">Hebat! Anda tidak memiliki catatan pelanggaran.</p>
            <p className="text-xs text-on-surface-variant/80">
              Selalu ikuti pertemuan online dengan tepat waktu dan tertib.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
