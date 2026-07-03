import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getBalance } from "./balance/route";
import { POST as claimTask } from "./claim-task/route";
import { POST as redeemReward } from "./redeem-reward/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// Mock dependencies
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    missionTask: {
      findUnique: vi.fn(),
    },
    reward: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userTransaction: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe("Coins API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSession = {
    user: { email: "admin@smi.org", id: "user-1" },
  };

  it("should return 401 for GET /balance if unauthenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/coins/balance");
    const res = await getBalance(req);
    expect(res.status).toBe(401);
  });

  it("should return balance and history for GET /balance if authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      coins: 45,
    } as any);
    vi.mocked(prisma.userTransaction.findMany).mockResolvedValue([
      { id: "tx-1", amount: 10, type: "CLAIM_TASK", description: "Misi Harian", createdAt: new Date() },
    ] as any);

    const req = new NextRequest("http://localhost/api/coins/balance");
    const res = await getBalance(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.balance).toBe(45);
    expect(body.history.length).toBe(1);
  });

  it("should process POST /claim-task successfully", async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.missionTask.findUnique).mockResolvedValue({
      id: "task-1",
      title: "Misi Harian",
      rewardCoins: 5,
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      coins: 20,
    } as any);

    const req = new NextRequest("http://localhost/api/coins/claim-task", {
      method: "POST",
      body: JSON.stringify({ taskId: "task-1" }),
    });
    const res = await claimTask(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.newBalance).toBe(25);
  });

  it("should process POST /redeem-reward successfully if enough balance", async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.reward.findUnique).mockResolvedValue({
      id: "reward-1",
      title: "Kaos SMI",
      coinCost: 15,
      stock: 5,
      isAvailable: true,
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      coins: 20,
    } as any);

    const req = new NextRequest("http://localhost/api/coins/redeem-reward", {
      method: "POST",
      body: JSON.stringify({ rewardId: "reward-1" }),
    });
    const res = await redeemReward(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.newBalance).toBe(5);
  });

  it("should return 400 for POST /redeem-reward if insufficient balance", async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.reward.findUnique).mockResolvedValue({
      id: "reward-1",
      title: "Kaos SMI",
      coinCost: 50,
      stock: 5,
      isAvailable: true,
    } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      coins: 20,
    } as any);

    const req = new NextRequest("http://localhost/api/coins/redeem-reward", {
      method: "POST",
      body: JSON.stringify({ rewardId: "reward-1" }),
    });
    const res = await redeemReward(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Saldo koin tidak mencukupi");
  });
});
