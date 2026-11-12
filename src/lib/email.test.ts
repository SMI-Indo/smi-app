import { afterEach, expect, it, vi } from "vitest";
import { notifyByEmail } from "./email";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("skips transport and avoids logging recipients when credentials are absent", async () => {
  vi.stubEnv("RESEND_API_KEY", "");
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  expect(await notifyByEmail("private@example.org", "violation", "Peringatan", ["Rincian pribadi"])).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(JSON.stringify(warn.mock.calls)).not.toMatch(/private@example\.org|Rincian pribadi/);
});

it("escapes dynamic content in HTML email", async () => {
  vi.stubEnv("RESEND_API_KEY", "test-token");
  vi.stubEnv("EMAIL_FROM", "smi@example.org");
  const fetchMock = vi.fn(async (_url: string, options: RequestInit) => {
    expect(JSON.parse(String(options.body)).html).toContain("&lt;Acara &amp; SMI&gt;");
    return new Response(null, { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  expect(await notifyByEmail("member@example.org", "registration", "Pendaftaran", ["<Acara & SMI>"])).toBe(true);
  expect(fetchMock).toHaveBeenCalledOnce();
});
