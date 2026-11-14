import { File } from "node:buffer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { validateEvidenceFiles, uploadEvidence, retryEvidenceCleanup } from "./violationEvidence";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const journal = vi.hoisted(() => ({ create: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn(), references: vi.fn() }));
vi.mock("./prisma", () => ({ prisma: { evidenceCleanup: journal, violationEvidence: { findMany: journal.references } } }));
beforeEach(() => { vi.clearAllMocks(); journal.references.mockResolvedValue([]); });
const png = () => new File([new Uint8Array([137,80,78,71,13,10,26,10,0])], "proof.png", { type: "image/png" });
it("accepts a PNG by signature", async () => { expect(await validateEvidenceFiles([png()])).toMatchObject([{ contentType: "image/png", extension: "png" }]); });
it("rejects disguised content", async () => { await expect(validateEvidenceFiles([new File(["<svg/>"], "proof.png", { type: "image/png" })])).rejects.toThrow("PNG"); });
it("rejects too many screenshots", async () => { await expect(validateEvidenceFiles([png(),png(),png(),png()])).rejects.toThrow("3"); });
it("rejects oversized images", async () => { await expect(validateEvidenceFiles([new File([new Uint8Array(1024*1024+1)], "large.png")])).rejects.toThrow("1 MB"); });
it("does not upload when secure storage is unconfigured", async () => {
 vi.stubEnv("SUPABASE_URL", ""); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
 const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
 await expect(uploadEvidence(await validateEvidenceFiles([png()]))).rejects.toThrow("Penyimpanan bukti");
 expect(fetcher).not.toHaveBeenCalled();
});
it("refuses uploads to a public bucket", async () => {
 vi.stubEnv("SUPABASE_URL", "https://preview.supabase.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
 const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ public: true }), { status: 200 })); vi.stubGlobal("fetch", fetcher);
 await expect(uploadEvidence(await validateEvidenceFiles([png()]))).rejects.toThrow("privat");
 expect(fetcher).toHaveBeenCalledTimes(1);
});

it("journals an attempted upload before a response can time out", async () => {
 vi.stubEnv("SUPABASE_URL", "https://preview.supabase.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
 journal.create.mockResolvedValue({});
 const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ public: false }))).mockRejectedValueOnce(new Error("timeout")); vi.stubGlobal("fetch", fetcher);
 await expect(uploadEvidence(await validateEvidenceFiles([png()]))).rejects.toThrow("timeout");
 const attemptedPath = fetcher.mock.calls[1][0].split("/violation-evidence/")[1];
 expect(journal.create).toHaveBeenCalledWith({ data: { storagePath: attemptedPath, notBefore: expect.any(Date) } });
});

it("retains failed cleanup work for a later retry", async () => {
 vi.stubEnv("SUPABASE_URL", "https://preview.supabase.co"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
 journal.findMany.mockResolvedValue([{ storagePath: "orphan/key.png" }]);
 vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })));
 await expect(retryEvidenceCleanup()).rejects.toThrow("Pembersihan");
 expect(journal.deleteMany).not.toHaveBeenCalled();
});
it("never cleans an image that became attached to a committed violation", async () => {
 journal.findMany.mockResolvedValue([{ storagePath: "retained/key.png" }]);
 journal.references.mockResolvedValue([{ storagePath: "retained/key.png" }]);
 const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
 expect(await retryEvidenceCleanup()).toBe(1);
 expect(fetcher).not.toHaveBeenCalled();
 expect(journal.deleteMany).toHaveBeenCalled();
});
