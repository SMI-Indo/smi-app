import { describe, expect, it } from "vitest";
import { readAnswers, registrationWindowOpen, remainingSlots, type RegistrationField } from "./registrationFields";

describe("registration settings", () => {
  it("closes exactly at the configured deadline across time zones", () => {
    const deadline = new Date("2026-11-30T20:00:00+07:00");
    expect(registrationWindowOpen("UPCOMING", deadline, new Date(deadline.getTime() - 1))).toBe(true);
    expect(registrationWindowOpen("UPCOMING", deadline, new Date("2026-11-30T21:00:00+08:00"))).toBe(false);
    expect(registrationWindowOpen("UPCOMING", deadline, new Date("2026-11-30T22:00:01+09:00"))).toBe(false);
    expect(registrationWindowOpen("UPCOMING", null)).toBe(false);
  });
  it("distinguishes unlimited, available, and exhausted capacity", () => {
    expect(remainingSlots(null, 500)).toBeNull();
    expect(remainingSlots(5, 3)).toBe(2);
    expect(remainingSlots(5, 7)).toBe(0);
  });

  it("validates required URLs and persists only configured answers with their labels", () => {
    const fields: RegistrationField[] = [{ id: "drive", label: "Google Drive", type: "url", required: true }];
    const form = new FormData();
    expect(readAnswers(fields, form)).toHaveProperty("error");
    form.set("field-drive", "javascript:alert(1)");
    expect(readAnswers(fields, form)).toHaveProperty("error");
    form.set("field-drive", "https://drive.google.com/example");
    form.set("field-unknown", "extra");
    expect(readAnswers(fields, form)).toEqual({
      answers: [{ id: "drive", label: "Google Drive", type: "url", value: "https://drive.google.com/example" }],
    });
  });
});
