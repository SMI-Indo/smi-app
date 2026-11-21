import { describe, expect, it } from "vitest";
import { parseWibDeadline, readAnswers, registrationWindowOpen, remainingSlots, type RegistrationField } from "./registrationFields";

describe("registration settings", () => {
  it("accepts the entire configured WIB minute across time zones", () => {
    const deadline = new Date("2026-11-30T23:59:00+07:00");
    expect(registrationWindowOpen("UPCOMING", deadline, new Date("2026-11-30T23:59:59.999+07:00"))).toBe(true);
    expect(registrationWindowOpen("UPCOMING", deadline, new Date("2026-12-01T01:00:00+08:00"))).toBe(false);
    expect(registrationWindowOpen("UPCOMING", deadline, new Date("2026-12-01T02:00:00+09:00"))).toBe(false);
    expect(registrationWindowOpen("UPCOMING", null)).toBe(false);
  });
  it("rejects rolled-over dates and accepts a leap day in WIB", () => {
    expect(parseWibDeadline("2026-02-30T10:00")).toBeNull();
    expect(parseWibDeadline("2026-11-30T24:00")).toBeNull();
    expect(parseWibDeadline("2028-02-29T00:00")?.toISOString()).toBe("2028-02-28T17:00:00.000Z");
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
