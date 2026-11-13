import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

describe("login continuation", () => {
  it.each([
    ["ADMIN", "/admin/events", "/admin/events"],
    ["ADMIN", "//outside.test", "/admin"],
    ["ADMIN", "/login/continue", "/admin"],
    ["MEMBER", "/admin/events", "/membership"],
    ["MEMBER", "/video", "/video"],
  ])("routes %s with callback %s to %s", async (role, callback, destination) => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "test", role } });
    const url = new URL("https://preview.test/login/continue");
    url.searchParams.set("callbackUrl", callback);
    const response = await GET(new NextRequest(url));
    expect(response.headers.get("location")).toBe("https://preview.test" + destination);
  });

  it("returns to login when no application session exists", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const response = await GET(new NextRequest("https://preview.test/login/continue"));
    expect(response.headers.get("location")).toBe("https://preview.test/login");
  });
});
