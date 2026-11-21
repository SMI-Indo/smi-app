import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import { PATCH } from "./route";

const db = vi.hoisted(() => ({
  admin: vi.fn(), transaction: vi.fn(),
  violationRecord: { updateMany: vi.fn(), findUniqueOrThrow: vi.fn(), groupBy: vi.fn() },
  user: { update: vi.fn() },
}));
vi.mock("@/lib/adminAuth", () => ({ checkAdminSession: db.admin }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: db.transaction } }));

const original = { id: "violation-1", userId: "member-1", points: 7, status: "RESOLVED" };

beforeEach(() => {
  vi.resetAllMocks();
  db.admin.mockResolvedValue({ user: { id: "admin-1" } });
  db.transaction.mockImplementation(async (run) => run(db));
  db.violationRecord.updateMany.mockResolvedValue({ count: 1 });
  db.violationRecord.findUniqueOrThrow.mockResolvedValue({ ...original, status: "CANCELLED" });
  db.violationRecord.groupBy.mockResolvedValue([{ userId: original.userId, _sum: { points: 5 } }]);
});

function cancel(reason?: string) {
  return PATCH(new NextRequest("http://localhost/api/admin/violations", {
    method: "PATCH", body: JSON.stringify({ id: original.id, status: "CANCELLED", reason }),
  }));
}

it("records who cancelled a resolved violation and returns the remaining ledger total", async () => {
  const result = await cancel("Salah input");
  expect(result.status).toBe(200);
  expect(await result.json()).toMatchObject({ violation: { status: "CANCELLED" }, memberPoints: 5 });
  expect(db.violationRecord.updateMany).toHaveBeenCalledWith({
    where: { id: original.id, status: { not: "CANCELLED" } },
    data: { status: "CANCELLED", cancellationReason: "Salah input", cancelledById: "admin-1", cancelledAt: expect.any(Date) },
  });
});

it("does not decrement the legacy cache twice when a cancellation is repeated", async () => {
  db.violationRecord.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
  const results = await Promise.all([cancel("Salah input"), cancel("Salah input")]);
  expect(results.map(({ status }) => status).sort()).toEqual([200, 409]);
  expect(db.user.update).toHaveBeenCalledTimes(1);
});

it("does not report a successful cancellation if the compatibility write fails", async () => {
  db.user.update.mockRejectedValue(new Error("cache update failed"));
  expect((await cancel("Salah input")).status).toBe(500);
  expect(db.violationRecord.groupBy).not.toHaveBeenCalled();
});

it("rejects an absent reason or an unauthorized caller before writing", async () => {
  expect((await cancel()).status).toBe(400);
  db.admin.mockResolvedValue(null);
  expect((await cancel("Salah input")).status).toBe(403);
  expect(db.transaction).not.toHaveBeenCalled();
});
