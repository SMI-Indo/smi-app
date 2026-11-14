"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkAdminSession } from "@/lib/adminAuth";
import { notifyByEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

type DeleteResult = { error?: string };
export type ParticipantEmailResult = {
  error?: string;
  sent?: boolean;
};

const emailFields = z.object({
  subject: z.string().trim().min(1).max(150).regex(/^[^\r\n]+$/),
  message: z.string().trim().min(1).max(4000),
});
const participantScope = z.object({ eventId: z.string().min(1), id: z.string().min(1) });

export async function deleteParticipant(eventId: string, id: string): Promise<DeleteResult> {
  try {
    if (!await checkAdminSession()) return { error: "Akses khusus admin." };
    const scope = participantScope.safeParse({ eventId, id });
    if (!scope.success) return { error: "Pendaftaran tidak valid." };
    const { count } = await prisma.eventRegistration.deleteMany({ where: scope.data });
    if (count === 0) return { error: "Pendaftaran ini sudah tidak tersedia. Muat ulang rekap peserta." };
  } catch {
    return { error: "Pendaftaran gagal dihapus. Coba lagi." };
  }
  revalidatePath("/daftar", "layout");
  revalidatePath("/admin/events/registration", "layout");
  return {};
}

export async function emailParticipant(
  eventId: string, id: string, _: ParticipantEmailResult, form: FormData,
): Promise<ParticipantEmailResult> {
  try {
    if (!await checkAdminSession()) return { error: "Akses khusus admin." };
    const parsed = emailFields.safeParse({ subject: form.get("subject"), message: form.get("message") });
    if (!parsed.success) return { error: "Periksa subjek dan isi pesan sebelum mengirim email." };
    const scope = participantScope.safeParse({ eventId, id });
    if (!scope.success) return { error: "Pendaftaran tidak valid." };

    const participant = await prisma.eventRegistration.findUnique({ where: scope.data, select: { email: true } });
    if (!participant) return { error: "Pendaftaran ini sudah tidak tersedia." };
    const sent = await notifyByEmail(participant.email, "participant", parsed.data.subject, parsed.data.message.split(/\r?\n/));
    if (sent) return { sent: true };
    return { error: "Email belum terkirim. Periksa konfigurasi email atau coba lagi." };
  } catch {
    return { error: "Email tidak dapat dikirim. Coba lagi." };
  }
}
