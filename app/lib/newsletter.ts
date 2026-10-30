// Newsletter sending via Resend broadcasts (contacts + segments + broadcasts).
//
// DOMAIN SPLIT — the one rule that matters here. Transactional mail (audit
// ready, purchase recovery, client updates) sends from EMAIL_FROM on the root
// domain. Bulk sending earns spam complaints no matter how good the list is,
// and a burned root domain means paying clients stop getting their reports. So
// broadcasts send from NEWSLETTER_FROM on a separate subdomain (news.6signal.co)
// with its own DKIM/SPF and its own reputation. assertDomainSplit() warns loudly
// if the two ever collapse onto one domain.
//
// Best-effort like every outbound call in this codebase, with one exception:
// send() surfaces its error, because a silent failure to send a newsletter is
// worse than a visible one.

const API = "https://api.resend.com";

export const SEGMENT_NAME = "6 Signal — Intelligence Brief";

function key(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

function domainOf(from: string): string {
  const m = from.match(/<([^>]+)>/);
  return (m ? m[1] : from).split("@")[1]?.toLowerCase() ?? "";
}

export function newsletterFrom(): string {
  return process.env.NEWSLETTER_FROM?.trim() || "6 Signal <brief@news.6signal.co>";
}

// Returns a warning string when marketing and transactional share a domain.
export function assertDomainSplit(): string | null {
  const marketing = domainOf(newsletterFrom());
  const transactional = domainOf(process.env.EMAIL_FROM?.trim() || "hello@6signal.co");
  if (!marketing || !transactional) return null;
  if (marketing === transactional) {
    return `NEWSLETTER_FROM and EMAIL_FROM both send from ${marketing}. A spam complaint on a broadcast will hit transactional delivery for paying clients. Verify a separate subdomain in Resend and point NEWSLETTER_FROM at it.`;
  }
  return null;
}

async function call<T>(
  path: string,
  init: { method: string; body?: unknown }
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const k = key();
  if (!k) return { ok: false, error: "RESEND_API_KEY not set" };
  try {
    const res = await fetch(`${API}${path}`, {
      method: init.method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${k}` },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      cache: "no-store",
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 300)}` };
    return { ok: true, data: (text ? JSON.parse(text) : {}) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Segments ─────────────────────────────────────────────────────────────────

interface Segment { id: string; name: string }

export async function listSegments(): Promise<Segment[]> {
  const r = await call<{ data?: Segment[] }>("/segments", { method: "GET" });
  if (!r.ok) {
    console.error("[newsletter] listSegments:", r.error);
    return [];
  }
  return r.data.data ?? [];
}

// The segment broadcasts go to. Pinned by RESEND_SEGMENT_ID when set, otherwise
// found (or created) by name so first run needs no manual dashboard step.
export async function resolveSegmentId(): Promise<string | null> {
  const pinned = process.env.RESEND_SEGMENT_ID?.trim();
  if (pinned) return pinned;

  const existing = (await listSegments()).find((s) => s.name === SEGMENT_NAME);
  if (existing) return existing.id;

  const created = await call<Segment>("/segments", {
    method: "POST",
    body: { name: SEGMENT_NAME },
  });
  if (!created.ok) {
    console.error("[newsletter] create segment:", created.error);
    return null;
  }
  return created.data.id;
}

// ── Contacts ─────────────────────────────────────────────────────────────────

// Contacts are global to the Resend account; segments group them. Creating a
// contact that already exists returns a conflict, so fall back to a PATCH by
// email — that also re-attaches the segment for someone who signed up again.
export async function upsertContact(args: {
  email: string;
  firstName?: string | null;
  segmentId: string;
  properties?: Record<string, string>;
}): Promise<boolean> {
  const body = {
    email: args.email,
    ...(args.firstName ? { first_name: args.firstName } : {}),
    unsubscribed: false,
    segments: [{ id: args.segmentId }],
    ...(args.properties ? { properties: args.properties } : {}),
  };

  const created = await call<{ id: string }>("/contacts", { method: "POST", body });
  if (created.ok) return true;

  if (/\b409\b|already exists|conflict/i.test(created.error)) {
    const patched = await call<{ id: string }>(`/contacts/${encodeURIComponent(args.email)}`, {
      method: "PATCH",
      body: {
        ...(args.firstName ? { first_name: args.firstName } : {}),
        segments: [{ id: args.segmentId }],
        ...(args.properties ? { properties: args.properties } : {}),
      },
    });
    if (patched.ok) return true;
    console.error("[newsletter] patch contact:", patched.error);
    return false;
  }

  console.error("[newsletter] create contact:", created.error);
  return false;
}

// ── Broadcasts ───────────────────────────────────────────────────────────────

// Resend only sends broadcasts it was asked to create via the API, so create
// and send are two calls. scheduledAt accepts ISO 8601 or natural language
// ("in 1 hour"); omitting it sends immediately.
export async function sendBroadcast(args: {
  segmentId: string;
  subject: string;
  html: string;
  text?: string;
  name?: string;
  replyTo?: string;
  scheduledAt?: string | null;
}): Promise<{ ok: true; broadcastId: string } | { ok: false; error: string }> {
  const created = await call<{ id: string }>("/broadcasts", {
    method: "POST",
    body: {
      segment_id: args.segmentId,
      from: newsletterFrom(),
      subject: args.subject,
      ...(args.replyTo ? { reply_to: args.replyTo } : {}),
      html: args.html,
      ...(args.text ? { text: args.text } : {}),
      ...(args.name ? { name: args.name } : {}),
    },
  });
  if (!created.ok) return { ok: false, error: created.error };

  const sent = await call<{ id: string }>(`/broadcasts/${created.data.id}/send`, {
    method: "POST",
    body: args.scheduledAt ? { scheduled_at: args.scheduledAt } : {},
  });
  if (!sent.ok) return { ok: false, error: sent.error };

  return { ok: true, broadcastId: created.data.id };
}

export async function getBroadcast(id: string): Promise<Record<string, unknown> | null> {
  const r = await call<Record<string, unknown>>(`/broadcasts/${id}`, { method: "GET" });
  if (!r.ok) {
    console.error("[newsletter] getBroadcast:", r.error);
    return null;
  }
  return r.data;
}

// ── Signup hook ──────────────────────────────────────────────────────────────

// Mirror of pushToKit: called after the lead is already in Supabase, so a
// Resend failure is logged and never reaches the visitor.
export async function pushToResend(args: { email: string; firstName?: string | null; source?: string }): Promise<void> {
  if (!key()) return;
  const segmentId = await resolveSegmentId();
  if (!segmentId) return;
  await upsertContact({
    email: args.email,
    firstName: args.firstName ?? null,
    segmentId,
    ...(args.source ? { properties: { source: args.source } } : {}),
  });
}
