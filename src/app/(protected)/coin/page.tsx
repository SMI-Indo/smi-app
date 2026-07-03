import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Koin Saya",
  description: "Kumpulkan dan tukarkan koin dari aktivitas misdinar Anda.",
};

export default function CoinPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#fdf9f3' }}>
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="font-headline-lg text-center" style={{ color: '#941a00' }}>
          Halaman Collect &amp; Redeem Coin
        </h1>
      </div>
    </main>
  );
}
