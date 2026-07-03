import { create } from "zustand";

interface Transaction {
  id: string;
  amount: number;
  type: "CLAIM_TASK" | "REDEEM_REWARD";
  description: string;
  createdAt: string;
}

interface CoinState {
  balance: number;
  isCounting: boolean;
  history: Transaction[];
  setBalance: (balance: number) => void;
  animateBalance: (targetBalance: number) => Promise<void>;
  addTransaction: (tx: Transaction) => void;
}

export const useCoinStore = create<CoinState>((set, get) => ({
  balance: 0,
  isCounting: false,
  history: [],
  setBalance: (balance) => set({ balance }),
  animateBalance: async (targetBalance) => {
    const current = get().balance;
    if (current === targetBalance) return;
    
    set({ isCounting: true });
    const duration = 1000; // 1s animation duration
    const steps = 30;
    const stepTime = duration / steps;
    const diff = targetBalance - current;
    
    for (let i = 1; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepTime));
      const nextVal = Math.round(current + (diff * (i / steps)));
      set({ balance: nextVal });
    }
    
    set({ balance: targetBalance, isCounting: false });
  },
  addTransaction: (tx) => set((state) => ({ 
    history: [tx, ...state.history],
    balance: state.balance + (tx.type === "CLAIM_TASK" ? tx.amount : -tx.amount)
  })),
}));
