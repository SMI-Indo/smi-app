"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyByEmail } from "@/lib/email";
import { Prisma } from "@prisma/client";

const input = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().max(254).email(),
  phone: z.string().trim().regex(/^(?:\+628|08)\d{8,12}$/).transform((phone) => phone.replace(/^0/, "+62")),
  category: z.string().trim().min(1).max(100),
  community: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(1000),
});

export type RegistrationResult = { error?: string; code?: string; emailSent?: boolean };

export async function register(slug: string, _: RegistrationResult, form: FormData): Promise<RegistrationResult> {
  const parsed = input.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Periksa nama, email, WhatsApp, kategori, asal unit, dan catatan." };
  try {
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { registrationSlug: slug }, include: { _count: { select: { registrations: true } } } });
      if (!event || event.status !== "UPCOMING" || !event.registrationDeadline || event.registrationDeadline <= new Date() || !event.capacity) {
        return { error: "Pendaftaran telah ditutup atau belum dibuka." } as const;
      }
      if (event._count.registrations >= event.capacity) return { error: "Kuota acara sudah penuh." } as const;
      if (!event.registrationCategories.includes(parsed.data.category)) return { error: "Kategori yang dipilih tidak tersedia." } as const;
      const entry = await tx.eventRegistration.create({ data: { ...parsed.data, eventId: event.id } });
      return { entry, event };
    }, { isolationLevel: "Serializable" });
    if (!result.entry) return { error: result.error };
    const { entry, event } = result;
    const emailSent = await notifyByEmail(entry.email, "registration", "Konfirmasi pendaftaran SMI", [
      event.title, "Kode registrasi: " + entry.id, event.date.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }) + " · " + event.time, event.location,
    ]);
    return { code: entry.id, emailSent };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return { error: "Email atau nomor WhatsApp sudah terdaftar pada acara ini." };
      if (error.code === "P2034") return { error: "Kuota sedang diperbarui. Silakan kirim ulang." };
    }
    return { error: "Pendaftaran gagal disimpan. Silakan coba lagi." };
  }
}
