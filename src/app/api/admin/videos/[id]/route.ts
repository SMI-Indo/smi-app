import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";
import * as z from "zod";

function extractYouTubeThumbnail(url: string): string | null {
  try {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }
  } catch {}
  return null;
}

const updateVideoSchema = z.object({
  title: z.string().min(2, "Judul video wajib diisi minimal 2 karakter").optional(),
  description: z.string().optional().nullable(),
  category: z.enum(["TUTORIAL", "GALLERY", "FUN_FACT"]).optional(),
  videoUrl: z.string().url("URL video harus berupa tautan yang valid").optional(),
  thumbnail: z.string().optional().nullable(),
  duration: z.string().optional(),
  author: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateVideoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data formulir tidak valid" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    let resolvedThumbnail = data.thumbnail;
    if (data.videoUrl && (!data.thumbnail || data.thumbnail.trim() === "")) {
      resolvedThumbnail = extractYouTubeThumbnail(data.videoUrl) || undefined;
    }

    const updated = await prisma.video.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description ? data.description.trim() : null }),
        ...(data.category && { category: data.category }),
        ...(data.videoUrl && { videoUrl: data.videoUrl.trim() }),
        ...(resolvedThumbnail !== undefined && { thumbnail: resolvedThumbnail }),
        ...(data.duration && { duration: data.duration.trim() }),
        ...(data.author && { author: data.author.trim() }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      },
    });

    return NextResponse.json({ success: true, video: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating video:", error);
    return NextResponse.json({ error: "Gagal memperbarui video" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.video.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: "Video berhasil dihapus dari galeri." }, { status: 200 });
  } catch (error) {
    console.error("Error deleting video:", error);
    return NextResponse.json({ error: "Gagal menghapus video" }, { status: 500 });
  }
}
