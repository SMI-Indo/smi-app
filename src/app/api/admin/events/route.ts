import { scheduleOrder, scheduleSelect } from "@/lib/adminSchedule";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";
import * as z from "zod";
import { Prisma } from "@prisma/client";
import { parseWibDate } from "@/lib/registrationFields";
import { isVanityRegistrationSlug } from "@/lib/registrationLinks";

export const revalidate = 0;

export async function GET() {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  try {
    const events = await prisma.event.findMany({
      orderBy: scheduleOrder,
      select: scheduleSelect,
    });
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin events:", error);
    return NextResponse.json({ error: "Gagal memuat jadwal event" }, { status: 500 });
  }
}

const eventSchema = z.object({
  title: z.string().min(2, "Judul kegiatan wajib diisi minimal 2 karakter"),
  description: z.string().optional().nullable(),
  category: z.enum(["WEBINAR", "TEMU_ONLINE", "WORKSHOP", "ACARA"]).default("TEMU_ONLINE"),
  date: z.string().min(1, "Tanggal kegiatan wajib ditentukan"),
  time: z.string().min(1, "Waktu kegiatan wajib diisi (contoh: 19:00 - 21:00 WIB)"),
  location: z.string().min(1, "Lokasi / Tautan kegiatan wajib diisi (contoh: Zoom Meeting)"),
  status: z.enum(["UPCOMING", "COMPLETED"]).default("UPCOMING"),
  registrationSlug: z.string().trim().max(80)
    .refine((slug) => !slug || isVanityRegistrationSlug(slug), "Gunakan nama tautan huruf kecil, angka, atau tanda hubung yang tidak dicadangkan.")
    .optional(),
});

export async function POST(req: NextRequest) {
  const auth = await checkAdminSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized: Akses khusus Admin/Pengurus" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data formulir tidak valid" },
        { status: 400 }
      );
    }

    const { title, description, category, date, time, location, status, registrationSlug } = parsed.data;
    const eventDate = parseWibDate(date);
    if (!eventDate) return NextResponse.json({ error: "Tanggal kegiatan tidak valid." }, { status: 400 });

    const newEvent = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        category,
        date: eventDate,
        time: time.trim(),
        location: location.trim(),
        status,
        registrationSlug: registrationSlug || null,
      },
    });

    revalidatePath("/admin/events", "layout");
    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Nama tautan sudah dipakai kegiatan lain." }, { status: 409 });
    }
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Gagal menambahkan jadwal event" }, { status: 500 });
  }
}
