import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
    render(<EventScheduler initialEvents={[event]} />);
    fireEvent.click(screen.getByRole("button", { name: "Workshop" }));
    expect(screen.getByRole("heading", { name: "Workshop" })).toBeInTheDocument();
    expect(screen.queryByText("TAMPILKAN JADWAL LAINNYA")).not.toBeInTheDocument();
  });
});
