import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import HomePage from "./page";

vi.mock("@/lib/prisma", () => ({
  prisma: { event: { findMany: vi.fn().mockResolvedValue([]) }, video: { findFirst: vi.fn().mockResolvedValue(null) } },
}));

afterEach(() => vi.unstubAllEnvs());

it("only promotes quiz coins when the feature is enabled and ready", async () => {
  vi.stubEnv("ENABLE_LITURGY_QUIZ", "false");
  vi.stubEnv("NAV_COMING_SOON", "");
  const page = render(await HomePage());
  expect(screen.getByText(/Selesaikan misi/)).toBeInTheDocument();
  expect(screen.queryByText(/koin dari Kuis Liturgi/)).not.toBeInTheDocument();

  vi.stubEnv("ENABLE_LITURGY_QUIZ", "true");
  page.rerender(await HomePage());
  expect(screen.getByText(/koin dari Kuis Liturgi/)).toBeInTheDocument();

  vi.stubEnv("NAV_COMING_SOON", "quiz,video");
  page.rerender(await HomePage());
  expect(screen.queryByText(/koin dari Kuis Liturgi/)).not.toBeInTheDocument();
  expect(screen.queryByText("Video Unggulan")).not.toBeInTheDocument();
});
