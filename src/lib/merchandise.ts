export const rupiah = (amount: number) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0,
}).format(amount);

export const orderLabels: Record<string, string> = {
  PENDING: "Menunggu konfirmasi", PROCESSING: "Diproses", DONE: "Selesai", CANCELLED: "Dibatalkan",
};
