import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkAdminSession } from "@/lib/adminAuth";
import { notifyByEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { deleteParticipant, emailParticipant } from "./participantActions";

vi.mock("@/lib/adminAuth", () => ({ checkAdminSession: vi.fn() }));
vi.mock("@/lib/email", () => ({ notifyByEmail: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { eventRegistration: { deleteMany: vi.fn(), findUnique: vi.fn() } },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const participants = vi.mocked(prisma.eventRegistration);
const admin = vi.mocked(checkAdminSession);
const recipient = { email: "peserta@example.org" };

function messageForm() {
  const form = new FormData();
  form.set("subject", "Jadwal baru");
  form.set("message", "Acara dimulai pukul 10.");
  form.set("email", "ignored@example.org");
  return form;
}

beforeEach(() => {
  vi.resetAllMocks();
  admin.mockResolvedValue({} as NonNullable<Awaited<ReturnType<typeof checkAdminSession>>>);
});

describe("participant actions", () => {
  it("rejects both actions without an admin session", async () => {
    admin.mockResolvedValue(null);
    expect(await deleteParticipant("event", "participant")).toHaveProperty("error");
    expect(await emailParticipant("event", "participant", {}, messageForm())).toHaveProperty("error");
    expect(participants.deleteMany).not.toHaveBeenCalled();
    expect(participants.findUnique).not.toHaveBeenCalled();
    expect(notifyByEmail).not.toHaveBeenCalled();
  });

  it("deletes only the registration scoped to the selected event and refreshes counts", async () => {
    participants.deleteMany.mockResolvedValue({ count: 1 });
    expect(await deleteParticipant("event", "participant")).toEqual({});
    expect(participants.deleteMany).toHaveBeenCalledWith({ where: { eventId: "event", id: "participant" } });
    expect(revalidatePath).toHaveBeenCalledWith("/daftar", "layout");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/events/registration", "layout");
    expect(notifyByEmail).not.toHaveBeenCalled();
  });

  it("handles a repeated deletion without affecting another registration", async () => {
    participants.deleteMany.mockResolvedValue({ count: 0 });
    expect(await deleteParticipant("event", "participant")).toHaveProperty("error");
    expect(notifyByEmail).not.toHaveBeenCalled();
  });

  it("rejects missing IDs before Prisma can omit a filter", async () => {
    const missingId = undefined as unknown as string;
    expect(await deleteParticipant("event", missingId)).toHaveProperty("error");
    expect(await emailParticipant(missingId, "participant", {}, messageForm())).toHaveProperty("error");
    expect(participants.deleteMany).not.toHaveBeenCalled();
    expect(participants.findUnique).not.toHaveBeenCalled();
  });

  it("sends to the saved recipient for that event", async () => {
    participants.findUnique.mockResolvedValue(recipient as Awaited<ReturnType<typeof prisma.eventRegistration.findUnique>>);
    vi.mocked(notifyByEmail).mockResolvedValue(true);
    expect(await emailParticipant("event", "participant", {}, messageForm())).toHaveProperty("sent", true);
    expect(participants.findUnique).toHaveBeenCalledWith({ where: { eventId: "event", id: "participant" }, select: { email: true } });
    expect(notifyByEmail).toHaveBeenCalledWith(recipient.email, "participant", "Jadwal baru", ["Acara dimulai pukul 10."]);
  });

  it("rejects invalid messages and missing participants without sending", async () => {
    expect(await emailParticipant("event", "participant", {}, new FormData())).toHaveProperty("error");
    expect(participants.findUnique).not.toHaveBeenCalled();
    participants.findUnique.mockResolvedValue(null);
    expect(await emailParticipant("event", "participant", {}, messageForm())).toHaveProperty("error");
    expect(notifyByEmail).not.toHaveBeenCalled();
  });

  it("reports mail delivery failure", async () => {
    participants.findUnique.mockResolvedValue(recipient as Awaited<ReturnType<typeof prisma.eventRegistration.findUnique>>);
    vi.mocked(notifyByEmail).mockResolvedValue(false);
    expect(await emailParticipant("event", "participant", {}, messageForm())).toMatchObject({
      error: expect.any(String),
    });
  });
});
