export function previewSessionCookie(environment = process.env.VERCEL_ENV) {
  if (environment !== "preview") return undefined;

  return {
    name: "__Secure-smi-preview.session-token",
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: true,
    },
  };
}
