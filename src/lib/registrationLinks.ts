export function registrationOrigin() {
  const hostname = process.env.REGISTRATION_HOST?.trim().toLowerCase();
  return hostname && /^daftar\.(?:[a-z0-9-]+\.)+[a-z0-9-]+$/.test(hostname)
    ? "https://" + hostname
    : undefined;
}

export function registrationHref(slug: string, origin?: string) {
  const path = "/" + encodeURIComponent(slug);
  return origin ? origin + path : "/daftar" + path;
}
