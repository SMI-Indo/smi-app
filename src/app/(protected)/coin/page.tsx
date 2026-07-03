import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CoinInterface } from "@/components/coin/CoinInterface";

export const revalidate = 0; // Data transaksi user harus selalu aktual

export default async function CoinPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  // Ambil saldo koin user saat ini
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, coins: true },
  });

  if (!user) {
    redirect("/login");
  }

  // Ambil riwayat transaksi
  const history = await prisma.userTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Ambil daftar misi/tugas
  const tasks = await prisma.missionTask.findMany();

  // Ambil daftar merchandise reward
  const rewards = await prisma.reward.findMany({
    where: { isAvailable: true },
  });

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">token</span>
          </div>
          <h1 className="font-headline-lg text-primary">Collect &amp; Redeem Coins</h1>
          <p className="font-body-lg text-on-surface-variant max-w-xl mx-auto text-sm md:text-base">
            Klaim koin dari misi pelayanan liturgi dan dapatkan ragam merchandise resmi Sahabat Misdinar Indonesia.
          </p>
        </div>

        {/* Interactive coin collection client dashboard */}
        <CoinInterface
          initialBalance={user.coins}
          initialHistory={history as any}
          tasks={tasks as any}
          rewards={rewards as any}
        />
      </div>
    </main>
  );
}
