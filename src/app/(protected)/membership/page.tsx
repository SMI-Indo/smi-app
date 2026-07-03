import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kartu Anggota",
  description: "Digital ID Card dan statistik pelayanan misdinar Anda.",
};

export default function MembershipPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#fdf9f3' }}>
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="font-headline-lg text-center" style={{ color: '#941a00' }}>
          Halaman Digital ID Card &amp; Statistik Pelayanan
        </h1>
      </div>
    </main>
  );
}
