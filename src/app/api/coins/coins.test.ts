import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getBalance } from "./balance/route";
import { POST as claimTask } from "./claim-task/route";
import { POST as redeemReward } from "./redeem-reward/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { User, MissionTask, Reward, UserTransaction } from "@prisma/client";

// Mock dependencies
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
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
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  mockPrisma.$transaction.mockImplementation(
    async (callback: (tx: typeof mockPrisma) => Promise<unknown>) => {
      return callback(mockPrisma);
    }
  );

  return { prisma: mockPrisma };
});

describe("Coins API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(
      async (callback: (tx: typeof prisma) => Promise<unknown>) => {
        return callback(prisma);
      }
    );
  });

  const mockSession = {
    user: { email: "admin@smi.org", id: "user-1" },
  };

  it("should return 401 for GET /balance if unauthenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const res = await getBalance();
    expect(res.status).toBe(401);
  });

  it("should return balance and history for GET /balance if authenticated", async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      coins: 45,
    } as unknown as User);
    vi.mocked(prisma.userTransaction.findMany).mockResolvedValue([
      { id: "tx-1", amount: 10, type: "CLAIM_TASK", description: "Misi Harian", createdAt: new Date() },
    ] as unknown as UserTransaction[]);

    const res = await getBalance();
    const body = (await res.json()) as { balance: number; history: UserTransaction[] };

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
    } as unknown as MissionTask);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      coins: 20,
    } as unknown as User);
    vi.mocked(prisma.userTransaction.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "user-1",
      coins: 25,
    } as unknown as User);

    const req = new NextRequest("http://localhost/api/coins/claim-task", {
      method: "POST",
      body: JSON.stringify({ taskId: "task-1" }),
    });
    const res = await claimTask(req);
    const body = (await res.json()) as { success: boolean; newBalance: number };

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.newBalance).toBe(25);
  });

  it("should reject POST /claim-task if task was already claimed", async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.missionTask.findUnique).mockResolvedValue({
      id: "task-1",
      title: "Misi Harian",
      rewardCoins: 5,
    } as unknown as MissionTask);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      coins: 20,
    } as unknown as User);
    vi.mocked(prisma.userTransaction.findFirst).mockResolvedValue({
      id: "tx-old",
      userId: "user-1",
      type: "CLAIM_TASK",
      description: "Klaim Misi: Misi Harian",
    } as unknown as UserTransaction);

    const req = new NextRequest("http://localhost/api/coins/claim-task", {
      method: "POST",
      body: JSON.stringify({ taskId: "task-1" }),
    });
    const res = await claimTask(req);
    const body = (await res.json()) as { error: string };

    expect(res.status).toBe(400);
    expect(body.error).toBe("Misi ini sudah pernah Anda klaim sebelumnya.");
  });

  it("should process POST /redeem-reward successfully if enough balance", async () => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.reward.findUnique).mockResolvedValue({
      id: "reward-1",
      title: "Kaos SMI",
      coinCost: 15,
      stock: 5,
      isAvailable: true,
    } as unknown as Reward);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      coins: 20,
    } as unknown as User);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "user-1",
      coins: 5,
    } as unknown as User);

    const req = new NextRequest("http://localhost/api/coins/redeem-reward", {
      method: "POST",
      body: JSON.stringify({ rewardId: "reward-1" }),
    });
    const res = await redeemReward(req);
    const body = (await res.json()) as { success: boolean; newBalance: number };

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
    } as unknown as Reward);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      coins: 20,
    } as unknown as User);

    const req = new NextRequest("http://localhost/api/coins/redeem-reward", {
      method: "POST",
      body: JSON.stringify({ rewardId: "reward-1" }),
    });
    const res = await redeemReward(req);
    const body = (await res.json()) as { error: string };

    expect(res.status).toBe(400);
    expect(body.error).toBe("Saldo koin tidak mencukupi");
  });
});
