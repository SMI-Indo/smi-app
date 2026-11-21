import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "./route";

const db = vi.hoisted(() => ({
  admin: vi.fn(), transaction: vi.fn(), violationRecord: { count: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
}));
vi.mock("@/lib/adminAuth", () => ({ checkAdminSession: db.admin }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: db.transaction } }));

beforeEach(() => {
  vi.resetAllMocks();
  db.admin.mockResolvedValue({ user: { id: "admin" } });
  db.transaction.mockImplementation(async (run) => run(db));
  db.violationRecord.count.mockResolvedValue(21);
  db.violationRecord.findMany.mockResolvedValue([{ id: "record", userId: "member", user: { id: "member" } }]);
  db.violationRecord.groupBy.mockResolvedValue([{ userId: "member", _sum: { points: 47 } }]);
});

it("filters and pages the history without narrowing the member’s total points", async () => {
  const result = await GET(new Request("http://localhost/api/admin/violations/history?memberId=member&severity=BERAT&status=OPEN&page=2"));
  expect(result.status).toBe(200);
  expect(await result.json()).toMatchObject({ memberPoints: 47, page: 2, totalPages: 2, total: 21 });
  expect(db.violationRecord.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ userId: "member", severity: "BERAT", status: "OPEN" }),
    orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: 20, take: 20,
  }));
  expect(db.violationRecord.groupBy).toHaveBeenCalledWith({
    by: ["userId"], where: { userId: { in: ["member"] }, status: { not: "CANCELLED" } }, _sum: { points: true },
  });
});

it("rejects an unsupported severity without reading the database", async () => {
  const result = await GET(new Request("http://localhost/api/admin/violations/history?severity=UNKNOWN"));
  expect(result.status).toBe(400);
  expect(db.transaction).not.toHaveBeenCalled();
});
