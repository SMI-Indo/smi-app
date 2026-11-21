"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkAdminSession } from "@/lib/adminAuth";
import { fieldsSchema, parseWibDeadline, registrationClosesAt, registrationDeadlineFitsEvent } from "@/lib/registrationFields";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { adminRegistrationHref } from "./paths";

const settings = z.object({
  eventId: z.string().min(1),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  capacity: z.string().trim().transform((value) => value === "" ? null : Number(value))
    .pipe(z.number().int().min(1).max(100000).nullable()),
  terms: z.string().trim().min(1).max(10000),
  categories: z.string().trim().max(1000),
  fields: z.string().max(20000).transform((raw) => {
    try { return JSON.parse(raw) as unknown; } catch { return null; }
  }).pipe(fieldsSchema),
});

export async function saveRegistrationSettings(_: string, form: FormData): Promise<string> {
  if (!await checkAdminSession()) return "Akses khusus pengurus.";
  const parsed = settings.safeParse(Object.fromEntries(form));
  if (!parsed.success) return "Periksa slug, tenggat, kuota, syarat, cabang lomba, dan kolom tambahan.";
  const { eventId, slug, deadline, capacity, terms, categories, fields } = parsed.data;
  const date = parseWibDeadline(deadline);
  const registrationCategories = [...new Set(categories.split("\n").map((line) => line.trim()).filter(Boolean))];
  if (!date || registrationCategories.some((line) => line.length > 100)) return "Tanggal atau kategori tidak valid.";
  try {
    const error = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId }, select: { date: true, registrationDeadline: true } });
      if (!event) return "Kegiatan tidak ditemukan.";
      if (event.registrationDeadline?.getTime() !== date.getTime() && registrationClosesAt(date) <= new Date()) {
        return "Pilih tenggat yang masih akan datang.";
      }
      if (!registrationDeadlineFitsEvent(date, event.date)) return "Tenggat tidak boleh melewati tanggal kegiatan.";
      await tx.event.update({ where: { id: eventId }, data: {
        registrationSlug: slug, registrationDeadline: date, capacity, registrationTerms: terms, registrationCategories,
        registrationFields: fields,
      } });
    }, { isolationLevel: "Serializable" });
    if (error) return error;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return "Nama tautan sudah dipakai kegiatan lain. Pilih nama lain.";
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return "Jadwal sedang diperbarui. Muat ulang lalu coba lagi.";
    }
    return "Pengaturan tidak dapat disimpan. Coba lagi.";
  }
  revalidatePath("/daftar", "layout");
  revalidatePath("/admin/events", "layout");
  redirect(adminRegistrationHref(eventId, slug) + "?saved=1");
}
