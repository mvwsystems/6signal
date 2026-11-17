// Pure inbox logic (C5): reading a Gmail message, finding the new text in a
// reply, guessing the reply's intent, and building a reply draft. No network.

export interface GmailHeader { name: string; value: string }
export interface GmailPart { mimeType?: string; filename?: string; headers?: GmailHeader[]; body?: { data?: string; size?: number }; parts?: GmailPart[] }
export interface GmailMessage { id: string; threadId: string; labelIds?: string[]; snippet?: string; internalDate?: string; payload?: GmailPart }

export interface ParsedMessage {
  gmail_message_id: string; gmail_thread_id: string; from_email: string | null; from_name: string | null;
  to_emails: string[]; subject: string | null; body_text: string; sent_at: string; message_id_header: string | null; references: string | null;
  labels: string[]; snippet: string;
}

const b64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
const header = (p: GmailPart | undefined, name: string) => p?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? null;

// "Jim Bob <jim@acme.com>" → { name: "Jim Bob", email: "jim@acme.com" }
export function parseAddress(v: string | null): { name: string | null; email: string | null } {
  if (!v) return { name: null, email: null };
  const m = v.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || null, email: m[2].trim().toLowerCase() };
  const e = v.match(/[^\s<>,;"]+@[^\s<>,;"]+/);
  return { name: null, email: e ? e[0].toLowerCase() : null };
}
export function parseAddressList(v: string | null): string[] {
  if (!v) return [];
  return Array.from(new Set((v.match(/[^\s<>,;"]+@[^\s<>,;"]+/g) ?? []).map((x) => x.toLowerCase())));
}

function htmlToText(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|tr|h\d)>/gi, "\n").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n").trim();
}

function findBody(p: GmailPart | undefined): { text: string | null; html: string | null } {
  if (!p) return { text: null, html: null };
  if (p.filename) return { text: null, html: null }; // attachments are skipped
  if (p.mimeType === "text/plain" && p.body?.data) return { text: b64url(p.body.data), html: null };
  if (p.mimeType === "text/html" && p.body?.data) return { text: null, html: b64url(p.body.data) };
  let text: string | null = null, html: string | null = null;
  for (const c of p.parts ?? []) {
    const r = findBody(c);
    text ??= r.text; html ??= r.html;
  }
  return { text, html };
}

export function parseMessage(m: GmailMessage): ParsedMessage {
  const p = m.payload;
  const from = parseAddress(header(p, "From"));
  const body = findBody(p);
  const date = m.internalDate ? new Date(Number(m.internalDate)) : header(p, "Date") ? new Date(header(p, "Date")!) : new Date();
  return {
    gmail_message_id: m.id, gmail_thread_id: m.threadId, from_email: from.email, from_name: from.name,
    to_emails: [...parseAddressList(header(p, "To")), ...parseAddressList(header(p, "Cc"))],
    subject: header(p, "Subject"), body_text: (body.text ?? (body.html ? htmlToText(body.html) : m.snippet ?? "")).replace(/\r\n/g, "\n").trim().slice(0, 50000),
    sent_at: (Number.isNaN(date.getTime()) ? new Date() : date).toISOString(),
    message_id_header: header(p, "Message-ID") ?? header(p, "Message-Id"), references: header(p, "References"),
    labels: m.labelIds ?? [], snippet: m.snippet ?? "",
  };
}

// The new part of a reply: everything above the quoted earlier mail.
export function newText(body: string): string {
  const lines = body.split("\n");
  const out: string[] = [];
  for (const l of lines) {
    if (/^\s*>/.test(l)) break;
    if (/^On .{4,200}(wrote|écrit|schrieb):\s*$/i.test(l.trim())) break;
    if (/^-{2,}\s*Original Message\s*-{2,}/i.test(l.trim())) break;
    if (/^From:\s.+/i.test(l.trim()) && out.length) break;
    if (/^_{8,}$/.test(l.trim())) break;
    out.push(l);
  }
  return out.join("\n").trim();
}

export const INTENTS = ["interested", "question", "objection", "not_now", "stop", "other"] as const;
export type Intent = (typeof INTENTS)[number];

// A suggestion only; anyone can change it on the thread. Stop wins over
// everything, because sending to someone who asked to stop is the costly mistake.
export function guessIntent(body: string): Intent {
  const t = ` ${newText(body).toLowerCase().replace(/\s+/g, " ")} `;
  if (/\b(unsubscribe|remove me|take me off|stop (emailing|contacting|sending)|do not (email|contact)|don't (email|contact)|not interested|no thanks|no thank you|please stop|opt out|leave me alone)\b/.test(t)) return "stop";
  if (/\b(not (right )?now|maybe later|next (quarter|year|month)|check back|reach out (again )?(in|later)|circle back|busy season|bad time|not a (good )?time)\b/.test(t)) return "not_now";
  if (/\b(interested|let'?s (talk|chat|set|schedule|connect)|sounds good|happy to (talk|chat)|book|schedule|calendar|call me|give me a call|send (me )?(more|info|details|pricing)|yes[,.! ]|sure[,.! ]|when are you (free|available))\b/.test(t)) return "interested";
  if (/\b(too expensive|no budget|already (have|use|work with)|we'?re (good|set|covered)|not a fit|don'?t need|we handle (it|that) in.?house)\b/.test(t)) return "objection";
  if (/\?/.test(t) || /\b(how much|what does|how does|who are you|what is)\b/.test(t)) return "question";
  return "other";
}

// A reply draft as raw MIME for Gmail's drafts API, threaded under the
// message it answers.
export function buildReplyMime(r: { from: string; to: string; subject: string; body: string; inReplyTo?: string | null; references?: string | null }): string {
  const subject = /^re:/i.test(r.subject) ? r.subject : `Re: ${r.subject}`;
  const encSubject = /[^\x20-\x7e]/.test(subject) ? `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=` : subject;
  const headers = [
    `From: ${r.from}`, `To: ${r.to}`, `Subject: ${encSubject}`,
    ...(r.inReplyTo ? [`In-Reply-To: ${r.inReplyTo}`, `References: ${[r.references, r.inReplyTo].filter(Boolean).join(" ")}`] : []),
    "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64",
  ];
  const body = Buffer.from(r.body, "utf8").toString("base64").replace(/.{76}/g, "$&\r\n");
  return Buffer.from(`${headers.join("\r\n")}\r\n\r\n${body}`, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// A company name for a prospect made from an unmatched sender.
export function companyGuess(email: string | null, name: string | null): string {
  const domain = email?.split("@")[1] ?? "";
  const free = /^(gmail|yahoo|hotmail|outlook|aol|icloud|me|live|msn|comcast|att|sbcglobal|proton|protonmail)\./i.test(domain);
  if (domain && !free) {
    const base = domain.replace(/^www\./, "").split(".").slice(0, -1).join(" ").replace(/[-_]/g, " ");
    return base.replace(/\b\w/g, (c) => c.toUpperCase()) || domain;
  }
  return name || email || "Unknown sender";
}
