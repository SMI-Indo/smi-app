"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { checkAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { notifyByEmail } from "@/lib/email";
import { orderLabels } from "@/lib/merchandise";

const productInput = z.object({
  id: z.string(),
  name: z.string().trim().min(2).max(120),
  category: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(1000),
  imageUrl: z.string().url().refine((value) => value.startsWith("https://")),
  size: z.string().trim().min(1).max(60),
  price: z.coerce.number().int().min(1).max(3000000),
  stock: z.coerce.number().int().min(0).max(100000),
  active: z.string().optional().transform((value) => value === "on"),
});

export async function saveVariant(_: string, form: FormData) {
  if (!await checkAdminSession()) return "Akses khusus pengurus.";
  const result = productInput.safeParse(Object.fromEntries(form));
  if (!result.success) return "Periksa nama, kategori, gambar HTTPS, ukuran, harga, dan stok.";
  const { id, ...data } = result.data;
  try {
    if (id) await prisma.merchandiseVariant.update({ where: { id }, data });
    else await prisma.merchandiseVariant.create({ data });
    revalidatePath("/admin/merchandise");
    revalidatePath("/merchandise");
    return "Varian disimpan.";
  } catch {
    return "Varian gagal disimpan.";
  }
}

const transitions: Record<string, string[]> = {
  PENDING: ["PROCESSING", "CANCELLED"], PROCESSING: ["DONE", "CANCELLED"],
};
export async function updateOrder(_: string, form: FormData) {
  if (!await checkAdminSession()) return "Akses khusus pengurus.";
  const id = form.get("id");
  const status = form.get("status");
  if (typeof id !== "string" || typeof status !== "string") return "Pesanan tidak valid.";
  try {
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.merchandiseOrder.findUnique({ where: { id }, include: { items: true, user: { select: { email: true } } } });
      if (!current || !transitions[current.status]?.includes(status)) return null;
      const updated = await tx.merchandiseOrder.updateMany({ where: { id, status: current.status }, data: { status } });
      if (!updated.count) return null;
      if (status === "CANCELLED") {
        for (const item of [...current.items].sort((a, b) => a.variantId.localeCompare(b.variantId))) {
          await tx.merchandiseVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        }
      }
      return current;
    });
    if (!order) return "Perubahan status tidak tersedia. Muat ulang halaman.";
    await notifyByEmail(order.user.email, "order", "Status pesanan merchandise SMI", ["Kode pesanan: " + id, orderLabels[status]]);
    revalidatePath("/admin/merchandise");
    revalidatePath("/merchandise");
    revalidatePath("/merchandise/pesanan");
    return "Status diperbarui.";
  } catch {
    return "Status gagal diperbarui.";
  }
}
