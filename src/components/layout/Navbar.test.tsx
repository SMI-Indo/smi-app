import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { getNavigationRelease } from "@/lib/featureFlags";
import { Navbar } from "./Navbar";

const { pathname, session } = vi.hoisted(() => ({ pathname: vi.fn(), session: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: pathname }));
vi.mock("next-auth/react", () => ({ useSession: session, signOut: vi.fn() }));

afterEach(() => vi.unstubAllEnvs());

it("keeps Beta independent of readiness on both production menus", () => {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("NAV_COMING_SOON", "merchandise, unknown, membership");
  vi.stubEnv("ENABLE_LITURGY_QUIZ", "false");
  pathname.mockReturnValue("/event");
  session.mockReturnValue({ data: { user: { id: "member-1", email: "member@example.test" } } });

  render(<Navbar release={getNavigationRelease()} />);
  expect(screen.getByText("Beta")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Menu navigasi" }));

  const menus = screen.getAllByRole("navigation");
  expect(menus).toHaveLength(2);
  for (const menu of menus) {
    const nav = within(menu);
    expect(nav.getByRole("link", { name: "Jadwal" })).toHaveAttribute("aria-current", "page");
    expect(nav.getByRole("link", { name: "Koin" })).toHaveAttribute("href", "/coin");
    expect(nav.getByText("Merchandise")).toBeInTheDocument();
    expect(nav.queryByRole("link", { name: "Merchandise" })).not.toBeInTheDocument();
    expect(nav.getAllByText("Coming soon")).toHaveLength(2);
    expect(nav.queryByText("Kuis")).not.toBeInTheDocument();
  }

  fireEvent.click(screen.getByRole("button", { name: "Menu profil" }));
  expect(screen.queryByRole("link", { name: "Digital ID" })).not.toBeInTheDocument();
});

it("keeps protected member links out of the guest menu", () => {
  pathname.mockReturnValue("/");
  session.mockReturnValue({ data: null });
  render(<Navbar release={{ showBeta: true, showQuiz: false, comingSoon: [] }} />);
  expect(screen.getByRole("link", { name: "Jadwal" })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Koin" })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Digital ID" })).not.toBeInTheDocument();
});
