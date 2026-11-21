"use client";

import { apiErrorMessage, readApiBody } from "@/lib/apiErrorMessage";

import { useEffect, useState } from "react";
import { useCoinStore } from "@/store/useCoinStore";

interface Task {
  id: string;
  title: string;
  description: string | null;
  rewardCoins: number;
  category: string;
}

interface Reward {
  id: string;
  title: string;
  description: string | null;
  coinCost: number;
  imageUrl: string | null;
  stock: number;
  isAvailable: boolean;
}

interface TransactionItem {
  id: string;
  amount: number;
  type: "CLAIM_TASK" | "REDEEM_REWARD";
  description: string;
  createdAt: string;
}

interface CoinInterfaceProps {
  initialBalance: number;
  initialHistory: TransactionItem[];
  tasks: Task[];
  rewards: Reward[];
}

function createUniqueId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "tx-" + String(Date.now());
}

export function CoinInterface({
  initialBalance,
  initialHistory,
  tasks,
  rewards,
}: CoinInterfaceProps) {
  const [activeTab, setActiveTab] = useState<"COLLECT" | "REDEEM">("COLLECT");
  const { balance, isCounting, history, setBalance, animateBalance, addTransaction } = useCoinStore();
  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  // Initialize Zustand state and animate counter
  useEffect(() => {
    setBalance(0);
    useCoinStore.setState({ history: initialHistory });
    animateBalance(initialBalance);
  }, [initialBalance, initialHistory, setBalance, animateBalance]);

  const handleClaim = async (taskId: string) => {
    setClaimingId(taskId);
    setClaimStatus(null);
    try {
      const res = await fetch("/api/coins/claim-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      const data = await readApiBody(res);
      if (res.ok) {
        setClaimStatus("Klaim berhasil! Koin bertambah.");
        const task = tasks.find((t) => t.id === taskId);
        addTransaction({
          id: createUniqueId(),
          amount: task?.rewardCoins || 0,
          type: "CLAIM_TASK",
          description: `[misi:${taskId}] Klaim Misi: ${task?.title}`,
          createdAt: new Date().toISOString(),
        });
      } else {
        setClaimStatus(apiErrorMessage(data, "Gagal klaim koin."));
      }
    } catch {
      setClaimStatus("Koneksi terganggu.");
    } finally {
      setClaimingId(null);
    }
  };

  const handleRedeem = async () => {
    if (!selectedReward) return;
    setRedeeming(true);
    setClaimStatus(null);
    try {
      const res = await fetch("/api/coins/redeem-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: selectedReward.id }),
      });
      const data = await readApiBody(res);
      if (res.ok) {
        setClaimStatus(`Klaim ${selectedReward.title} berhasil diproses!`);
        addTransaction({
          id: createUniqueId(),
          amount: selectedReward.coinCost,
          type: "REDEEM_REWARD",
          description: `Penukaran Koin: ${selectedReward.title}`,
          createdAt: new Date().toISOString(),
        });
        setSelectedReward(null);
      } else {
        setClaimStatus(apiErrorMessage(data, "Gagal menukarkan koin."));
      }
    } catch {
      setClaimStatus("Koneksi terganggu.");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left 2 Cols: Main Interface */}
      <div className="lg:col-span-2 space-y-6">
        {/* Coin Info Header */}
        <div className="p-8 rounded-[2rem] bg-gradient-to-br from-primary to-primary-container text-white flex flex-col md:flex-row items-center justify-between gap-6 card-glow relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <div className="text-center md:text-left space-y-1">
            <span className="font-label-sm text-xs bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">
              Koin Aktif Anda
            </span>
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
              <span className="material-symbols-outlined text-4xl text-secondary-container animate-spin" style={{ animationDuration: '3s' }}>
                token
              </span>
              <span className={`font-display-lg text-4xl md:text-5xl font-black ${isCounting ? "animate-pulse" : ""}`}>
                {balance}
              </span>
            </div>
          </div>
          <div className="flex gap-2 bg-white/10 p-1.5 rounded-full border border-white/20">
            <button
              onClick={() => setActiveTab("COLLECT")}
              className={`px-6 py-2.5 rounded-full font-label-sm transition-all cursor-pointer ${
                activeTab === "COLLECT" ? "bg-white text-primary" : "text-white hover:bg-white/10"
              }`}
            >
              Kumpulkan
            </button>
            <button
              onClick={() => setActiveTab("REDEEM")}
              className={`px-6 py-2.5 rounded-full font-label-sm transition-all cursor-pointer ${
                activeTab === "REDEEM" ? "bg-white text-primary" : "text-white hover:bg-white/10"
              }`}
            >
              Penukaran
            </button>
          </div>
        </div>

        {claimStatus && (
          <div className="p-4 rounded-xl text-center font-body-md text-sm border bg-surface-container border-outline/30 text-primary">
            {claimStatus}
          </div>
        )}

        {/* Tab 1: Collect Coins (Bento Grid of Tasks) */}
        {activeTab === "COLLECT" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant card-glow flex flex-col justify-between h-44 transition-all hover:scale-[1.01]"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-label-sm text-[10px] text-on-surface-variant font-bold uppercase">
                      {task.category}
                    </span>
                    <span className="font-mono text-sm font-bold text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">token</span>
                      <span>+{task.rewardCoins}</span>
                    </span>
                  </div>
                  <h4 className="font-body-lg font-bold text-on-surface line-clamp-1">{task.title}</h4>
                  <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{task.description}</p>
                </div>
                <button
                  onClick={() => handleClaim(task.id)}
                  disabled={claimingId !== null || history.some((tx) => tx.type === "CLAIM_TASK" && (tx.description.startsWith(`[misi:${task.id}] `) || tx.description === `Klaim Misi: ${task.title}`))}
                  className="w-full mt-4 bg-primary text-white font-label-lg py-2.5 rounded-full hover:bg-primary-container transition-all active:scale-[0.98] disabled:opacity-50 text-xs cursor-pointer"
                >
                  {claimingId === task.id ? "Mengklaim..." : "Klaim Koin"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* Tab 2: Redeem Rewards (Merchandise Grid) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="rounded-2xl border border-outline-variant bg-surface-container-low card-glow overflow-hidden flex flex-col justify-between"
              >
                <div className="relative aspect-video bg-neutral-100 flex items-center justify-center">
                  {reward.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={reward.imageUrl} alt={reward.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-outline/30">inventory_2</span>
                  )}
                  <span className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full font-mono text-[10px] font-bold flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-xs">token</span>
                    <span>{reward.coinCost} Koin</span>
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="font-body-lg font-bold text-on-surface">{reward.title}</h4>
                    <p className="text-xs text-on-surface-variant mt-1">{reward.description}</p>
                    <p className="text-[10px] text-secondary font-mono mt-2 uppercase font-bold">
                      Stok: {reward.stock} Pcs
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedReward(reward)}
                    disabled={reward.stock <= 0 || !reward.isAvailable || balance < reward.coinCost}
                    className="w-full bg-primary text-white font-label-lg py-2.5 rounded-full hover:bg-primary-container transition-all active:scale-[0.98] disabled:opacity-35 text-xs cursor-pointer"
                  >
                    {reward.stock <= 0 ? "Habis" : "Tukarkan Koin"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Transaction History Sidebar */}
      <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant card-glow space-y-4 h-[500px] flex flex-col justify-start">
        <h3 className="font-headline-md text-lg text-primary flex items-center gap-1.5 border-b border-outline-variant pb-2 shrink-0">
          <span className="material-symbols-outlined">history</span>
          <span>Riwayat Koin</span>
        </h3>
        <div className="flex-grow overflow-y-auto space-y-3 pr-1">
          {history.length > 0 ? (
            history.map((tx) => {
              const isClaim = tx.type === "CLAIM_TASK";
              return (
                <div key={tx.id} className="p-3 rounded-xl bg-surface border border-outline/10 flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <p className="font-body-md font-bold text-xs text-on-surface truncate">
                      {tx.description.replace(/^\[misi:[^\]]+\] /, "")}
                    </p>
                    <p className="text-[9px] text-on-surface-variant font-mono mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className={`font-mono text-xs font-bold shrink-0 flex items-center ${isClaim ? "text-green-700" : "text-primary"}`}>
                    {isClaim ? "+" : "-"}
                    {tx.amount}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center text-center text-xs text-on-surface-variant">
              Belum ada riwayat transaksi.
            </div>
          )}
        </div>
      </div>

      {/* Claim Confirmation Modal */}
      {selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-surface-container-lowest card-glow border border-outline-variant text-center space-y-4 animate-in zoom-in-95 duration-200">
            <span className="material-symbols-outlined text-4xl text-primary block mx-auto">shopping_bag</span>
            <h3 className="font-headline-md text-on-surface text-lg">Konfirmasi Penukaran</h3>
            <p className="font-body-md text-xs text-on-surface-variant">
              Apakah Anda yakin ingin menukarkan **{selectedReward.coinCost} Koin** untuk **{selectedReward.title}**?
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setSelectedReward(null)}
                className="px-5 py-2.5 rounded-full border border-outline font-label-lg text-xs hover:bg-surface-container transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="px-5 py-2.5 rounded-full bg-primary text-white font-label-lg text-xs hover:bg-primary-container transition-colors cursor-pointer"
              >
                {redeeming ? "Memproses..." : "Ya, Tukarkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
