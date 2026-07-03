"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";

interface UserProfile {
  name: string;
  nickname: string;
  email: string;
  image: string | null;
  parish: string;
  rank: string;
  memberId: string;
  coins: number;
  attendanceCount: number;
  cardValidUntil: string;
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

  const formattedDate = new Date(profile.cardValidUntil).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto space-y-12">
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
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-black">
                S
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
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-600 border-2 border-[#fdb242] flex items-center justify-center" title="Aktif" />
              </div>
              <div className="min-w-0">
                <h4 className="font-headline-md text-lg text-on-surface font-bold truncate leading-snug">
                  {profile.name}
                </h4>
                <p className="font-label-sm text-[9px] text-on-surface-variant font-bold truncate uppercase">
                  {profile.rank} &bull; {profile.parish}
                </p>
                <p className="font-label-lg text-xs font-mono text-primary font-bold mt-1">
                  ID: {profile.memberId}
                </p>
              </div>
            </div>

            {/* Footer containing valid dates & static QR code */}
            <div className="flex justify-between items-end z-10 pt-4 border-t border-outline-variant/30">
              <div>
                <p className="text-[8px] text-on-surface-variant font-mono uppercase">Masa Berlaku</p>
                <p className="text-[10px] text-on-surface font-bold font-mono">{formattedDate}</p>
              </div>
              {/* Barcode QR Verifikasi */}
              <div className="w-12 h-12 bg-white p-1 rounded-lg border border-outline/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://smi.org/member/1"
                  alt="QR Verification"
                  className="w-full h-full object-contain"
                />
              </div>
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

        {/* Right: Servicing Stats Container */}
        <div className="space-y-6">
          <h2 className="font-headline-md text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">analytics</span>
            <span>Statistik Pelayanan</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Stat 1: Total Attendance */}
            <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant card-glow text-center space-y-1">
              <span className="material-symbols-outlined text-primary text-2xl">event_available</span>
              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold">Kehadiran Misa</p>
              <h4 className="font-display-lg text-2xl text-on-surface font-black mt-2">{profile.attendanceCount}x</h4>
            </div>

            {/* Stat 2: Loyalty Points Balance */}
            <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant card-glow text-center space-y-1">
              <span className="material-symbols-outlined text-secondary text-2xl">token</span>
              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold">Koin Loyalitas</p>
              <h4 className="font-display-lg text-2xl text-secondary font-black mt-2">{profile.coins}</h4>
            </div>

            {/* Stat 3: Loyalty Rank */}
            <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant card-glow text-center space-y-1">
              <span className="material-symbols-outlined text-primary text-2xl">grade</span>
              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold">Pangkat Anggota</p>
              <h4 className="font-display-lg text-base text-on-surface font-bold mt-2 truncate uppercase" title={profile.rank}>
                {profile.rank}
              </h4>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-secondary-container/10 border border-secondary-container/30 text-on-surface-variant font-body-md text-sm space-y-3">
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-secondary text-lg shrink-0">info</span>
              <p>
                Pangkat keanggotaan misdinar Anda dihitung berdasarkan total kehadiran tugas misa liturgi (`Mula`, `Madya`, atau `Utama`).
              </p>
            </div>
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-primary text-lg shrink-0">verified</span>
              <p>
                Kode QR di atas dapat digunakan oleh dewan paroki untuk memverifikasi keaslian status ID Digital Sahabat Misdinar Anda secara langsung.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
