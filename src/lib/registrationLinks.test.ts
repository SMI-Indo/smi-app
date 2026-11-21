import { getRewrittenUrl, unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import nextConfig from "../../next.config";
import { isVanityRegistrationSlug, registrationHref } from "./registrationLinks";

const primary = "https://smi.example.test";
const registration = "https://daftar.example.test";

beforeEach(() => vi.stubEnv("REGISTRATION_HOST", "daftar.example.test"));
afterEach(() => vi.unstubAllEnvs());

async function rewrite(origin: string, path: string) {
  const url = origin + path;
  const response = await unstable_getResponseFromNextConfig({
    url, nextConfig, headers: { host: new URL(origin).host },
  });
  return getRewrittenUrl(response);
}

it.each([primary, registration])("gives the short alias priority on %s", async (origin) => {
  expect(await rewrite(origin, "/daftar-temu")).toBe(origin + "/daftar/temu");
  expect(await rewrite(origin, "/daftar/temu/peserta")).toBeNull();
});

it("only gives the dedicated host its registration shortcuts", async () => {
  expect(await rewrite(registration, "/")).toBe(registration + "/daftar");
  expect(await rewrite(registration, "/temu")).toBe(registration + "/daftar/temu");
  expect(await rewrite(primary, "/temu")).toBeNull();
  expect(await rewrite("https://daftar.other.test", "/temu")).toBeNull();
});

it("preserves canonical links for legacy reserved slugs", async () => {
  expect(isVanityRegistrationSlug("temu-2026")).toBe(true);
  expect(isVanityRegistrationSlug("event")).toBe(false);
  expect(isVanityRegistrationSlug("daftar-temu")).toBe(false);
  expect(registrationHref("event", registration)).toBe(registration + "/daftar/event");
  expect(registrationHref("temu", registration)).toBe(registration + "/temu");
  expect(await rewrite(registration, "/event")).toBeNull();
});
