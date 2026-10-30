// Markdown -> inline-styled email HTML for newsletter issues.
//
// Issues are authored as plain markdown so the same source renders twice: here
// for the email (tables + inline styles, because mail clients ignore <style>),
// and through MDXRemote for the public archive at /briefings. That means no
// custom syntax — a paragraph containing nothing but a link becomes the CTA
// button, which degrades to an ordinary link on the web.

const ACCENT = "#E6FF00";
const INK = "#f5f5f3";
const BODY_INK = "#b8b8b5";
const MUTED = "#555553";
const GROUND = "#060606";
const SANS = "Arial,Helvetica,sans-serif";
const MONO = "'Courier New',monospace";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Only allow schemes that are safe in an email client.
function safeHref(url: string): string {
  const u = url.trim();
  if (/^(https?:\/\/|mailto:|\{\{\{)/i.test(u)) return esc(u);
  return "#";
}

function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, `<code style="font-family:${MONO};font-size:13px;color:${INK};">$1</code>`)
    .replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${INK};font-weight:600;">$1</strong>`)
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_m, text: string, href: string) =>
        `<a href="${safeHref(href)}" style="color:${ACCENT};text-decoration:underline;">${text}</a>`
    );
}

const row = (inner: string, pad = "0 0 18px") => `<tr><td style="padding:${pad};">${inner}</td></tr>`;

function block(md: string): string {
  const lines = md.split("\n");
  const first = lines[0] ?? "";

  if (/^---+$/.test(first.trim())) {
    return row(`<div style="height:1px;background:rgba(255,255,255,0.12);"></div>`, "10px 0 28px");
  }

  if (first.startsWith("### ")) {
    return row(
      `<h3 style="font-family:${SANS};font-weight:600;font-size:16px;line-height:1.3;color:${INK};margin:0;">${inline(first.slice(4))}</h3>`,
      "8px 0 12px"
    );
  }
  if (first.startsWith("## ")) {
    return row(
      `<h2 style="font-family:${SANS};font-weight:600;font-size:19px;line-height:1.25;color:${INK};margin:0;">${inline(first.slice(3))}</h2>`,
      "14px 0 14px"
    );
  }
  if (first.startsWith("# ")) {
    return row(
      `<h1 style="font-family:${SANS};font-weight:600;font-size:24px;line-height:1.2;color:${INK};margin:0;">${inline(first.slice(2))}</h1>`,
      "0 0 20px"
    );
  }

  if (first.startsWith("> ")) {
    const quote = lines.map((l) => l.replace(/^>\s?/, "")).join(" ");
    return row(
      `<div style="border-left:2px solid ${ACCENT};padding:2px 0 2px 16px;">
        <p style="font-family:${SANS};font-size:15px;line-height:1.6;color:${INK};margin:0;font-style:italic;">${inline(quote)}</p>
      </div>`,
      "6px 0 24px"
    );
  }

  if (/^[-*]\s+/.test(first) || /^\d+\.\s+/.test(first)) {
    const ordered = /^\d+\.\s+/.test(first);
    const items = lines
      .filter((l) => l.trim())
      .map((l, i) => {
        const text = l.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");
        const marker = ordered ? `${i + 1}.` : "—";
        return `<tr>
          <td style="padding:0 10px 9px 0;vertical-align:top;font-family:${MONO};font-size:13px;color:${ACCENT};">${marker}</td>
          <td style="padding:0 0 9px;font-family:${SANS};font-size:15px;line-height:1.6;color:${BODY_INK};">${inline(text)}</td>
        </tr>`;
      })
      .join("");
    return row(`<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${items}</table>`, "2px 0 20px");
  }

  const joined = lines.join(" ").trim();

  // A paragraph that is nothing but one link becomes the CTA button.
  const onlyLink = joined.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (onlyLink) {
    return row(
      `<a href="${safeHref(onlyLink[2])}" style="display:inline-block;background:${ACCENT};color:${GROUND};font-family:${SANS};font-size:14px;font-weight:600;text-decoration:none;padding:16px 28px;border-radius:2px;">${esc(onlyLink[1])} &rarr;</a>`,
      "8px 0 26px"
    );
  }

  return row(`<p style="font-family:${SANS};font-size:15px;line-height:1.65;color:${BODY_INK};margin:0;">${inline(joined)}</p>`);
}

export function renderBriefingBody(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map(block)
    .join("");
}

// The full email. `unsubscribeUrl` is Resend's merge tag in a real broadcast;
// a test send passes a plain link so the preview is clickable and harmless.
export function renderBriefingEmail(args: {
  subject: string;
  body: string;
  preview?: string | null;
  issueUrl?: string | null;
  unsubscribeUrl?: string;
}): string {
  const unsub = args.unsubscribeUrl ?? "{{{RESEND_UNSUBSCRIBE_URL}}}";
  const preheader = args.preview?.trim()
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(args.preview)}</div>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${GROUND};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GROUND};">
<tr><td align="center" style="padding:48px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="padding-bottom:32px;">
  <span style="font-family:${MONO};font-size:11px;letter-spacing:0.24em;color:${ACCENT};">6 SIGNAL</span>
  <span style="font-family:${MONO};font-size:11px;letter-spacing:0.18em;color:${MUTED};"> · INTELLIGENCE BRIEF</span>
</td></tr>
${renderBriefingBody(args.body)}
<tr><td style="padding-top:40px;border-top:1px solid rgba(255,255,255,0.1);">
  <p style="font-family:${MONO};font-size:11px;line-height:1.7;color:${MUTED};margin:24px 0 0;">
    6 Signal · AI visibility for contractors · Dallas–Fort Worth<br/>
    <a href="https://6signal.co" style="color:${MUTED};">6signal.co</a> · <a href="mailto:hello@6signal.co" style="color:${MUTED};">hello@6signal.co</a>${
      args.issueUrl ? ` · <a href="${safeHref(args.issueUrl)}" style="color:${MUTED};">Read online</a>` : ""
    }<br/>
    <a href="${unsub}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// Plain-text alternative. Mail clients that prefer text get something readable,
// and having one measurably helps deliverability on a new sending domain.
export function renderBriefingText(markdown: string, unsubscribeUrl?: string): string {
  const text = markdown
    .replace(/\r\n/g, "\n")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*]\s+/gm, "— ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1: $2")
    .replace(/^---+$/gm, "----------")
    .trim();

  return `${text}\n\n—\n6 Signal · 6signal.co · hello@6signal.co\nUnsubscribe: ${unsubscribeUrl ?? "{{{RESEND_UNSUBSCRIBE_URL}}}"}\n`;
}
