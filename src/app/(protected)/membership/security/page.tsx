import Link from "next/link";
import { PasswordForm } from "./PasswordForm";

export default function SecurityPage() {
  return <main className="mx-auto w-full max-w-lg px-4 py-10 space-y-6">
    <Link href="/membership" className="inline-flex min-h-11 items-center text-primary underline focus-visible:outline-2 focus-visible:outline-offset-4">Kembali ke kartu anggota</Link>
    <header><h1 className="text-2xl font-bold text-primary">Ganti kata sandi</h1>
      <p className="mt-2 text-on-surface-variant">Setelah disimpan, masuk kembali di semua perangkat.</p></header>
    <PasswordForm />
  </main>;
}
