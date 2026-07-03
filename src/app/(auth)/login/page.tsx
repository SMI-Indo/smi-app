import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke akun Sahabat Misdinar Indonesia Anda.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf9f3' }}>
      <h1 className="font-headline-lg" style={{ color: '#941a00' }}>Halaman Login</h1>
    </main>
  );
}
