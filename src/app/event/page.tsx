import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Kegiatan",
  description: "Lihat jadwal tugas, latihan, dan acara misdinar.",
};

export default function EventPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#fdf9f3' }}>
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="font-headline-lg text-center" style={{ color: '#941a00' }}>
          Halaman Jadwal Kegiatan
        </h1>
      </div>
    </main>
  );
}
