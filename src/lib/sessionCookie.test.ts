import { describe, expect, it } from "vitest";
import { previewSessionCookie } from "./sessionCookie";

describe("Preview session isolation", () => {
  it("uses a distinct secure, host-only cookie in Vercel Preview", () => {
    expect(previewSessionCookie("preview")).toEqual({
      name: "__Secure-smi-preview.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    });
  });

  it.each(["production", "development"])("keeps NextAuth defaults in %s", (environment) => {
    expect(previewSessionCookie(environment)).toBeUndefined();
  });
});
