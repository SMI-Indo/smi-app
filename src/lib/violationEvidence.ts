import { prisma } from "./prisma";
import { randomUUID } from "node:crypto";

export const evidenceLimit = 3;
export const evidenceMaxBytes = 1024 * 1024;
export const evidenceBucket = "violation-evidence";
type EvidenceFile = { name: string; size: number; arrayBuffer(): Promise<ArrayBuffer> };
type ValidatedImage = { bytes: Uint8Array; fileName: string; contentType: string; extension: string; size: number };
export type StoredEvidence = { storagePath: string; fileName: string; contentType: string; size: number };
export class EvidenceError extends Error {}

export async function validateEvidenceFiles(files: EvidenceFile[]): Promise<ValidatedImage[]> {
  if (files.length > evidenceLimit) throw new EvidenceError("Maksimal 3 screenshot per catatan.");
  const images: ValidatedImage[] = [];
  for (const file of files) {
    if (!file.size || file.size > evidenceMaxBytes) throw new EvidenceError("Setiap bukti harus berukuran 1 byte hingga 1 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    let contentType = "", extension = "";
    if ([137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value)) { contentType = "image/png"; extension = "png"; }
    else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) { contentType = "image/jpeg"; extension = "jpg"; }
    else if (Buffer.from(bytes.subarray(0,4)).toString() === "RIFF" && Buffer.from(bytes.subarray(8,12)).toString() === "WEBP") { contentType = "image/webp"; extension = "webp"; }
    if (!contentType) throw new EvidenceError("Gunakan gambar PNG, JPEG, atau WebP yang valid.");
    images.push({ bytes, fileName: file.name.replace(/[\x00-\x1f\x7f]/g, "").slice(0,150) || "Bukti", contentType, extension, size: bytes.length });
  }
  return images;
}

function storageConfig() {
  const raw = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw || !key) throw new EvidenceError("Penyimpanan bukti belum dikonfigurasi. Hubungi pengelola aplikasi.");
  const url = new URL(raw);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".supabase.co") || url.username || url.password) {
    throw new EvidenceError("Penyimpanan bukti belum dikonfigurasi dengan benar.");
  }
  return { origin: url.origin, headers: { Authorization: `Bearer ${key}`, apikey: key } };
}

export async function removeEvidence(paths: string[], clearJournal = true) {
  if (!paths.length) return;
  const references = await prisma.violationEvidence.findMany({ where: { storagePath: { in: paths } }, select: { storagePath: true } });
  const retained = new Set(references.map((item) => item.storagePath));
  const removable = paths.filter((path) => !retained.has(path));
  if (!removable.length) {
    if (clearJournal) await prisma.evidenceCleanup.deleteMany({ where: { storagePath: { in: paths } } });
    return;
  }
  const { origin, headers } = storageConfig();
  const response = await fetch(`${origin}/storage/v1/object/${evidenceBucket}`, {
    method: "DELETE", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: removable }), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new EvidenceError("Pembersihan bukti belum berhasil.");
  if (clearJournal) await prisma.evidenceCleanup.deleteMany({ where: { storagePath: { in: paths } } });
}

export async function uploadEvidence(images: ValidatedImage[]): Promise<StoredEvidence[]> {
  if (!images.length) return [];
  const { origin, headers } = storageConfig();
  const bucket = await fetch(`${origin}/storage/v1/bucket/${evidenceBucket}`, { headers, cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!bucket.ok || (await bucket.json()).public !== false) throw new EvidenceError("Bukti wajib disimpan pada bucket privat yang sudah disiapkan.");
  const uploaded: StoredEvidence[] = [];
  try {
    for (const image of images) {
      const storagePath = `${randomUUID()}/${randomUUID()}.${image.extension}`;
      // Journal before the write: a timed-out response does not prove storage rejected it.
      await prisma.evidenceCleanup.create({ data: { storagePath, notBefore: new Date(Date.now() + 60 * 60 * 1000) } });
      const response = await fetch(`${origin}/storage/v1/object/${evidenceBucket}/${storagePath}`, {
        method: "POST", headers: { ...headers, "Content-Type": image.contentType, "x-upsert": "false" },
        body: Buffer.from(image.bytes), signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new EvidenceError("Bukti gagal diunggah. Formulir belum disimpan; coba lagi.");
      uploaded.push({ storagePath, fileName: image.fileName, contentType: image.contentType, size: image.size });
    }
    return uploaded;
  } catch (error) {
    await removeEvidence(uploaded.map((image) => image.storagePath), false).catch(() => console.warn("[evidence] Cleanup needs retry"));
    throw error;
  }
}

export async function readEvidence(storagePath: string) {
  const { origin, headers } = storageConfig();
  // Paths originate from server-generated metadata, never request query parameters.
  return fetch(`${origin}/storage/v1/object/authenticated/${evidenceBucket}/${storagePath.split("/").map(encodeURIComponent).join("/")}`, {
    headers, cache: "no-store", signal: AbortSignal.timeout(15000),
  });
}

export async function evidenceSchemaReady() {
  const [tables] = await prisma.$queryRaw<{ evidence: string | null; cleanup: string | null }[]>`
    SELECT to_regclass('public."ViolationEvidence"')::text AS evidence,
           to_regclass('public."EvidenceCleanup"')::text AS cleanup`;
  if (tables.evidence && !tables.cleanup) throw new EvidenceError("Migrasi pembersihan bukti belum lengkap. Penghapusan ditunda.");
  return Boolean(tables.evidence && tables.cleanup);
}

export async function retryEvidenceCleanup() {
  const pending = await prisma.evidenceCleanup.findMany({ where: { notBefore: { lte: new Date() } }, orderBy: { notBefore: "asc" }, take: 100 });
  await removeEvidence(pending.map((item) => item.storagePath));
  return pending.length;
}
