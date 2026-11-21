export const cancelledViolationStatus = "CANCELLED";
export const violationSeverities = ["RINGAN", "SEDANG", "BERAT"] as const;

export function countViolationPoints(records: readonly { status: string; points: number }[]) {
  return records.reduce((total, record) => record.status === cancelledViolationStatus ? total : total + record.points, 0);
}

export const violationStatus: Record<string, string> = {
  OPEN: "Perlu perhatian", IN_PROGRESS: "Sedang ditindaklanjuti", RESOLVED: "Selesai", CANCELLED: "Dibatalkan",
};
export function isActiveViolation(status: string) {
  return status === "OPEN" || status === "IN_PROGRESS";
}
export const severityLabels: Record<string, { label: string; color: string }> = {
  RINGAN: { label: "Ringan", color: "bg-yellow-100 text-yellow-950" },
  SEDANG: { label: "Sedang", color: "bg-orange-100 text-orange-950" },
  BERAT: { label: "Berat", color: "bg-red-100 text-red-950" },
};
