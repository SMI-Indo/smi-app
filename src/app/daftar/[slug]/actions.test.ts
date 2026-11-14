import { beforeEach, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth";
import { register } from "./actions";

const db = vi.hoisted(() => ({ event: { findUnique: vi.fn() }, eventRegistration: { create: vi.fn() }, transaction: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: db.transaction } }));
vi.mock("@/lib/email", () => ({ notifyByEmail: vi.fn().mockResolvedValue(true) }));
vi.mock("@prisma/client", () => ({ Prisma: { PrismaClientKnownRequestError: class extends Error { constructor(public code: string) { super(code); } } } }));

function form(email?: string) {
  const data = new FormData();
  data.set("name", "Maria SMI"); data.set("community", "Paroki Santo Yosef");
  if (email !== undefined) data.set("email", email);
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerSession).mockResolvedValue(null);
  db.event.findUnique.mockResolvedValue({ id: "event-1", title: "Temu SMI", status: "UPCOMING", registrationDeadline: new Date("2099-01-01"), capacity: 10, _count: { registrations: 0 }, registrationCategories: [], registrationFields: [], date: new Date(), time: "19:00", location: "Online" });
  db.eventRegistration.create.mockImplementation(async ({ data }) => ({ ...data, id: "registration-1", createdAt: new Date() }));
  db.transaction.mockImplementation(async (run) => run(db));
});
it("registers a signed-in account without an email field", async () => {
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "member-1", email: "member@smi.org" }, expires: "2099" });
  expect(await register("temu", {}, form())).toMatchObject({ code: "registration-1" });
  expect(db.eventRegistration.create).toHaveBeenCalledWith({ data: expect.objectContaining({ email: "member@smi.org" }) });
});
it("ignores a forged form email for a signed-in account", async () => {
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: "member-1", email: "member@smi.org" }, expires: "2099" });
  await register("temu", {}, form("other@smi.org"));
  expect(db.eventRegistration.create).toHaveBeenCalledWith({ data: expect.objectContaining({ email: "member@smi.org" }) });
});
it("keeps guest registration and normalizes email", async () => {
  expect(await register("temu", {}, form(" Guest@SMI.org "))).toMatchObject({ code: "registration-1" });
  expect(db.eventRegistration.create).toHaveBeenCalledWith({ data: expect.objectContaining({ email: "guest@smi.org" }) });
});
it.each([undefined, "bad-email"])("rejects guest or expired session without valid email: %s", async (email) => {
  expect(await register("temu", {}, form(email))).toHaveProperty("error");
  expect(db.transaction).not.toHaveBeenCalled();
});
it("fails closed when session resolution throws", async () => {
  vi.mocked(getServerSession).mockRejectedValue(new Error("session unavailable"));
  expect(await register("temu", {}, form("guest@smi.org"))).toHaveProperty("error");
  expect(db.transaction).not.toHaveBeenCalled();
});
it("does not create an entry for a closed event", async () => {
  db.event.findUnique.mockResolvedValue({ status: "COMPLETED" });
  expect(await register("temu", {}, form("guest@smi.org"))).toHaveProperty("error");
  expect(db.eventRegistration.create).not.toHaveBeenCalled();
});
it("does not create an entry for a full event", async () => {
  const event = await db.event.findUnique();
  db.event.findUnique.mockResolvedValue({ ...event, capacity: 1, _count: { registrations: 1 } });
  expect(await register("temu", {}, form("guest@smi.org"))).toHaveProperty("error");
  expect(db.eventRegistration.create).not.toHaveBeenCalled();
});
it("does not create an entry when a required custom answer is absent", async () => {
  const event = await db.event.findUnique();
  db.event.findUnique.mockResolvedValue({ ...event, registrationFields: [{ id: "proof", label: "Bukti", type: "text", required: true }] });
  expect(await register("temu", {}, form("guest@smi.org"))).toHaveProperty("error");
  expect(db.eventRegistration.create).not.toHaveBeenCalled();
});
it("keeps duplicate and transaction conflict messages", async () => {
  const { Prisma } = await import("@prisma/client");
  for (const [code, message] of [["P2002", "Email sudah terdaftar"], ["P2034", "Kuota sedang diperbarui"]]) {
    const error = Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), { code });
    db.transaction.mockRejectedValueOnce(error);
    expect((await register("temu", {}, form("guest@smi.org"))).error).toContain(message);
  }
});
