import { prisma } from "@/lib/prisma";
import {
  AdminVideosManager,
  VideoData,
} from "@/components/admin/AdminVideosManager";

export const revalidate = 0; // Data admin selalu real-time

export default async function AdminVideosPage() {
  let videos: VideoData[] = [];

  try {
    const rawVideos = await prisma.video.findMany({
      orderBy: { createdAt: "desc" },
    });

    videos = rawVideos.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      category: v.category,
      videoUrl: v.videoUrl,
      thumbnail: v.thumbnail,
      duration: v.duration,
      author: v.author,
      viewsCount: v.viewsCount,
      isFeatured: v.isFeatured,
      createdAt: v.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error loading admin videos page:", error);
  }

  return <AdminVideosManager initialVideos={videos} />;
}
