import { describe, it, expect, beforeEach } from "vitest";
import { useCoinStore } from "./useCoinStore";

describe("useCoinStore Zustand State", () => {
  beforeEach(() => {
    // Reset store state before each test
    useCoinStore.setState({
      balance: 0,
      isCounting: false,
      history: [],
    });
  });

  it("should initialize with default values", () => {
    const state = useCoinStore.getState();
    expect(state.balance).toBe(0);
    expect(state.isCounting).toBe(false);
    expect(state.history).toEqual([]);
  });

  it("should set balance correctly", () => {
    const store = useCoinStore.getState();
    store.setBalance(150);
    expect(useCoinStore.getState().balance).toBe(150);
  });

  it("should add transaction log and increment balance for CLAIM_TASK", () => {
    const store = useCoinStore.getState();
    const newTx = {
      id: "tx-1",
      amount: 10,
      type: "CLAIM_TASK" as const,
      description: "Hadir Event Bulanan",
      createdAt: new Date().toISOString(),
    };

    store.addTransaction(newTx);

    const updatedState = useCoinStore.getState();
    expect(updatedState.balance).toBe(10);
    expect(updatedState.history.length).toBe(1);
    expect(updatedState.history[0]).toEqual(newTx);
  });

  it("should decrement balance for REDEEM_REWARD", () => {
    const store = useCoinStore.getState();
    store.setBalance(50);

    const newTx = {
      id: "tx-2",
      amount: 20,
      type: "REDEEM_REWARD" as const,
      description: "Tukar Merchandise Kaos",
      createdAt: new Date().toISOString(),
    };

    store.addTransaction(newTx);

    const updatedState = useCoinStore.getState();
    expect(updatedState.balance).toBe(30);
    expect(updatedState.history.length).toBe(1);
  });
});
