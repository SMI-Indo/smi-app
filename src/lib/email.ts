const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export async function notifyByEmail(to: string, kind: "registration" | "violation" | "order" | "participant", subject: string, lines: string[]) {
  const token = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!token || !from) {
    console.warn("[email] Configuration missing", { kind });
    return false;
  }
  const escape = (value: string) => value.replace(/[&<>"']/g, (character) => entities[character]);
  const html = '<main style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px"><p>Sahabat Misdinar Indonesia</p><h1>' +
    escape(subject) + "</h1>" + lines.map((line) => "<p>" + escape(line) + "</p>").join("") + "</main>";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, text: lines.join("\n") }),
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) return true;
    console.warn("[email] Provider rejected notification", { kind, status: response.status });
  } catch {
    console.warn("[email] Transport unavailable", { kind });
  }
  return false;
}
