"use client";

import type { Event } from "@prisma/client";
import Link from "next/link";
import { registrationAvailability, registrationStatusLabel } from "@/lib/registrationFields";
import { registrationHref } from "@/lib/registrationLinks";
import { useServerClock } from "./useServerClock";

type RegistrationEvent = Pick<Event, "id" | "title" | "date" | "time" | "location" | "status" | "registrationSlug" | "registrationDeadline" | "capacity"> & {
  _count: { registrations: number };
};

export function RegistrationList({ events, origin, serverNow }: { events: RegistrationEvent[]; origin?: string; serverNow: number }) {
  const now = new Date(useServerClock(serverNow));
  return <ul className="space-y-3">{events.map((event) => {
    const deadline = event.registrationDeadline && new Date(event.registrationDeadline);
    const state = registrationAvailability(event.status, deadline, event.capacity, event._count.registrations, now);
    return <li key={event.id} className="border rounded-lg p-4">
      {event.registrationSlug && <Link className="underline font-bold" href={registrationHref(event.registrationSlug, origin)}>{event.title}</Link>}
      <p className="flex flex-wrap gap-x-3">
        <span>{new Date(event.date).toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" })}</span>
        <span>{event.time}</span>
        <span>{event.location}</span>
      </p>
      <p>{registrationStatusLabel[state]}</p>
      {deadline && <p>Batas daftar {deadline.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })} WIB</p>}
    </li>;
  })}</ul>;
}
