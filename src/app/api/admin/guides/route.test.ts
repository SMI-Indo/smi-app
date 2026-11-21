import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import { DELETE, PATCH, POST } from "./route";

const { getServerSession, findUnique, create, update, remove } = vi.hoisted(() => ({
  getServerSession: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(),
}));
vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique }, liturgicalGuide: { create, update, delete: remove } } }));

beforeEach(() => {
  vi.resetAllMocks();
  getServerSession.mockResolvedValue({ user: { id: "account", email: "account@example.test" } });
  findUnique.mockResolvedValue({ id: "account", role: "ADMIN" });
});

function request(method: string, body: string) {
  return new NextRequest("http://localhost/api/admin/guides", { method, body });
}

it.each([["POST", POST], ["PATCH", PATCH], ["DELETE", DELETE]])("returns a 400 with a stable code for malformed or null %s bodies", async (method, handler) => {
  for (const body of ["{", "null"]) {
    const response = await handler(request(method, body));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "INVALID_INPUT", error: expect.any(String) });
  }
  expect(create).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
});

it("separates a missing session from an active account without the admin role", async () => {
  getServerSession.mockResolvedValueOnce(null);
  findUnique.mockResolvedValueOnce({ id: "account", role: "MEMBER" });
  const sessionRequired = await POST(request("POST", "{}"));
  expect(sessionRequired.status).toBe(401);
  expect(await sessionRequired.json()).toMatchObject({ code: "UNAUTHENTICATED" });
  const forbidden = await POST(request("POST", "{}"));
  expect(forbidden.status).toBe(403);
  expect(await forbidden.json()).toMatchObject({ code: "FORBIDDEN" });
});

it("maps missing records and hides unexpected database messages", async () => {
  remove.mockRejectedValueOnce({ code: "P2025" });
  const missing = await DELETE(request("DELETE", '{"id":"guide"}'));
  expect(missing.status).toBe(404);
  expect(await missing.json()).toMatchObject({ code: "NOT_FOUND" });
  create.mockRejectedValue(new Error("internal database path"));
  const failed = await POST(request("POST", '{"title":"Panduan","content":"Isi"}'));
  expect(failed.status).toBe(500);
  expect(await failed.json()).toEqual({ code: "INTERNAL_ERROR", error: "Panduan tidak dapat disimpan." });
});
