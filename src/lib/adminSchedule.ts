import type { Prisma } from "@prisma/client";

export const scheduleSelect = {
  id: true, title: true, description: true, category: true, date: true,
  time: true, location: true, status: true, createdAt: true, registrationSlug: true,
} satisfies Prisma.EventSelect;

export const scheduleOrder = [{ date: "desc" }, { id: "asc" }] satisfies Prisma.EventOrderByWithRelationInput[];

export function serializeScheduleEvent(event: Prisma.EventGetPayload<{ select: typeof scheduleSelect }>) {
  return { ...event, date: event.date.toISOString(), createdAt: event.createdAt.toISOString() };
}
