import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GET } from "./route";
const deps = vi.hoisted(() => ({ admin: vi.fn(), find: vi.fn(), read: vi.fn() }));
vi.mock("@/lib/adminAuth", () => ({ checkAdminSession: deps.admin }));
vi.mock("@/lib/prisma", () => ({ prisma: { violationEvidence: { findFirst: deps.find } } }));
vi.mock("@/lib/violationEvidence", () => ({ readEvidence: deps.read }));
const params = { params: Promise.resolve({ id: "violation-1", evidenceId: "evidence-1" }) };
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("ENABLE_VIOLATION_EVIDENCE", "true"); deps.admin.mockResolvedValue({ user: { id: "admin" } }); });
afterEach(() => vi.unstubAllEnvs());
it("never reads storage for a non-admin", async () => { deps.admin.mockResolvedValue(null); expect((await GET(new Request("http://localhost"), params)).status).toBe(403); expect(deps.find).not.toHaveBeenCalled(); expect(deps.read).not.toHaveBeenCalled(); });
it("scopes evidence to its violation", async () => { deps.find.mockResolvedValue(null); expect((await GET(new Request("http://localhost"), params)).status).toBe(404); expect(deps.find).toHaveBeenCalledWith({ where: { id: "evidence-1", violationId: "violation-1" } }); expect(deps.read).not.toHaveBeenCalled(); });
it("returns private non-sniffable image content to an admin", async () => {
 deps.find.mockResolvedValue({ storagePath: "private/key.png", contentType: "image/png" }); deps.read.mockResolvedValue(new Response("image-bytes"));
 const response = await GET(new Request("http://localhost"), params);
 expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toContain("no-store"); expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff"); expect(await response.text()).toBe("image-bytes");
});
it("keeps the feature disabled until setup is complete", async () => { vi.stubEnv("ENABLE_VIOLATION_EVIDENCE", "false"); expect((await GET(new Request("http://localhost"), params)).status).toBe(404); expect(deps.find).not.toHaveBeenCalled(); });
