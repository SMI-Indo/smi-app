import { beforeEach, expect, it, vi } from "vitest";
import { updateMemberSafely, deleteMemberSafely } from "./memberAdmin";
const db = vi.hoisted(() => ({ user: { findUnique: vi.fn(), count: vi.fn(), update: vi.fn(), delete: vi.fn() }, $transaction: vi.fn() }));
vi.mock("./prisma", () => ({ prisma: db }));
beforeEach(() => {
  vi.resetAllMocks();
  db.$transaction.mockImplementation(async (run) => run(db));
  db.user.findUnique.mockResolvedValue({ role: "MEMBER", isApproved: false, memberId: null });
  db.user.count.mockResolvedValue(2);
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
  await expect(updateMemberSafely("member", { isApproved: true, memberId: "SMI-1" })).resolves.toEqual({ id: "member" });
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
