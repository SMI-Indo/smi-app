"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyByEmail } from "@/lib/email";
import { Prisma } from "@prisma/client";
import { fieldsSchema, readAnswers, registrationAvailability } from "@/lib/registrationFields";

const input = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().max(254).email(),
  category: z.string().trim().max(100).default(""),
  community: z.string().trim().min(2).max(120),
});

export type RegistrationResult = { error?: string; code?: string; emailSent?: boolean; submittedAt?: string };

export async function register(slug: string, _: RegistrationResult, form: FormData): Promise<RegistrationResult> {
  try {
    const session = await getServerSession(authOptions);
    const accountEmail = session?.user?.id ? session.user.email : undefined;
    const parsed = input.safeParse({ ...Object.fromEntries(form), email: accountEmail || form.get("email") });
    if (!parsed.success) return { error: "Periksa email, nama lengkap, dan asal paroki. Jika sesi berakhir, muat ulang atau masuk kembali." };
    const result = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { registrationSlug: slug }, include: { _count: { select: { registrations: true } } } });
      if (!event) {
        return { error: "Pendaftaran telah ditutup atau belum dibuka." } as const;
      }
      const availability = registrationAvailability(event.status, event.registrationDeadline, event.capacity, event._count.registrations);
      if (availability === "full") return { error: "Kuota acara sudah penuh." } as const;
      if (availability !== "open") return { error: "Pendaftaran telah ditutup atau belum dibuka." } as const;
      const categories = event.registrationCategories;
      if (categories.length ? !categories.includes(parsed.data.category) : parsed.data.category !== "") {
        return { error: "Cabang lomba yang dipilih tidak tersedia." } as const;
      }
      const fields = fieldsSchema.safeParse(event.registrationFields);
      if (!fields.success) return { error: "Pengaturan formulir belum valid. Hubungi pengurus." } as const;
      const response = readAnswers(fields.data, form);
      if ("error" in response) return { error: response.error } as const;
      const entry = await tx.eventRegistration.create({ data: {
        ...parsed.data, notes: "", customAnswers: response.answers, eventId: event.id,
      } });
      return { entry, event };
    }, { isolationLevel: "Serializable" });
    if (!result.entry) return { error: result.error };
    const { entry, event } = result;
    const emailSent = await notifyByEmail(entry.email, "registration", "Konfirmasi pendaftaran SMI", [
      event.title, "Kode registrasi: " + entry.id, event.date.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" }) + " · " + event.time, event.location,
    ]);
    return { code: entry.id, emailSent, submittedAt: entry.createdAt.toISOString() };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") return { error: "Email sudah terdaftar pada acara ini." };
      if (error.code === "P2034") return { error: "Kuota sedang diperbarui. Silakan kirim ulang." };
    }
    return { error: "Pendaftaran gagal disimpan. Silakan coba lagi." };
  }
}
