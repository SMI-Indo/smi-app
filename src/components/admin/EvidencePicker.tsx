"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = { files: File[]; onChange(files: File[]): void; disabled: boolean; onBusyChange(busy: boolean): void };
const maxBytes = 1024 * 1024;
async function prepare(file: File): Promise<File> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 20 * maxBytes) throw new Error("Pilih PNG, JPEG, atau WebP maksimal 20 MB.");
  if (file.size <= maxBytes) return file;
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Gambar tidak dapat dibaca.")); image.src = source; });
    if (image.naturalWidth * image.naturalHeight > 50_000_000) throw new Error("Resolusi gambar terlalu besar.");
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Gambar tidak dapat disiapkan di perangkat ini.");
    context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.9, 0.75, 0.6]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && blob.size <= maxBytes) return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    }
    throw new Error("Gambar masih terlalu besar. Potong bagian bukti yang diperlukan dan pilih ulang.");
  } finally { URL.revokeObjectURL(source); }
}

export function EvidencePicker({ files, onChange, disabled, onBusyChange }: Props) {
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);
  async function select(selected: FileList | null) {
    if (!selected) return;
    const batch = Array.from(selected);
    if (batch.length + files.length > 3) { setError("Maksimal 3 gambar per catatan."); if (input.current) input.current.value = ""; return; }
    onBusyChange(true); setError("");
    try { onChange([...files, ...await Promise.all(batch.map(prepare))]); }
    catch (error) { setError(error instanceof Error ? error.message : "Gambar belum dapat disiapkan."); }
    finally { onBusyChange(false); if (input.current) input.current.value = ""; }
  }
  return <fieldset className="space-y-3" disabled={disabled}>
    <legend className="font-semibold">Screenshot bukti (opsional)</legend>
    <p id="evidence-help" className="text-sm text-on-surface-variant">Hanya pengurus dapat melihat bukti. Pilih hingga 3 gambar dari galeri atau kamera. Gambar besar diperkecil otomatis; periksa keterbacaan sebelum menyimpan.</p>
    <label className="block">Pilih gambar<input ref={input} type="file" accept="image/png,image/jpeg,image/webp" multiple aria-describedby="evidence-help" onChange={(event) => void select(event.target.files)} className="block w-full min-h-11 text-sm" /></label>
    {error && <p role="alert" className="text-error">{error}</p>}
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {previews.map(({ file, url }, index) => <li key={url} className="min-w-0 space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Pratinjau bukti ${index + 1}`} className="h-40 w-full object-contain bg-surface-container" />
        <p className="break-all text-xs">{file.name}</p>
        <button type="button" className="min-h-11 text-error underline active:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-4" onClick={() => onChange(files.filter((_, item) => item !== index))}>Hapus gambar {index + 1}</button>
      </li>)}
    </ul>
  </fieldset>;
}
