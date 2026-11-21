import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";
import * as z from "zod";
import { parseWibDate, registrationDeadlineFitsEvent, wibDateInput } from "@/lib/registrationFields";

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
    const date = data.date === undefined ? undefined : parseWibDate(data.date);
    if (date === null) return NextResponse.json({ error: "Tanggal kegiatan tidak valid." }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      let changedDate: Date | undefined;
      if (date) {
        const current = await tx.event.findUnique({ where: { id }, select: { date: true, registrationDeadline: true } });
        if (!current) return { error: "Jadwal kegiatan tidak ditemukan.", status: 404 } as const;
        if (wibDateInput(date) !== wibDateInput(current.date)) {
          if (current.registrationDeadline && !registrationDeadlineFitsEvent(current.registrationDeadline, date)) {
            return { error: "Tenggat terdaftar melewati tanggal baru. Ubah tenggat terlebih dahulu.", status: 409 } as const;
          }
          changedDate = date;
        }
      }

      const event = await tx.event.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title.trim() }),
          ...(data.description !== undefined && { description: data.description ? data.description.trim() : null }),
          ...(data.category && { category: data.category }),
          ...(changedDate && { date: changedDate }),
          ...(data.time && { time: data.time.trim() }),
          ...(data.location && { location: data.location.trim() }),
          ...(data.status && { status: data.status }),
        },
      });
      return { event };
    }, { isolationLevel: "Serializable" });
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });

    revalidatePath("/admin/events", "layout");
    return NextResponse.json({ success: true, event: result.event }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json({ error: "Jadwal sedang diperbarui. Muat ulang lalu coba lagi." }, { status: 409 });
    }
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
    revalidatePath("/admin/events", "layout");
    return NextResponse.json({ success: true, message: "Jadwal kegiatan berhasil dihapus." }, { status: 200 });
  } catch (error) {
    console.error("Error deleting event:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "Jadwal ini sudah memiliki peserta. Ubah statusnya menjadi selesai untuk mempertahankan rekap." }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal menghapus jadwal event" }, { status: 500 });
  }
}
