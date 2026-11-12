export const violationStatus: Record<string, string> = {
  OPEN: "Perlu perhatian", IN_PROGRESS: "Sedang ditindaklanjuti", RESOLVED: "Selesai",
};
export const severityLabels: Record<string, { label: string; color: string }> = {
  RINGAN: { label: "Ringan", color: "bg-yellow-100 text-yellow-950" },
  SEDANG: { label: "Sedang", color: "bg-orange-100 text-orange-950" },
  BERAT: { label: "Berat", color: "bg-red-100 text-red-950" },
};
