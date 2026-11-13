"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin route error:", error);
  }, [error]);

  return (
    <div className="bg-surface-container-lowest border border-error/30 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-error-container text-error mx-auto flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-2xl">error</span>
      </div>

      <h2 className="font-headline-md text-primary font-bold text-lg mb-2">
        Terjadi Kesalahan di Portal Admin
      </h2>
      <p className="font-body-md text-on-surface-variant text-xs sm:text-sm mb-6">
        Data Admin gagal dimuat. Coba muat ulang halaman.
      </p>

      <button
        type="button"
        onClick={() => reset()}
        className="px-6 py-2.5 rounded-full bg-primary text-white font-label-lg text-xs font-semibold hover:bg-primary-container transition-colors shadow-sm"
      >
        Muat Ulang Halaman
      </button>
    </div>
  );
}
