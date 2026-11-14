import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
const deps = vi.hoisted(() => ({ session: vi.fn(), find: vi.fn(), update: vi.fn(), compare: vi.fn(), hash: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: deps.session }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: deps.find, updateMany: deps.update } } }));
vi.mock("bcryptjs", () => ({ default: { compare: deps.compare, hash: deps.hash } }));
function request(overrides = {}) { return new NextRequest("http://localhost/api/account/password", { method: "POST", body: JSON.stringify({ currentPassword: "old-pass", newPassword: "new-password", confirmation: "new-password", ...overrides }) }); }
beforeEach(() => {
  vi.resetAllMocks(); deps.session.mockResolvedValue({ user: { id: "member" } });
  deps.find.mockResolvedValue({ password: "old-hash" }); deps.compare.mockResolvedValue(true);
  deps.hash.mockResolvedValue("new-hash"); deps.update.mockResolvedValue({ count: 1 });
});
it("requires an active session", async () => { deps.session.mockResolvedValue(null); expect((await POST(request())).status).toBe(401); expect(deps.update).not.toHaveBeenCalled(); });
it("rejects incorrect current password", async () => { deps.compare.mockResolvedValue(false); expect((await POST(request())).status).toBe(400); expect(deps.update).not.toHaveBeenCalled(); });
it("rejects mismatched confirmation", async () => { expect((await POST(request({ confirmation: "different" }))).status).toBe(400); expect(deps.update).not.toHaveBeenCalled(); });
it("changes only the current account with an unchanged password hash", async () => {
  expect((await POST(request({ userId: "other-member" }))).status).toBe(200);
  expect(deps.update).toHaveBeenCalledWith({ where: { id: "member", password: "old-hash" }, data: { password: "new-hash" } });
});
it("does not overwrite a concurrent admin reset", async () => { deps.update.mockResolvedValue({ count: 0 }); expect((await POST(request())).status).toBe(409); });
it("handles provider-only accounts without inventing a password", async () => { deps.find.mockResolvedValue({ password: null }); expect((await POST(request())).status).toBe(400); expect(deps.update).not.toHaveBeenCalled(); });
it("rejects passwords exceeding bcrypt's 72 UTF-8 byte limit", async () => {
 const password = "é".repeat(37);
 expect((await POST(request({ newPassword: password, confirmation: password }))).status).toBe(400);
 expect(deps.update).not.toHaveBeenCalled();
});
