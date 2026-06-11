// Transactional email via Resend. Best-effort: if RESEND_API_KEY is missing
// or the send fails, we log and move on — email must never break the funnel.

const FROM_FALLBACK = "6 Signal <onboarding@resend.dev>";

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", args.to);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || FROM_FALLBACK,
        to: [args.to],
        subject: args.subject,
        html: args.html,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend error:", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send failed:", e);
    return false;
  }
}

// Shared shell in brand style: #060606 ground, #E6FF00 accent, mono labels.
export function emailShell(inner: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#060606;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#060606;">
<tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="padding-bottom:32px;">
  <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.24em;color:#E6FF00;">6 SIGNAL</span>
</td></tr>
${inner}
<tr><td style="padding-top:40px;border-top:1px solid rgba(255,255,255,0.1);">
  <p style="font-family:'Courier New',monospace;font-size:11px;color:#555553;margin:24px 0 0;">
    6 Signal · AI visibility for contractors · Dallas–Fort Worth<br/>
    <a href="https://6signal.co" style="color:#555553;">6signal.co</a> · <a href="mailto:hello@6signal.co" style="color:#555553;">hello@6signal.co</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export function paragraph(text: string): string {
  return `<tr><td style="padding-bottom:18px;">
  <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#b8b8b5;margin:0;">${text}</p>
</td></tr>`;
}

export function heading(text: string): string {
  return `<tr><td style="padding-bottom:20px;">
  <h1 style="font-family:Arial,Helvetica,sans-serif;font-weight:600;font-size:24px;line-height:1.2;color:#f5f5f3;margin:0;">${text}</h1>
</td></tr>`;
}

export function button(label: string, href: string): string {
  return `<tr><td style="padding:10px 0 24px;">
  <a href="${href}" style="display:inline-block;background:#E6FF00;color:#060606;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;text-decoration:none;padding:16px 28px;border-radius:2px;">${label} &rarr;</a>
</td></tr>`;
}

export function monoLabel(text: string): string {
  return `<tr><td style="padding-bottom:10px;">
  <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;color:#7a7a78;text-transform:uppercase;">${text}</span>
</td></tr>`;
}
