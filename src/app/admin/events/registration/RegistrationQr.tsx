"use client";

import { QRCodeCanvas } from "qrcode.react";
import { useRef, useState } from "react";

export function RegistrationQr({ href, title }: { href: string; title: string }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);

  function download() {
    if (!canvas.current) {
      setError("QR code belum siap. Coba lagi.");
      return;
    }
    try {
      const link = document.createElement("a");
      link.download = "qr-pendaftaran.png";
      link.href = canvas.current.toDataURL("image/png");
      link.click();
      setError("");
    } catch {
      setError("QR code tidak dapat diunduh. Coba lagi.");
    }
  }

  return (
    <details onToggle={(event) => {
      if (event.currentTarget.open) setUrl(new URL(href, window.location.origin).href);
    }} className="mt-3 max-w-sm rounded-lg border border-outline-variant bg-surface-container-lowest">
      <summary className="min-h-11 cursor-pointer px-4 py-3 text-sm font-semibold text-primary hover:underline">
        Buka QR code pendaftaran
      </summary>
      <div className="space-y-3 border-t border-outline-variant p-4">
        {url ? <QRCodeCanvas ref={canvas} value={url} size={320} level="H" marginSize={4}
          imageSettings={{ src: "/logo_smi.png", width: 50, height: 50, excavate: true }}
          aria-label={`QR code pendaftaran ${title}`} className="h-auto max-w-full" />
          : <p className="text-sm">Menyiapkan QR code…</p>}
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="block break-all text-sm text-primary underline">{url}</a>}
        <button type="button" onClick={download} disabled={!url}
          className="min-h-11 cursor-pointer rounded-lg border border-outline px-3 text-sm font-semibold text-primary hover:bg-surface disabled:opacity-50">
          Unduh QR code
        </button>
        {error && <p role="alert" className="text-sm text-error">{error}</p>}
      </div>
    </details>
  );
}
