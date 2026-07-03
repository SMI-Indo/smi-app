import { prisma } from "@/lib/prisma";
import { VideoGallery } from "@/components/video/VideoGallery";

export const revalidate = 60; // Cache cache selama 60 detik

export default async function VideoPage() {
  // Ambil data video dari database
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">play_circle</span>
          </div>
          <h1 className="font-headline-lg text-primary">Galeri Video Tutorial &amp; Dokumentasi</h1>
          <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto text-sm md:text-base">
            Pelajari tata gerak liturgi misdinar dan saksikan keseruan dokumentasi kegiatan perhimpunan putra-putri altar nusantara.
          </p>
        </div>

        {/* Dynamic Video Tabs & Bento Layout */}
        <VideoGallery initialVideos={videos} />
      </div>
    </main>
  );
}
