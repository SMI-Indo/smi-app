import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Mock database
vi.mock("@/lib/prisma", () => ({
  prisma: {
    newsletterSubscription: {
      upsert: vi.fn(),
    },
  },
}));

describe("POST /api/newsletter/subscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any) => {
    return new NextRequest("http://localhost/api/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify(body),
    });
  };

  it("should return 400 for invalid formats (not email, not phone)", async () => {
    const req = createRequest({ contact: "invalid-contact-format" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Kontak harus merupakan Email valid atau No. WhatsApp Indonesia (+62/08)");
  });

  it("should return 400 for empty contact", async () => {
    const req = createRequest({ contact: "" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should accept valid email and call prisma upsert", async () => {
    const mockEmail = "member@smi.org";
    vi.mocked(prisma.newsletterSubscription.upsert).mockResolvedValue({
      id: "sub-1",
      contact: mockEmail,
      subscribedAt: new Date(),
    });

    const req = createRequest({ contact: mockEmail });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.newsletterSubscription.upsert).toHaveBeenCalledWith({
      where: { contact: mockEmail },
      update: {},
      create: { contact: mockEmail },
    });
  });

  it("should accept valid Indonesian phone number (+62)", async () => {
    const mockPhone = "+6281234567890";
    vi.mocked(prisma.newsletterSubscription.upsert).mockResolvedValue({
      id: "sub-2",
      contact: mockPhone,
      subscribedAt: new Date(),
    });

    const req = createRequest({ contact: mockPhone });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should accept valid Indonesian phone number (08)", async () => {
    const mockPhone = "087712345678";
    vi.mocked(prisma.newsletterSubscription.upsert).mockResolvedValue({
      id: "sub-3",
      contact: mockPhone,
      subscribedAt: new Date(),
    });

    const req = createRequest({ contact: mockPhone });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
