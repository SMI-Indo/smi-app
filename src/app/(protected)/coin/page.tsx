import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CoinInterface } from "@/components/coin/CoinInterface";
import { MissionTask, Reward } from "@prisma/client";

export const revalidate = 0; // Data transaksi user harus selalu aktual

interface HistoryItem {
  id: string;
  amount: number;
  type: "CLAIM_TASK" | "REDEEM_REWARD";
  description: string;
  createdAt: string;
}

export default async function CoinPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  let userCoins = 0;
  let formattedHistory: HistoryItem[] = [];
  let tasks: MissionTask[] = [];
  let rewards: Reward[] = [];
  let hasDbError = false;
  let userNotFound = false;

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, coins: true },
    });

    if (!user) {
      userNotFound = true;
    } else {
      userCoins = user.coins;

      const [historyData, taskData, rewardData] = await Promise.all([
        prisma.userTransaction.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
        }),
        prisma.missionTask.findMany(),
        prisma.reward.findMany({
          where: { isAvailable: true },
        }),
      ]);

      formattedHistory = historyData.map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        createdAt: tx.createdAt.toISOString(),
      }));
      tasks = taskData;
      rewards = rewardData;
    }
  } catch {
    hasDbError = true;
  }

  if (userNotFound) {
    redirect("/login");
  }

  if (hasDbError) {
    return (
      <main className="min-h-screen bg-background py-12">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-4">
          <h1 className="font-headline-lg text-primary">Collect &amp; Redeem Coins</h1>
          <div className="p-8 rounded-2xl bg-surface-container border border-outline-variant text-on-surface-variant max-w-md mx-auto">
            <p>Terjadi kendala menghubungkan ke database server. Silakan coba muat ulang beberapa saat lagi.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">token</span>
          </div>
          <h1 className="font-headline-lg text-primary">Collect &amp; Redeem Coins</h1>
          <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto text-sm md:text-base">
            Klaim koin dari misi pelayanan liturgi dan dapatkan ragam merchandise resmi Sahabat Misdinar Indonesia.
          </p>
        </div>

        <CoinInterface
          initialBalance={userCoins}
          initialHistory={formattedHistory}
          tasks={tasks}
          rewards={rewards}
        />
      </div>
    </main>
  );
}
