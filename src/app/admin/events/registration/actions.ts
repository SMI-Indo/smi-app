"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";

const settings = z.object({
  eventId: z.string().min(1),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  capacity: z.coerce.number().int().min(1).max(100000),
  terms: z.string().trim().min(1).max(10000),
  categories: z.string().trim().min(1).max(1000),
});

export async function saveRegistrationSettings(_: string, form: FormData): Promise<string> {
  if (!await checkAdminSession()) return "Akses khusus pengurus.";
  const parsed = settings.safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Periksa slug, batas pendaftaran, kuota, syarat, dan kategori.";
  const { eventId, slug, deadline, capacity, terms, categories } = parsed.data;
  const date = new Date(deadline + ":00+07:00");
  const registrationCategories = [...new Set(categories.split("\n").map((line) => line.trim()).filter(Boolean))];
  if (!Number.isFinite(date.getTime()) || registrationCategories.some((line) => line.length > 100)) return "Tanggal atau kategori tidak valid.";
  try {
    await prisma.event.update({ where: { id: eventId }, data: {
      registrationSlug: slug, registrationDeadline: date, capacity, registrationTerms: terms, registrationCategories,
    } });
    revalidatePath("/daftar");
    revalidatePath("/admin/events/registration");
    return "Pengaturan disimpan.";
  } catch {
    return "Pengaturan tidak dapat disimpan. Pastikan slug belum dipakai acara lain.";
  }
}
