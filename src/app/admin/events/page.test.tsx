import { expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import AdminEventsPage from "./page";

vi.mock("@/lib/prisma", () => ({ prisma: { event: { findMany: vi.fn() } } }));

it("passes scheduled events from the database to the manager", async () => {
  const date = new Date("2026-11-30T00:00:00Z");
  vi.mocked(prisma.event.findMany).mockResolvedValueOnce([{
    id: "e1", title: "Video Natal", description: null, category: "ACARA",
    date, time: "19.00 WIB", location: "Daring", status: "UPCOMING", createdAt: date,
    registrationSlug: "video-natal",
  }] as Awaited<ReturnType<typeof prisma.event.findMany>>);
  expect((await AdminEventsPage()).props.initialEvents).toEqual([
    expect.objectContaining({ id: "e1", registrationSlug: "video-natal", date: date.toISOString() }),
  ]);
});

it("lets the error boundary handle database failure instead of sending an empty schedule", async () => {
  vi.mocked(prisma.event.findMany).mockRejectedValueOnce(new Error("Database unavailable"));
  await expect(AdminEventsPage()).rejects.toThrow("Database unavailable");
});
