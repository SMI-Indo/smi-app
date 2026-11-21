import { scheduleOrder, scheduleSelect } from "@/lib/adminSchedule";
import { apiError, readJson } from "@/lib/apiErrors";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeAdminApi } from "@/lib/adminAuth";
import * as z from "zod";
import { Prisma } from "@prisma/client";
import { parseWibDate } from "@/lib/registrationFields";
import { isVanityRegistrationSlug } from "@/lib/registrationLinks";

export const revalidate = 0;

export async function GET() {
  const { error: authError } = await authorizeAdminApi();
  if (authError) return authError;

  try {
    const events = await prisma.event.findMany({
      orderBy: scheduleOrder,
      select: scheduleSelect,
    });
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin events:", error);
    return apiError(500, "Gagal memuat jadwal event");
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
  const { error: authError } = await authorizeAdminApi();
  if (authError) return authError;

  try {
    const body = await readJson(req);
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(400, parsed.error.issues[0]?.message || "Data formulir tidak valid");
    }

    const { title, description, category, date, time, location, status, registrationSlug } = parsed.data;
    const eventDate = parseWibDate(date);
    if (!eventDate) return apiError(400, "Tanggal kegiatan tidak valid.");

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
      return apiError(409, "Nama tautan sudah dipakai kegiatan lain.");
    }
    console.error("Error creating event:", error);
    return apiError(500, "Gagal menambahkan jadwal event");
  }
}
