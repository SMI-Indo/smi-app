import { z } from "zod";

export const registrationFieldLimit = 15;

const field = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
  label: z.string().trim().min(1).max(100),
  type: z.enum(["text", "textarea", "url"]),
  required: z.boolean(),
});

export const fieldsSchema = z.array(field).max(registrationFieldLimit).refine(
  (fields) => new Set(fields.map(({ id }) => id)).size === fields.length,
);

export type RegistrationField = z.infer<typeof field>;

export function isWebLink(value: string) {
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function readAnswers(fields: RegistrationField[], form: FormData) {
  const answers = [];
  for (const { id, label, type, required } of fields) {
    const raw = form.get("field-" + id);
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value && !required) continue;
    if (!value) return { error: `Isi kolom “${label}”.` } as const;
    if (value.length > (type === "text" ? 300 : 2000)) {
      return { error: `Jawaban “${label}” terlalu panjang.` } as const;
    }
    if (type === "url" && !isWebLink(value)) {
      return { error: `Gunakan tautan http atau https yang valid untuk “${label}”.` } as const;
    }
    answers.push({ id, label, type, value });
  }
  return { answers };
}

export const answersSchema = z.array(field.omit({ required: true }).extend({
  value: z.string(),
}));

export function remainingSlots(capacity: number | null, registered: number) {
  return capacity === null ? null : Math.max(0, capacity - registered);
}

const minuteMs = 60_000;
const wibOffsetMs = 7 * 60 * minuteMs;

export function wibDateTimeInput(date: Date) {
  return new Date(date.getTime() + wibOffsetMs).toISOString().slice(0, 16);
}

export function wibDateInput(date: Date) {
  return wibDateTimeInput(date).slice(0, 10);
}

export function parseWibDeadline(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(value + ":00+07:00");
  return Number.isFinite(date.getTime()) && wibDateTimeInput(date) === value ? date : null;
}

export function parseWibDate(value: string) {
  return parseWibDeadline(value + "T00:00");
}

export function registrationClosesAt(deadline: Date) {
  return new Date((Math.floor(deadline.getTime() / minuteMs) + 1) * minuteMs);
}

export function earliestOpenDeadline(now: Date) {
  return new Date(Math.floor(now.getTime() / minuteMs) * minuteMs);
}

export function registrationDeadlineFitsEvent(deadline: Date, eventDate: Date) {
  return wibDateInput(deadline) <= wibDateInput(eventDate);
}

export function registrationWindowOpen(status: string, deadline: Date | null, now = new Date()) {
  return status === "UPCOMING" && deadline !== null && registrationClosesAt(deadline) > now;
}
