"use client";

export function AnnouncementMarquee() {
  const news = [
    "Pendaftaran Jambore Nasional Misdinar VII telah dibuka! Hubungi pengurus paroki Anda.",
    "Workshop Liturgi Sakramen Dasar akan dilaksanakan pada 15 Juli 2026.",
    "Kumpulkan koin SMI dengan menyelesaikan modul kuis liturgi dan dapatkan merchandise eksklusif!",
  ];

  return (
    <div className="w-full bg-secondary-container text-secondary py-2 border-y border-outline-variant overflow-hidden select-none">
      <div className="flex whitespace-nowrap animate-marquee">
        <div className="flex gap-20 font-label-sm text-xs">
          {news.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">campaign</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-20 font-label-sm text-xs ml-20" aria-hidden="true">
          {news.map((item, idx) => (
            <div key={`dup-${idx}`} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">campaign</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-55%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 25s linear infinite;
        }
      `}</style>
    </div>
  );
}
