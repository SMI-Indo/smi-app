import { AdminViolationsClient } from "@/components/admin/AdminViolationsClient";

export default function AdminPelanggaranPage() {
  return <AdminViolationsClient evidenceEnabled={process.env.ENABLE_VIOLATION_EVIDENCE === "true"} />;
}
