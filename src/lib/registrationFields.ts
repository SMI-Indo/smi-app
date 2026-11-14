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
