import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventScheduler } from "./EventScheduler";
import type { Event } from "@prisma/client";

describe("jadwal acara", () => {
  it("memungkinkan penyaringan workshop dan tidak menampilkan tombol palsu", () => {
    const event: Event = {
      registrationSlug: null, registrationDeadline: null, capacity: null,
      registrationTerms: null, registrationCategories: [], registrationFields: [],
      id: "event-1", title: "Workshop", description: null, category: "WORKSHOP",
      date: new Date("2027-01-01"), time: "10:00", location: "Online",
      status: "UPCOMING", createdAt: new Date(), updatedAt: new Date(),
    };
    render(<EventScheduler initialEvents={[{ ...event, _count: { registrations: 0 } }]} serverNow={0} />);
    fireEvent.click(screen.getByRole("button", { name: "Workshop" }));
    expect(screen.getByRole("heading", { name: "Workshop" })).toBeInTheDocument();
    expect(screen.queryByText("TAMPILKAN JADWAL LAINNYA")).not.toBeInTheDocument();
  });

  const deadline = new Date("2026-11-30T23:59:00+07:00");
  const event = {
    id: "event-2", title: "Temu SMI", description: null, category: "TEMU_ONLINE" as const,
    date: deadline, time: "19:00", location: "Online", status: "UPCOMING" as const,
    registrationSlug: "temu", registrationDeadline: deadline, capacity: 1,
    registrationTerms: null, registrationCategories: [], registrationFields: [],
    createdAt: deadline, updatedAt: deadline,
  };

  it("shows a details link for a full event without an open registration action", () => {
    render(<EventScheduler initialEvents={[{ ...event, _count: { registrations: 1 } }]} serverNow={+deadline} />);
    expect(screen.getByText("Kuota penuh")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lihat detail pendaftaran" })).toHaveAttribute("href", "/daftar/temu");
    expect(screen.queryByRole("link", { name: "Daftar" })).not.toBeInTheDocument();
  });

  it("updates an open tab after the server deadline passes", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
    try {
      render(<EventScheduler initialEvents={[{ ...event, capacity: null, _count: { registrations: 2 } }]} serverNow={+deadline + 59_000} />);
      expect(screen.getByRole("link", { name: "Daftar" })).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByText("Pendaftaran ditutup")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Lihat detail pendaftaran" })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
