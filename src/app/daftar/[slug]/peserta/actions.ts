"use server";

import { prisma } from "@/lib/prisma";
import { maskParticipantName, matchesParticipantViewCode, participantViewCode } from "@/lib/participantView";

const pageSize = 25;

export type ViewState = {
  error?: string;
  participants?: { name: string; category: string }[];
  page?: number;
  pages?: number;
  total?: number;
};

export async function viewParticipants(slug: string, code: string, page: number): Promise<ViewState> {
  if (typeof slug !== "string" || slug.length > 80 || typeof code !== "string" || code.length > 40 ||
      !Number.isSafeInteger(page) || page < 1) return { error: "Permintaan tidak valid." };
  try {
    const event = await prisma.event.findUnique({ where: { registrationSlug: slug }, select: { id: true } });
    if (!event || !matchesParticipantViewCode(code, participantViewCode(event.id, slug))) {
      return { error: "Kode akses tidak cocok untuk kegiatan ini." };
    }
    const where = { eventId: event.id };
    const total = await prisma.eventRegistration.count({ where });
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(page, pages);
    const participants = await prisma.eventRegistration.findMany({
      where, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (current - 1) * pageSize, take: pageSize,
      select: { name: true, category: true },
    });
    return { page: current, pages, total, participants: participants.map(({ name, category }) => ({
      name: maskParticipantName(name), category,
    })) };
  } catch {
    return { error: "Daftar peserta gagal dimuat. Coba lagi." };
  }
}
