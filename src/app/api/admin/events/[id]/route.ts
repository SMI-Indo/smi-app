import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";
import * as z from "zod";

const updateEventSchema = z.object({
  title: z.string().min(2, "Judul kegiatan wajib diisi minimal 2 karakter").optional(),
  description: z.string().optional().nullable(),
  category: z.enum(["WEBINAR", "TEMU_ONLINE", "WORKSHOP", "ACARA"]).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["UPCOMING", "COMPLETED"]).optional(),
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
    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data formulir tidak valid" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description ? data.description.trim() : null }),
        ...(data.category && { category: data.category }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.time && { time: data.time.trim() }),
        ...(data.location && { location: data.location.trim() }),
        ...(data.status && { status: data.status }),
      },
    });

    return NextResponse.json({ success: true, event: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Gagal memperbarui jadwal event" }, { status: 500 });
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
    await prisma.event.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: "Jadwal kegiatan berhasil dihapus." }, { status: 200 });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Gagal menghapus jadwal event" }, { status: 500 });
  }
}
