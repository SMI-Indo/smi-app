import { prisma } from "@/lib/prisma";
import { scheduleOrder, scheduleSelect, serializeScheduleEvent } from "@/lib/adminSchedule";
import { AdminEventsManager } from "@/components/admin/AdminEventsManager";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({ orderBy: scheduleOrder, select: scheduleSelect });
  return <AdminEventsManager initialEvents={events.map(serializeScheduleEvent)} />;
}
