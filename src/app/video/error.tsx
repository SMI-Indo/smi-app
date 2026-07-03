"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function VideoError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Video page error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f3' }}>
      <div className="text-center space-y-4 p-8">
        <span className="material-symbols-outlined text-5xl block" style={{ color: '#ba1a1a' }}>play_circle</span>
        <h2 className="font-headline-md" style={{ color: '#1c1c18' }}>Gagal Memuat Video</h2>
        <p className="font-body-md" style={{ color: '#5c403a' }}>{error.message}</p>
        <button
          onClick={reset}
          id="video-error-reset-btn"
          className="px-6 py-3 rounded-full font-label-lg text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#941a00' }}
        >
          Coba Lagi
        </button>
      </div>
    </main>
  );
}
