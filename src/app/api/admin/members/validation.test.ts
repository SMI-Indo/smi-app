import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import { authorizeAdminApi } from "@/lib/adminAuth";
import { POST as members } from "./route";
import { DELETE, PUT } from "./[id]/route";
import { POST as reset } from "./[id]/reset-password/route";

const db = vi.hoisted(() => ({ create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), transaction: vi.fn(), hash: vi.fn() }));
vi.mock("@/lib/adminAuth", () => ({ authorizeAdminApi: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: db, $transaction: db.transaction } }));
vi.mock("bcryptjs", () => ({ default: { hash: db.hash } }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(authorizeAdminApi).mockResolvedValue({ auth: {
    user: { id: "admin", name: "Pengurus", email: "admin@example.test", role: "ADMIN" },
    session: { user: { id: "admin", role: "ADMIN" }, expires: "2099" },
  } });
  db.hash.mockResolvedValue("hashed");
  db.create.mockResolvedValue({ id: "new-account" });
  db.update.mockResolvedValue({ id: "account" });
});

function request(body: unknown, method = "POST") {
  return new NextRequest("http://localhost/api/admin/members", { method, body: JSON.stringify(body) });
}

const details = { action: "CREATE", name: " Maria ", email: " MARIA@example.test ", password: "  Password Baru  ", memberId: " smi-001 " };

it("normalizes member details but hashes the exact password", async () => {
  expect((await members(request(details))).status).toBe(201);
  expect(db.hash).toHaveBeenCalledWith(details.password, expect.any(Number));
  expect(db.create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ name: "Maria", email: "maria@example.test", memberId: "SMI-001" }),
  }));
});

it.each([{ name: "   " }, { memberId: "   " }, { password: "é".repeat(37) }])("validates create input before database calls: %j", async (overrides) => {
  expect((await members(request({ ...details, ...overrides }))).status).toBe(400);
  expect(db.findUnique).not.toHaveBeenCalled();
  expect(db.hash).not.toHaveBeenCalled();
});

it("rejects invalid IDs before editing, deleting, or resetting an account", async () => {
  const params = { params: Promise.resolve({ id: "bad id" }) };
  expect((await PUT(request({ name: "Maria" }, "PUT"), params)).status).toBe(400);
  expect((await DELETE(request({}, "DELETE"), params)).status).toBe(400);
  expect((await reset(request({ newPassword: "password-baru" }), params)).status).toBe(400);
  expect(db.transaction).not.toHaveBeenCalled();
  expect(db.hash).not.toHaveBeenCalled();
});

it("rejects a reset above bcrypt's byte limit", async () => {
  expect((await reset(request({ newPassword: "é".repeat(37) }), { params: Promise.resolve({ id: "account" }) })).status).toBe(400);
  expect(db.update).not.toHaveBeenCalled();
});
