import { beforeEach, expect, it, vi } from "vitest";
import { updateMemberSafely, deleteMemberSafely } from "./memberAdmin";
const db = vi.hoisted(() => ({ user: { findUnique: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn() }, violationRecord: { count: vi.fn(), groupBy: vi.fn() }, $transaction: vi.fn() }));
vi.mock("./prisma", () => ({ prisma: db }));
beforeEach(() => {
  vi.resetAllMocks();
  db.$transaction.mockImplementation(async (run) => run(db));
  db.user.findUnique.mockResolvedValue({ role: "MEMBER", isApproved: false, memberId: null });
  db.user.count.mockResolvedValue(2);
  db.violationRecord.count.mockResolvedValue(0);
  db.violationRecord.groupBy.mockResolvedValue([]);
  db.user.update.mockResolvedValue({ id: "member" });
});
it("rejects approval without a member ID", async () => {
  await expect(updateMemberSafely("member", { isApproved: true })).rejects.toThrow("Nomor anggota");
  expect(db.user.update).not.toHaveBeenCalled();
});
it("rejects removing an approved member's ID", async () => {
  db.user.findUnique.mockResolvedValue({ role: "MEMBER", isApproved: true, memberId: "SMI-1" });
  await expect(updateMemberSafely("member", { memberId: null })).rejects.toThrow("Nomor anggota");
});
it("allows approval and member ID in one update", async () => {
  await expect(updateMemberSafely("member", { isApproved: true, memberId: "SMI-1" })).resolves.toEqual({ id: "member", violationPoints: 0 });
  expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
});
it("blocks demoting the final admin", async () => {
  db.user.findUnique.mockResolvedValue({ role: "ADMIN", isApproved: true, memberId: null });
  db.user.count.mockResolvedValue(1);
  await expect(updateMemberSafely("admin", { role: "MEMBER", isApproved: false })).rejects.toThrow("admin terakhir");
  expect(db.user.update).not.toHaveBeenCalled();
});
it("blocks deleting the final admin", async () => {
  db.user.findUnique.mockResolvedValue({ role: "ADMIN" }); db.user.count.mockResolvedValue(1);
  await expect(deleteMemberSafely("admin")).rejects.toThrow("admin terakhir");
  expect(db.user.delete).not.toHaveBeenCalled();
});
it("allows deleting a member", async () => {
  await deleteMemberSafely("member");
  expect(db.user.delete).toHaveBeenCalledWith({ where: { id: "member" } });
});

it("preserves disciplinary history instead of cascading away private evidence", async () => {
 db.violationRecord.count.mockResolvedValue(1);
 await expect(deleteMemberSafely("member")).rejects.toThrow("riwayat pelanggaran");
 expect(db.user.delete).not.toHaveBeenCalled();
});
