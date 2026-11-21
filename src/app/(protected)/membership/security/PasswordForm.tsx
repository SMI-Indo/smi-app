"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { readApiError } from "@/lib/apiErrorMessage";
import { existingPasswordByteLimit, newPasswordByteLimit } from "@/lib/accountInput";

export function PasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (data.newPassword !== data.confirmation) { setError("Konfirmasi kata sandi belum sama."); return; }
    setPending(true); setError("");
    try {
      const response = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!response.ok) { setError(await readApiError(response, "Kata sandi belum tersimpan.")); return; }
      form.reset(); setSaved(true);
      await signOut({ callbackUrl: "/login" });
    } catch { setError("Koneksi terganggu. Jika kata sandi sudah tersimpan, masuk kembali menggunakan kata sandi baru."); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="smi-form registration-form space-y-5" aria-busy={pending}>
    <fieldset disabled={pending || saved} className="space-y-5">
      <label>Kata sandi saat ini<input name="currentPassword" type="password" autoComplete="current-password" required maxLength={existingPasswordByteLimit} /></label>
      <label>Kata sandi baru<input name="newPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={newPasswordByteLimit} aria-describedby="password-help" /></label>
      <p id="password-help" className="text-sm text-on-surface-variant">Gunakan minimal 8 karakter yang tidak digunakan di akun lain. Batas 72 byte; emoji dan huruf tertentu memakai lebih dari satu byte.</p>
      <label>Ulangi kata sandi baru<input name="confirmation" type="password" autoComplete="new-password" required minLength={8} maxLength={newPasswordByteLimit} /></label>
      <button className="registration-submit w-full focus-visible:outline-2 focus-visible:outline-offset-4 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed" type="submit">{pending ? "Menyimpan…" : "Simpan kata sandi"}</button>
    </fieldset>
    {error && <p role="alert" className="text-error">{error}</p>}
    {saved && <p role="status">Kata sandi tersimpan. <a href="/login" className="text-primary underline focus-visible:outline-2 focus-visible:outline-offset-4">Masuk kembali</a></p>}
  </form>;
}
