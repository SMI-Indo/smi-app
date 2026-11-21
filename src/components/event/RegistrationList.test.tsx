import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { RegistrationList } from "./RegistrationList";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("keeps the details link but updates the open label after the deadline", () => {
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  const deadline = new Date("2026-11-30T23:59:00+07:00");

  render(<RegistrationList serverNow={+deadline + 59_000} events={[{
    id: "event-1", title: "Lomba Natal", status: "UPCOMING", date: deadline, time: "20:00", location: "Online",
    registrationSlug: "lombanatal", registrationDeadline: deadline, capacity: null, _count: { registrations: 1 },
  }]} />);

  expect(screen.getByText("Pendaftaran dibuka")).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.getByText("Pendaftaran ditutup")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Lomba Natal" })).toHaveAttribute("href", "/daftar/lombanatal");
});

it("corrects a stale server-rendered time when the index becomes interactive", async () => {
  const deadline = new Date("2026-11-30T23:59:00+07:00");
  const fetchTime = vi.fn().mockResolvedValue(Response.json({ now: +deadline + 60_000 }));
  vi.stubGlobal("fetch", fetchTime);

  render(<RegistrationList serverNow={+deadline} events={[{
    id: "event-1", title: "Lomba Natal", status: "UPCOMING", date: deadline, time: "20:00", location: "Online",
    registrationSlug: "lombanatal", registrationDeadline: deadline, capacity: 4, _count: { registrations: 1 },
  }]} />);

  expect(await screen.findByText("Pendaftaran ditutup")).toBeInTheDocument();
  expect(fetchTime).toHaveBeenCalledWith("/api/time", expect.objectContaining({ cache: "no-store" }));
});
