import type { Prisma } from "@prisma/client";

export const participantPageSize = 25;
export const participantSearchLimit = 120;
export const participantOrder: Prisma.EventRegistrationOrderByWithRelationInput[] = [
  { createdAt: "desc" },
  { id: "desc" },
];

export function registrationEventWhere(route: string): Prisma.EventWhereUniqueInput {
  return route.startsWith("~") ? { id: route.slice(1) } : { registrationSlug: route };
}

export function participantSearch(raw?: string | string[]) {
  return ((Array.isArray(raw) ? raw[0] : raw) ?? "").trim().slice(0, participantSearchLimit);
}

export function participantWhere(eventId: string, query: string): Prisma.EventRegistrationWhereInput {
  if (!query) return { eventId };
  const match = { contains: query.replace(/[\\%_]/g, "\\$&"), mode: "insensitive" as const };
  return { eventId, OR: [{ name: match }, { email: match }, { community: match }, { category: match }, { id: match }] };
}

export function participantPage(raw: string | string[] | undefined, count: number) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const pages = Math.max(1, Math.ceil(count / participantPageSize));
  const page = value && /^[1-9]\d*$/.test(value) ? Math.min(Number(value), pages) : 1;
  return { page, pages, skip: (page - 1) * participantPageSize };
}
