import { NextResponse } from "next/server";

const codes: Record<number, string> = {
  400: "INVALID_INPUT",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  500: "INTERNAL_ERROR",
};

export function apiError(status: number, error: string, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json({ error, code: codes[status], ...(fieldErrors && { fieldErrors }) }, { status });
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

export function hasDatabaseErrorCode(error: unknown, code: string) {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
