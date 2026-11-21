import { expect, it, vi } from "vitest";
import { updateOrder } from "./actions";

const transaction = vi.hoisted(() => vi.fn());
vi.mock("@/lib/adminAuth", () => ({ checkAdminSession: vi.fn().mockResolvedValue({ user: { id: "admin" } }) }));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: transaction } }));

it("rejects an invalid order status before accessing the order", async () => {
  const form = new FormData();
  form.set("id", "order-1");
  form.set("status", "UNKNOWN");
  expect(await updateOrder(null, form)).toEqual({ ok: false, message: "Pesanan tidak valid." });
  expect(transaction).not.toHaveBeenCalled();
});
