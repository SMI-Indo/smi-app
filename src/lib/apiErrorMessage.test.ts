import { expect, it } from "vitest";
import { apiErrorMessage, readApiError } from "./apiErrorMessage";

it("reads both the old error string and the error string with a stable code", () => {
  expect(apiErrorMessage({ error: "Coba lagi" }, "Gagal")).toBe("Coba lagi");
  expect(apiErrorMessage({ error: "Masuk kembali", code: "UNAUTHENTICATED" }, "Gagal")).toBe("Masuk kembali");
});

it("uses the operation fallback for non-JSON and unexpected error responses", async () => {
  expect(await readApiError(new Response("Bad gateway", { status: 502 }), "Gagal menyimpan")).toBe("Gagal menyimpan");
  expect(apiErrorMessage({ error: { message: "invalid" } }, "Gagal")).toBe("Gagal");
});
