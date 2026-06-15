// Transactional email via Resend. Best-effort: if RESEND_API_KEY is missing
// or the send fails, we log and move on — email must never break the funnel.

const FROM_FALLBACK = "6 Signal <onboarding@resend.dev>";

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
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
        ...(args.replyTo ? { reply_to: args.replyTo } : {}),
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

// "Your report is ready" — sent when a paid brief or strategy finishes
// generating. Carries a summary plus the permanent view/download link.
// Best-effort like every send: failures are logged, never thrown.
export async function sendReportReadyEmail(args: {
  to: string;
  kind: "brief" | "strategy";
  businessName: string;
  link: string;
  score?: number | null;
  grade?: string | null;
  critical?: string | null;
}): Promise<boolean> {
  const name = args.businessName || "your business";
  const inner =
    args.kind === "brief"
      ? [
          monoLabel("AI Visibility Brief · Complete"),
          heading(
            Number.isFinite(args.score as number)
              ? `${name}: ${args.score}/100${args.grade ? ` · Grade ${args.grade}` : ""}`
              : `Your brief is ready, ${name}.`
          ),
          args.critical ? paragraph(`<strong style="color:#f5f5f3;">${args.critical}</strong>`) : "",
          paragraph(
            "Your full intelligence brief — all six signals, buyer journey, citation landscape, content gaps, and your 90-day roadmap — is saved at the link below. Open it on any device or download the PDF for your records."
          ),
          button("View my brief", args.link),
          paragraph(
            `Questions, or want to go deeper? Reply to this email or write <a href="mailto:hello@6signal.co" style="color:#E6FF00;">hello@6signal.co</a>.`
          ),
        ].join("")
      : [
          monoLabel("Full Strategy Brief · Complete"),
          heading(`Your 90-day strategy is ready, ${name}.`),
          paragraph(
            "Signal-by-signal action plans, content architecture with page specs and H1s, copy-paste schema, review mechanics, and a week-by-week 90-day calendar — all built from your brief and saved at the link below."
          ),
          button("Open my strategy brief", args.link),
          paragraph(
            `Want us to walk it through live or implement it with you? Reply to this email or write <a href="mailto:hello@6signal.co" style="color:#E6FF00;">hello@6signal.co</a>.`
          ),
        ].join("");

  const subject =
    args.kind === "brief"
      ? `Your 6 Signal brief is ready — ${name}`
      : `Your 6 Signal strategy brief is ready — ${name}`;

  return sendEmail({ to: args.to, subject, html: emailShell(inner) });
}

// Internal lead alert — sent to the owner whenever someone runs a free check,
// with everything the prospect submitted. reply_to is the lead so the owner can
// reply straight to them.
export async function sendLeadAlertEmail(args: {
  to: string;
  name: string;
  trade: string;
  city: string;
  email: string;
  found?: boolean;
  aiResponse?: string | null;
  signals?: { signal: string; finding: string }[];
}): Promise<boolean> {
  const fieldRow = (label: string, value: string) =>
    `<tr><td style="padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
      <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.18em;color:#7a7a78;text-transform:uppercase;display:inline-block;width:96px;vertical-align:top;">${label}</span>
      <span style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#f5f5f3;">${value}</span>
    </td></tr>`;

  const signals = args.signals ?? [];
  const signalsHtml = signals.length
    ? `<tr><td style="padding-top:20px;">
        <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;color:#7a7a78;text-transform:uppercase;">Signal gaps flagged</span>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
        ${signals
          .map(
            (s) => `<tr><td style="padding:6px 0;">
          <span style="font-family:'Courier New',monospace;font-size:12px;color:#E6FF00;display:inline-block;width:46px;vertical-align:top;">${s.signal}</span>
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#b8b8b5;">${s.finding}</span>
        </td></tr>`
          )
          .join("")}
        </table>
      </td></tr>`
    : "";

  const inner = [
    monoLabel("New free check · lead"),
    heading(args.name),
    `<tr><td style="padding-bottom:8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${fieldRow("Trade", args.trade)}
        ${fieldRow("Market", args.city)}
        ${fieldRow("Email", `<a href="mailto:${args.email}" style="color:#E6FF00;">${args.email}</a>`)}
        ${fieldRow("AI status", args.found ? "Named in AI answer" : "Not named in AI answer")}
      </table>
    </td></tr>`,
    args.aiResponse
      ? paragraph(`<em style="color:#9a9a97;">Projected AI answer they saw:</em><br/>${args.aiResponse}`)
      : "",
    signalsHtml,
    paragraph(`Just reply to this email to reach ${args.name} directly.`),
  ].join("");

  return sendEmail({
    to: args.to,
    replyTo: args.email,
    subject: `New free check — ${args.name} (${args.trade}, ${args.city})`,
    html: emailShell(inner),
  });
}
