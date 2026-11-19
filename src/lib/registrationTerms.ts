import { isWebLink } from "./registrationFields";

export function splitRegistrationTerms(value: string) {
  const text: string[] = [];
  const links: { label: string; url: string }[] = [];
  for (const line of value.split(/\r?\n/)) {
    const trimmed = line.trim();
    const separator = trimmed.indexOf(" | ");
    const label = separator === -1 ? "" : trimmed.slice(0, separator).trim();
    const url = separator === -1 ? trimmed : trimmed.slice(separator + 3).trim();
    if (isWebLink(url)) {
      links.push({ label: label || "Buka dokumen " + new URL(url).hostname, url });
    } else {
      text.push(line);
    }
  }
  return { text: text.join("\n").trim(), links };
}
