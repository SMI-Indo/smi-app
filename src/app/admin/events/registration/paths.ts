export function adminRegistrationHref(id: string, slug: string | null) {
  return "/admin/events/registration/" + encodeURIComponent(slug ?? "~" + id);
}

export function suggestRegistrationSlug(title: string) {
  return title.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/g, "");
}
