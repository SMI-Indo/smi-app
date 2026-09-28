import { prisma } from "@/lib/prisma";
import {
  AdminEventsManager,
  EventData,
} from "@/components/admin/AdminEventsManager";

export const revalidate = 0; // Data admin selalu real-time

export default async function AdminEventsPage() {
  let events: EventData[] = [];

  try {
    const rawEvents = await prisma.event.findMany({
      orderBy: { date: "asc" },
    });

    events = rawEvents.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      category: e.category,
      date: e.date.toISOString(),
      time: e.time,
      location: e.location,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error loading admin events page:", error);
  }

  return <AdminEventsManager initialEvents={events} />;
}
