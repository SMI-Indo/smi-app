"use server";

import { getServerSession } from "next-auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyByEmail } from "@/lib/email";
import { rupiah } from "@/lib/merchandise";

const checkoutInput = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().regex(/^(?:\+62|08)\d{8,13}$/),
  notes: z.string().trim().max(1000),
  items: z.array(z.object({ id: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(30),
});

export async function checkout(input: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user.email) return { error: "Masuk untuk melakukan pemesanan." };
  const parsed = checkoutInput.safeParse(input);
  if (!parsed.success) return { error: "Periksa nama, WhatsApp, dan isi keranjang." };
  const { items, ...contact } = parsed.data;
  if (new Set(items.map((item) => item.id)).size !== items.length) return { error: "Keranjang berisi varian ganda." };
  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, email: true } });
    if (!user) return { error: "Akun tidak ditemukan." };
    const order = await prisma.$transaction(async (tx) => {
      const lines = [];
      for (const item of [...items].sort((a, b) => a.id.localeCompare(b.id))) {
        const variant = await tx.merchandiseVariant.findUnique({ where: { id: item.id } });
        if (!variant?.active || variant.stock < item.quantity) return null;
        lines.push({ variantId: variant.id, label: variant.name + " · " + variant.size, price: variant.price, quantity: item.quantity });
      }
      for (const line of lines) {
        const changed = await tx.merchandiseVariant.updateMany({
          where: { id: line.variantId, active: true, stock: { gte: line.quantity }, price: line.price },
          data: { stock: { decrement: line.quantity } },
        });
        if (changed.count !== 1) throw new Error("CATALOG_CHANGED");
      }
      const total = lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
      return tx.merchandiseOrder.create({ data: { ...contact, userId: user.id, total, items: { create: lines } } });
    });
    if (!order) return { error: "Stok berubah. Muat ulang katalog dan periksa keranjang." };
    await notifyByEmail(user.email, "order", "Konfirmasi pesanan merchandise SMI", [
      "Kode pesanan: " + order.id, "Total: " + rupiah(order.total), "Pengurus akan menghubungi Anda untuk konfirmasi pembayaran.",
    ]);
    revalidatePath("/merchandise");
    revalidatePath("/merchandise/pesanan");
    return { code: order.id };
  } catch {
    return { error: "Pesanan tidak tersimpan. Periksa stok dan coba lagi." };
  }
}
