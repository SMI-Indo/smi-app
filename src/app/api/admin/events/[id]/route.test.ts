import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import { PUT } from "./route";

const db = vi.hoisted(() => ({ event: { findUnique: vi.fn(), update: vi.fn() }, transaction: vi.fn() }));
vi.mock("@/lib/adminAuth", () => ({ authorizeAdminApi: vi.fn().mockResolvedValue({ auth: { user: { id: "admin" } } }) }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: db.transaction } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  db.transaction.mockImplementation(async (run) => run(db));
  db.event.findUnique.mockResolvedValue({
    date: new Date("2026-12-01T00:00:00+07:00"),
    registrationDeadline: new Date("2026-11-30T23:59:00+07:00"),
  });
  db.event.update.mockResolvedValue({ id: "event-1" });
});

function editDate(date: string, status?: "COMPLETED") {
  return PUT(new NextRequest("http://localhost/api/admin/events/event-1", {
    method: "PUT", body: JSON.stringify({ date, status }),
  }), { params: Promise.resolve({ id: "event-1" }) });
}

it("prevents moving an event before its existing WIB deadline", async () => {
  expect((await editDate("2026-11-29")).status).toBe(409);
  expect(db.event.update).not.toHaveBeenCalled();
});

it("allows a deadline on the event date and saves midnight WIB", async () => {
  expect((await editDate("2026-11-30")).status).toBe(200);
  expect(db.event.update).toHaveBeenCalledWith({
    where: { id: "event-1" }, data: { date: new Date("2026-11-30T00:00:00+07:00") },
  });
});

it("rejects invalid calendar input before starting a write", async () => {
  expect((await editDate("2026-02-30")).status).toBe(400);
  expect(db.transaction).not.toHaveBeenCalled();
});

it("allows closing an older event whose unchanged date is before its stored deadline", async () => {
  db.event.findUnique.mockResolvedValue({
    date: new Date("2026-11-29T03:00:00Z"),
    registrationDeadline: new Date("2026-11-30T23:59:00+07:00"),
  });
  expect((await editDate("2026-11-29", "COMPLETED")).status).toBe(200);
  expect(db.event.update).toHaveBeenCalledWith({ where: { id: "event-1" }, data: { status: "COMPLETED" } });
});
