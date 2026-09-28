import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";
import * as z from "zod";

export const revalidate = 0;

function extractYouTubeThumbnail(url: string): string | null {
  try {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
  } catch {}
  return null;
}

export async function GET() {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  try {
    const videos = await prisma.video.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ videos }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin videos:", error);
    return NextResponse.json({ error: "Gagal memuat galeri video" }, { status: 500 });
  }
}

const videoSchema = z.object({
  title: z.string().min(2, "Judul video wajib diisi minimal 2 karakter"),
  description: z.string().optional().nullable(),
  category: z.enum(["TUTORIAL", "GALLERY", "FUN_FACT"]).default("TUTORIAL"),
  videoUrl: z.string().url("URL video harus berupa tautan yang valid"),
  thumbnail: z.string().optional().nullable(),
  duration: z.string().min(1, "Durasi video wajib diisi (contoh: 08:30)"),
  author: z.string().default("SMI Media"),
  isFeatured: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = videoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data formulir tidak valid" },
        { status: 400 }
      );
    }

    const { title, description, category, videoUrl, thumbnail, duration, author, isFeatured } = parsed.data;

    const resolvedThumbnail =
      thumbnail && thumbnail.trim() !== ""
        ? thumbnail.trim()
        : extractYouTubeThumbnail(videoUrl) || "https://images.unsplash.com/photo-1548625361-155deee223d5";

    const newVideo = await prisma.video.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        category,
        videoUrl: videoUrl.trim(),
        thumbnail: resolvedThumbnail,
        duration: duration.trim(),
        author: author.trim() || "SMI Media",
        isFeatured,
      },
    });

    return NextResponse.json({ success: true, video: newVideo }, { status: 201 });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json({ error: "Gagal menambahkan video ke galeri" }, { status: 500 });
  }
}
