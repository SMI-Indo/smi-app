export function apiErrorMessage(body: unknown, fallback: string) {
  if (typeof body !== "object" || body === null || !("error" in body)) return fallback;
  return typeof body.error === "string" && body.error.trim() ? body.error : fallback;
}

export async function readApiError(response: Response, fallback: string) {
  return apiErrorMessage(await response.json().catch(() => null), fallback);
}

export function readApiBody(response: Response) {
  return response.ok ? response.json() : response.json().catch(() => null);
}
