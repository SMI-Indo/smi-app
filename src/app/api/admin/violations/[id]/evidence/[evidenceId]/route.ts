import { checkAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { readEvidence } from "@/lib/violationEvidence";

const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" };
export async function GET(_: Request, { params }: { params: Promise<{ id: string; evidenceId: string }> }) {
  if (!await checkAdminSession()) return new Response("Akses khusus pengurus.", { status: 403, headers: privateHeaders });
  if (process.env.ENABLE_VIOLATION_EVIDENCE !== "true") return new Response("Bukti tidak tersedia.", { status: 404, headers: privateHeaders });
  try {
    const { id, evidenceId } = await params;
    const evidence = await prisma.violationEvidence.findFirst({ where: { id: evidenceId, violationId: id } });
    if (!evidence) return new Response("Bukti tidak ditemukan.", { status: 404, headers: privateHeaders });
    const response = await readEvidence(evidence.storagePath);
    if (!response.ok) throw new Error("Storage unavailable");
    return new Response(response.body, { headers: { ...privateHeaders, "Content-Type": evidence.contentType, "Content-Disposition": "inline" } });
  } catch {
    return new Response("Bukti belum dapat dibuka. Coba lagi.", { status: 503, headers: privateHeaders });
  }
}
