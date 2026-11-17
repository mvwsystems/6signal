// Pure sequence logic (C4): the template variables, rendering with fallbacks,
// who can be enrolled, and when each step comes due. No database here.

import { firstNameFrom, isEmail } from "./campaignCore";

// Variables a step may use. Each accepts a fallback after a bar:
// {{firstName|there}}. The C3 names (first_name, company, city) work too.
export const SEQ_VARS = ["firstName", "contactName", "companyName", "city", "state", "category", "senderName", "bookingLink"] as const;
export type SeqVar = (typeof SEQ_VARS)[number];
const ALIASES: Record<string, SeqVar> = {
  firstname: "firstName", first_name: "firstName", contactname: "contactName", contact_name: "contactName",
  companyname: "companyName", company: "companyName", company_name: "companyName", city: "city", state: "state",
  category: "category", sendername: "senderName", sender_name: "senderName", bookinglink: "bookingLink", booking_link: "bookingLink",
};
export type SeqData = Partial<Record<SeqVar, string | null>>;

const VAR_RE = /\{\{\s*([A-Za-z_]+)\s*(?:\|([^}]*))?\}\}/g;
const canon = (name: string): SeqVar | null => ALIASES[name.toLowerCase()] ?? null;

export function varsIn(text: string): { name: string; v: SeqVar | null; fallback: string | null }[] {
  return Array.from(text.matchAll(VAR_RE)).map((m) => ({ name: m[1], v: canon(m[1]), fallback: m[2] !== undefined && m[2].trim() !== "" ? m[2].trim() : null }));
}
export const unknownVars = (text: string) => Array.from(new Set(varsIn(text).filter((x) => !x.v && x.name.toLowerCase() !== "unsubscribe_url").map((x) => x.name)));

export function renderSeq(text: string, d: SeqData): string {
  return text.replace(VAR_RE, (m, name: string, fb?: string) => {
    const v = canon(name);
    if (!v) return m;
    const val = d[v];
    if (val && String(val).trim()) return String(val).trim();
    return fb !== undefined ? fb.trim() : "";
  });
}

// Variables with no fallback that this prospect can't fill.
export function missingFor(text: string, d: SeqData): SeqVar[] {
  return Array.from(new Set(varsIn(text).filter((x) => x.v && !x.fallback && !(d[x.v!] && String(d[x.v!]).trim())).map((x) => x.v!)));
}

export interface ProspectLike {
  id: string; company: string; contact_name: string | null; email: string | null; city: string | null; state: string | null;
  category: string | null; status: string; email_invalid_at?: string | null;
}
export function dataFor(p: ProspectLike, extra: { firstName?: string | null; senderName: string; bookingLink: string }): SeqData {
  return {
    firstName: extra.firstName ?? firstNameFrom(p.contact_name), contactName: p.contact_name, companyName: p.company,
    city: p.city, state: p.state, category: p.category, senderName: extra.senderName, bookingLink: extra.bookingLink || null,
  };
}

// Statuses that stop a sequence (the always-on stop rules).
export const REPLY_STATUSES = ["Replied", "Interested", "Not now"];
export const STOP_STATUSES = ["Customer", "Dead", "Closed"];

export type Eligibility = { ok: true } | { ok: false; reason: string };
export function canEnroll(p: ProspectLike, steps: { subject: string; body: string }[], d: SeqData, alreadyLive: boolean): Eligibility {
  if (p.status === "Do Not Contact") return { ok: false, reason: "Do Not Contact" };
  if (p.email_invalid_at) return { ok: false, reason: "email bounced" };
  if (!isEmail(p.email)) return { ok: false, reason: "no valid email" };
  if (REPLY_STATUSES.includes(p.status)) return { ok: false, reason: `status is ${p.status}` };
  if (STOP_STATUSES.includes(p.status)) return { ok: false, reason: `status is ${p.status}` };
  if (alreadyLive) return { ok: false, reason: "already in this sequence" };
  const missing = Array.from(new Set(steps.flatMap((s) => missingFor(`${s.subject}\n${s.body}`, d))));
  if (missing.length) return { ok: false, reason: `no ${missing.join(", ")} (add a fallback like {{${missing[0]}|there}})` };
  return { ok: true };
}

// Step N is due enrolledAt + its day offset. Day 0 is due at enrollment.
export function dueAt(enrolledAt: Date, dayOffset: number): Date {
  return new Date(enrolledAt.getTime() + dayOffset * 86400000);
}

// Checks a sequence's steps before it can be activated or saved.
export function stepProblems(steps: { step_number: number; day_offset: number; subject: string; body: string }[]): string[] {
  const out: string[] = [];
  if (!steps.length) out.push("A sequence needs at least one step.");
  const sorted = [...steps].sort((a, b) => a.step_number - b.step_number);
  sorted.forEach((s, i) => {
    if (!s.subject.trim()) out.push(`Step ${s.step_number} has no subject.`);
    if (!s.body.trim()) out.push(`Step ${s.step_number} has no body.`);
    const unknown = unknownVars(`${s.subject}\n${s.body}`);
    if (unknown.length) out.push(`Step ${s.step_number} uses unknown ${unknown.map((u) => `{{${u}}}`).join(", ")}.`);
    if (i > 0 && s.day_offset <= sorted[i - 1].day_offset) out.push(`Step ${s.step_number} must come on a later day than step ${sorted[i - 1].step_number}.`);
  });
  if (sorted[0] && sorted[0].day_offset !== 0) out.push("Step 1 should be day 0.");
  return out;
}
