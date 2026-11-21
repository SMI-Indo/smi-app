import { beforeEach, expect, it, vi } from "vitest";
import { checkAdminSession } from "./adminAuth";

const { session, findUnique } = vi.hoisted(() => ({ session: vi.fn(), findUnique: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: session }));
vi.mock("./auth", () => ({ authOptions: {} }));
vi.mock("./prisma", () => ({ prisma: { user: { findUnique } } }));

beforeEach(() => vi.resetAllMocks());

it("checks the signed-in ID when an email is reassigned", async () => {
  session.mockResolvedValue({ user: { id: "member", email: "admin@example.test" } });
  findUnique.mockImplementation(async ({ where }) => where.id === "member"
    ? { id: "member", role: "MEMBER" }
    : { id: "admin", role: "ADMIN" });

  expect(await checkAdminSession()).toBeNull();
  expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "member" } }));
});

it("accepts the current admin role even if the session snapshot says member", async () => {
  session.mockResolvedValue({ user: { id: "promoted", email: "promoted@example.test", role: "MEMBER" } });
  findUnique.mockResolvedValue({ id: "promoted", role: "ADMIN" });
  expect(await checkAdminSession()).toMatchObject({ user: { id: "promoted", role: "ADMIN" } });
});

it("rejects a session with a cleared account ID without querying by email", async () => {
  session.mockResolvedValue({ user: { id: "", email: "old@example.test" } });
  expect(await checkAdminSession()).toBeNull();
  expect(findUnique).not.toHaveBeenCalled();
});
