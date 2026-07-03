import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galeri Video",
  description: "Video tutorial liturgi, galeri dokumentasi, dan fun fact misdinar.",
};

export default function VideoPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: '#fdf9f3' }}>
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="font-headline-lg text-center" style={{ color: '#941a00' }}>
          Halaman Galeri Video
        </h1>
      </div>
    </main>
  );
}
