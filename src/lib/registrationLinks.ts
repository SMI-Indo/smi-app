const slugSyntax = "[a-z0-9]+(?:-[a-z0-9]+)*";
const reservedSlugs = ["admin", "api", "coin", "daftar", "event", "login", "membership", "merchandise", "panduan-liturgis", "quiz", "video"];
export const registrationSlugPattern = new RegExp(`^${slugSyntax}$`);
export const vanityRegistrationSource = `/:slug((?!(?:${reservedSlugs.join("|")})(?:/|$)|daftar-)${slugSyntax})`;

export function isVanityRegistrationSlug(slug: string) {
  return registrationSlugPattern.test(slug) && !reservedSlugs.includes(slug) && !slug.startsWith("daftar-");
}

export function registrationOrigin() {
  const hostname = process.env.REGISTRATION_HOST?.trim().toLowerCase();
  return hostname && /^daftar\.(?:[a-z0-9-]+\.)+[a-z0-9-]+$/.test(hostname)
    ? "https://" + hostname
    : undefined;
}

export function registrationHref(slug: string, origin?: string) {
  const path = "/" + encodeURIComponent(slug);
  return origin && isVanityRegistrationSlug(slug) ? origin + path : (origin ?? "") + "/daftar" + path;
}
