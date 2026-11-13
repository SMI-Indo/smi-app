import { prisma } from "@/lib/prisma";
import { VideoGallery } from "@/components/video/VideoGallery";
import Image from "next/image";
import { Video } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  let videos: Video[] | null = null;
  try {
    videos = await prisma.video.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch {
    videos = null;
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-primary/20 bg-surface-container flex items-center justify-center mx-auto shadow-sm inner-glow">
            <Image
              src="/logo_smi.png"
              alt="Logo Sahabat Misdinar Indonesia"
              fill
              sizes="48px"
              priority
              className="object-cover"
            />
          </div>
          <h1 className="font-headline-lg text-primary">Galeri Video Tutorial &amp; Dokumentasi</h1>
          <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto text-sm md:text-base">
            Pelajari tata gerak liturgi misdinar dan saksikan keseruan dokumentasi kegiatan perhimpunan putra-putri altar nusantara.
          </p>
        </div>

        {/* Dynamic Video Tabs & Bento Layout */}
        {videos ? <VideoGallery initialVideos={videos} /> : (
          <p role="alert">Galeri gagal dimuat. Coba muat ulang halaman.</p>
        )}
      </div>
    </main>
  );
}
