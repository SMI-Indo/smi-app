import { describe, expect, it } from "vitest";
import { readAnswers, remainingSlots, type RegistrationField } from "./registrationFields";

describe("registration settings", () => {
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
