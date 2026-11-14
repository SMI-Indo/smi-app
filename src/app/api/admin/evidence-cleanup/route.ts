import { checkAdminSession } from "@/lib/adminAuth";
import { evidenceSchemaReady, retryEvidenceCleanup } from "@/lib/violationEvidence";
export async function POST() {
  if (!await checkAdminSession()) return Response.json({ error: "Akses khusus pengurus." }, { status: 403 });
  try {
    if (!await evidenceSchemaReady()) return Response.json({ error: "Penyimpanan bukti belum disiapkan." }, { status: 503 });
    return Response.json({ processed: await retryEvidenceCleanup() });
  } catch {
    return Response.json({ error: "Pembersihan belum selesai. Antrean disimpan untuk dicoba kembali." }, { status: 503 });
  }
}
