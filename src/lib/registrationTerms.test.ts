import { expect, it } from "vitest";
import { splitRegistrationTerms } from "./registrationTerms";

it("keeps existing instructions and exposes only safe standalone links", () => {
  const result = splitRegistrationTerms([
    "Bawa kartu anggota.",
    "Panduan teknis | https://example.org/panduan",
    "https://example.org/jadwal",
    "Tautan | javascript:alert(1)",
    "https://user:secret@example.org",
  ].join("\n"));
  expect(result.links).toEqual([
    { label: "Panduan teknis", url: "https://example.org/panduan" },
    { label: "Buka dokumen example.org", url: "https://example.org/jadwal" },
  ]);
  expect(result.text).toBe("Bawa kartu anggota.\nTautan | javascript:alert(1)\nhttps://user:secret@example.org");
});
