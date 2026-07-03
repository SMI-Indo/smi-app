import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beranda",
  description: "Selamat datang di platform Sahabat Misdinar Indonesia.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#fdf9f3' }}>
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="font-display-lg text-center" style={{ color: '#941a00' }}>
          Sahabat Misdinar Indonesia
        </h1>
        <p className="font-body-md text-center mt-4" style={{ color: '#5c403a' }}>
          Platform Digital Misdinar Katolik
        </p>
      </div>
    </main>
  );
}
