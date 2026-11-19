import { createHmac, timingSafeEqual } from "node:crypto";

export function participantViewCode(eventId: string, slug: string) {
  const secret = process.env.REGISTRATION_VIEW_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(JSON.stringify(["participant-view-v1", eventId, slug]))
    .digest("base64url").slice(0, 22);
}

export function matchesParticipantViewCode(input: string, expected: string | null) {
  const code = input.trim();
  return Boolean(expected && /^[A-Za-z0-9_-]{22}$/.test(code) &&
    timingSafeEqual(Buffer.from(code), Buffer.from(expected)));
}

export function maskParticipantName(name: string) {
  return name.trim().split(/\s+/u).filter(Boolean).map((part) => Array.from(part)[0] + ".").join(" ");
}
