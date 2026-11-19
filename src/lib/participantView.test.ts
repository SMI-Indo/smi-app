import { afterEach, expect, it, vi } from "vitest";
import { maskParticipantName, matchesParticipantViewCode, participantViewCode } from "./participantView";

afterEach(() => vi.unstubAllEnvs());

it("scopes access codes to the event and slug", () => {
  vi.stubEnv("REGISTRATION_VIEW_SECRET", "test-secret");
  const code = participantViewCode("event-1", "video-natal")!;
  expect(matchesParticipantViewCode(" " + code + " ", code)).toBe(true);
  expect(matchesParticipantViewCode(code, participantViewCode("event-2", "video-natal"))).toBe(false);
  expect(matchesParticipantViewCode(code, participantViewCode("event-1", "new-slug"))).toBe(false);
  expect(matchesParticipantViewCode("123456", code)).toBe(false);
});

it("returns initials without sharing the participant's name", () => {
  expect(maskParticipantName("  Maria   Elisabeth ")).toBe("M. E.");
});
