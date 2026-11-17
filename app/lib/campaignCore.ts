// Pure campaign logic (C3): sender-profile checks, personalization, the
// signature and CAN-SPAM footer, trade matching, distance, and the pre-launch
// checklist. No database or network here, so every rule that can block a
// launch can be read and tested on its own.

// ─── Sender profile ─────────────────────────────────────────────────────────

export interface Signature { name: string; title: string; company: string; phone: string }
export interface SendingSettings { from_name: string; from_address: string; reply_to: string; signature: Signature }
export interface ComplianceSettings { mailing_address: string; booking_link: string }
export interface CampaignDefaults { daily_cap: number; pilot_min: number; pilot_max: number; send_window_from: string; send_window_to: string; send_days: number[] }

export const DEFAULT_SENDING: SendingSettings = {
  from_name: "Casey | 6 Signal", from_address: "", reply_to: "",
  signature: { name: "Casey", title: "6 Signal AI Coordinator", company: "6SIGNAL", phone: "(817) 623-6399" },
};
export const DEFAULT_COMPLIANCE: ComplianceSettings = { mailing_address: "", booking_link: "" };
export const DEFAULT_CAMPAIGN: CampaignDefaults = { daily_cap: 40, pilot_min: 5, pilot_max: 50, send_window_from: "09:00", send_window_to: "17:00", send_days: [1, 2, 3, 4, 5] };

// Placeholder text that must never reach a prospect.
const PLACEHOLDERS = [/your name/i, /your company/i, /your title/i, /lorem ipsum/i, /\[[^\]]*\]/, /\{\{[^}]*\}\}/, /\bxxx+\b/i, /\btbd\b/i, /example\.com/i, /john doe/i, /jane doe/i];

export const digits = (s: string) => s.replace(/\D/g, "");

// A 555 exchange (NXX = 555) is a fictional number: (xxx) 555-xxxx.
export function isFakePhone(phone: string): boolean {
  const d = digits(phone).replace(/^1(?=\d{10}$)/, "");
  if (d.length !== 10) return false;
  return d.slice(3, 6) === "555";
}

export function placeholderIn(s: string): string | null {
  for (const re of PLACEHOLDERS) { const m = s.match(re); if (m) return m[0]; }
  return null;
}

const EMAIL_RE = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[a-z]{2,}$/i;
export const isEmail = (s: string | null | undefined) => !!s && EMAIL_RE.test(s.trim());

// Problems that stop the profile being saved (and stop a launch).
export function sendingProblems(s: SendingSettings, opts: { forLaunch?: boolean } = {}): string[] {
  const out: string[] = [];
  const fields: [string, string][] = [
    ["From name", s.from_name], ["Signature name", s.signature.name], ["Signature title", s.signature.title],
    ["Signature company", s.signature.company], ["Signature phone", s.signature.phone],
  ];
  for (const [label, v] of fields) {
    if (!v?.trim()) { out.push(`${label} is blank.`); continue; }
    const ph = placeholderIn(v);
    if (ph) out.push(`${label} contains placeholder text ("${ph}").`);
  }
  if (s.signature.phone?.trim()) {
    if (isFakePhone(s.signature.phone)) out.push(`Signature phone ${s.signature.phone} is a 555 number, which isn't a real line.`);
    else if (digits(s.signature.phone).replace(/^1(?=\d{10}$)/, "").length !== 10) out.push(`Signature phone ${s.signature.phone} isn't a 10-digit US number.`);
  }
  if (s.from_address && !isEmail(s.from_address)) out.push("From address isn't a valid email address.");
  if (s.reply_to && !isEmail(s.reply_to)) out.push("Reply-to isn't a valid email address.");
  if (opts.forLaunch && !s.from_address) out.push("From address is blank.");
  return out;
}

// ─── Personalization ────────────────────────────────────────────────────────
// Tokens: {{first_name}}, {{company}}, {{city}}, each with an optional
// fallback after a bar: {{first_name|there}}.

export const TOKENS = ["first_name", "company", "city"] as const;
export type Token = (typeof TOKENS)[number];
export interface RecipientData { first_name: string | null; company: string | null; city: string | null }

const TOKEN_RE = /\{\{\s*([a-z_]+)\s*(?:\|([^}]*))?\}\}/gi;

export interface TokenUse { token: string; fallback: string | null }
export function tokensIn(text: string): TokenUse[] {
  const out: TokenUse[] = [];
  for (const m of text.matchAll(TOKEN_RE)) out.push({ token: m[1].toLowerCase(), fallback: m[2] !== undefined ? m[2].trim() : null });
  return out;
}

export function unknownTokens(text: string): string[] {
  return Array.from(new Set(tokensIn(text).map((t) => t.token).filter((t) => !(TOKENS as readonly string[]).includes(t))));
}

export function render(text: string, r: RecipientData): string {
  return text.replace(TOKEN_RE, (m, tok: string, fb?: string) => {
    if (!(TOKENS as readonly string[]).includes(tok.toLowerCase())) return m; // e.g. {{unsubscribe_url}}, filled later
    const v = (r as unknown as Record<string, string | null>)[tok.toLowerCase()];
    if (v && v.trim()) return v.trim();
    return fb !== undefined ? fb.trim() : "";
  });
}

// Tokens used without a fallback that this recipient can't fill.
export function unresolvedFor(text: string, r: RecipientData): string[] {
  return Array.from(new Set(tokensIn(text).filter((t) => t.fallback === null || t.fallback === "").filter((t) => {
    const v = (r as unknown as Record<string, string | null>)[t.token];
    return !(v && v.trim());
  }).map((t) => t.token)));
}

// "Dr. Jim  Bob Smith" → "Jim". Company-looking or empty names give null.
export function firstNameFrom(name: string | null | undefined): string | null {
  if (!name) return null;
  const cleaned = name.replace(/\(.*?\)/g, " ").replace(/[^A-Za-z' -]/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter((p) => !/^(mr|mrs|ms|dr|mx|sir|jr|sr)$/i.test(p));
  const first = parts[0];
  if (!first || first.length < 2) return null;
  if (/^(owner|manager|info|office|sales|admin|contact|team|the|dept|department)$/i.test(first)) return null;
  return first[0].toUpperCase() + first.slice(1).toLowerCase();
}

// ─── Signature and footer ───────────────────────────────────────────────────

export const UNSUB_TOKEN = "{{unsubscribe_url}}";

export function signatureText(s: SendingSettings, c: ComplianceSettings): string {
  const g = s.signature;
  const lines = [g.name, g.title, g.company, g.phone];
  if (c.booking_link) lines.push(c.booking_link);
  return lines.filter(Boolean).join("\n");
}

export function footerText(c: ComplianceSettings): string {
  return [
    "—",
    `${c.mailing_address || "[mailing address missing]"}`,
    `Don't want these emails? Unsubscribe: ${UNSUB_TOKEN}`,
  ].join("\n");
}

export function fullBody(body: string, s: SendingSettings, c: ComplianceSettings): string {
  return `${body.trim()}\n\n${signatureText(s, c)}\n\n${footerText(c)}`;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Plain text → simple HTML: paragraphs and line breaks, links clickable.
export function textToHtml(text: string): string {
  return text.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>').replace(/\n/g, "<br/>")}</p>`).join("");
}

// ─── Trades and places ──────────────────────────────────────────────────────

const TRADE_WORDS: Record<string, string[]> = {
  plumbing: ["plumb"],
  electrical: ["electric"],
  hvac: ["hvac", "heating", "air condition", "cooling", "a/c "],
  roofing: ["roof"],
  landscaping: ["landscap", "lawn"],
  painting: ["painting", "painter"],
  concrete: ["concrete"],
  "pest control": ["pest", "termite", "exterminat"],
  remodeling: ["remodel", "renovat"],
};
export function tradeWords(trade: string): string[] {
  const t = trade.trim().toLowerCase();
  if (TRADE_WORDS[t]) return TRADE_WORDS[t];
  const stem = t.replace(/(ing|ers|er|s)$/, "");
  return [stem.length >= 4 ? stem : t];
}

export interface TradeFields { company: string | null; category: string | null; primary_service: string | null; primary_sub_service: string | null; tags: string[] | null }
export function matchesTrade(p: TradeFields, trade: string): boolean {
  const hay = [p.company, p.category, p.primary_service, p.primary_sub_service, ...(p.tags ?? [])].filter(Boolean).join(" ").toLowerCase();
  return tradeWords(trade).some((w) => hay.includes(w));
}

export const placeKey = (city: string | null, state: string | null) =>
  city && state ? `${city.trim().toLowerCase()}|${state.trim().toUpperCase()}` : null;

export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ─── The pre-launch checklist ───────────────────────────────────────────────

export interface Recipient extends TradeFields {
  prospect_id: string; email: string; first_name: string | null; city: string | null; state: string | null; status: string;
}
export interface Territory { id: string; name: string; center_city: string; center_state: string; lat: number | null; lng: number | null; radius_miles: number; trade: string; reason: string | null; active: boolean }
export interface ClaimedMarket { id: string; client: string; city: string; state: string; trade: string; active: boolean }
export type Geo = Map<string, { lat: number; lng: number } | null>; // placeKey → coords (null = not found)

export interface CheckItem { key: string; label: string; ok: boolean; detail: string; names?: string[] }
export interface Checklist { ok: boolean; items: CheckItem[] }

const who = (r: Recipient) => `${r.company || r.email}${r.city ? ` (${r.city}${r.state ? `, ${r.state}` : ""})` : ""}`;
const nameList = (rs: Recipient[], max = 25) => rs.slice(0, max).map(who);
const more = (n: number, shown: number) => (n > shown ? ` and ${n - shown} more` : "");

export function runChecklist(input: {
  recipients: Recipient[]; subject: string; body: string;
  territories: Territory[]; claimed: ClaimedMarket[]; geo: Geo;
  sending: SendingSettings; compliance: ComplianceSettings;
  pilot: { required: boolean; size: number | null; min: number; max: number };
  dailyCap: number; hardMax: number; unsubscribeReady: boolean;
}): Checklist {
  const { recipients: rs } = input;
  const items: CheckItem[] = [];

  // (0) An audience at all.
  items.push({ key: "audience", label: "Audience has recipients with an email", ok: rs.length > 0,
    detail: rs.length ? `${rs.length} recipient${rs.length === 1 ? "" : "s"}.` : "Nobody in this view has an email address." });

  // (a) No Do Not Contact.
  const dnc = rs.filter((r) => r.status === "Do Not Contact");
  items.push({ key: "dnc", label: "No Do Not Contact prospects", ok: dnc.length === 0,
    detail: dnc.length ? `${dnc.length} marked Do Not Contact: ${nameList(dnc).join("; ")}${more(dnc.length, 25)}.` : "None in the audience.", names: nameList(dnc) });

  // (b) Protected territories.
  const inTerritory: { r: Recipient; t: Territory; miles: number }[] = [];
  const unlocated: Recipient[] = [];
  for (const t of input.territories.filter((x) => x.active)) {
    const center = t.lat != null && t.lng != null ? { lat: t.lat, lng: t.lng } : input.geo.get(placeKey(t.center_city, t.center_state) ?? "") ?? null;
    for (const r of rs) {
      if (!matchesTrade(r, t.trade)) continue;
      const k = placeKey(r.city, r.state);
      const here = k ? input.geo.get(k) ?? null : null;
      if (!center || !here) { if (!unlocated.includes(r)) unlocated.push(r); continue; }
      const miles = milesBetween(center, here);
      if (miles <= Number(t.radius_miles)) inTerritory.push({ r, t, miles });
    }
  }
  const terrNames = inTerritory.slice(0, 25).map(({ r, t, miles }) => `${who(r)}: ${miles.toFixed(1)} mi from ${t.center_city}, ${t.trade} (${t.reason || t.name})`);
  const unlocNames = nameList(unlocated);
  items.push({ key: "territory", label: "Nobody inside a protected territory", ok: inTerritory.length === 0 && unlocated.length === 0,
    detail: inTerritory.length
      ? `${inTerritory.length} inside a protected territory: ${terrNames.join("; ")}${more(inTerritory.length, 25)}.`
      : unlocated.length
        ? `${unlocated.length} in a protected trade couldn't be placed on the map, so they can't be cleared: ${unlocNames.join("; ")}${more(unlocated.length, 25)}. Fix their city and state or remove them.`
        : "Clear.",
    names: [...terrNames, ...unlocNames] });

  // (c) Claimed markets.
  const claimedHits: { r: Recipient; m: ClaimedMarket }[] = [];
  for (const m of input.claimed.filter((x) => x.active)) {
    const mk = placeKey(m.city, m.state);
    for (const r of rs) if (placeKey(r.city, r.state) === mk && matchesTrade(r, m.trade)) claimedHits.push({ r, m });
  }
  const claimNames = claimedHits.slice(0, 25).map(({ r, m }) => `${who(r)}: ${m.trade} claimed by ${m.client}`);
  items.push({ key: "claimed", label: "Nobody in a market a client has claimed", ok: claimedHits.length === 0,
    detail: claimedHits.length ? `${claimedHits.length} in a claimed market: ${claimNames.join("; ")}${more(claimedHits.length, 25)}.` : "Clear.", names: claimNames });

  // (d) Emails and personalization.
  const badEmail = rs.filter((r) => !isEmail(r.email));
  const unknown = unknownTokens(`${input.subject}\n${input.body}`);
  const unresolved = rs.filter((r) => unresolvedFor(`${input.subject}\n${input.body}`, { first_name: r.first_name, company: r.company, city: r.city }).length > 0);
  const tokensWithout = Array.from(new Set(tokensIn(`${input.subject}\n${input.body}`).filter((t) => !t.fallback).map((t) => `{{${t.token}}}`)));
  const dProblems: string[] = [];
  if (badEmail.length) dProblems.push(`${badEmail.length} with an email that doesn't look valid: ${nameList(badEmail, 10).join("; ")}${more(badEmail.length, 10)}`);
  if (unknown.length) dProblems.push(`unknown token${unknown.length > 1 ? "s" : ""} ${unknown.map((t) => `{{${t}}}`).join(", ")} (use first_name, company or city)`);
  if (unresolved.length) dProblems.push(`${unresolved.length} can't fill ${tokensWithout.join(", ")} and it has no fallback, e.g. ${nameList(unresolved, 5).join("; ")}. Add one like {{first_name|there}}`);
  items.push({ key: "personalization", label: "Every email and personalization field resolves", ok: dProblems.length === 0,
    detail: dProblems.length ? `${dProblems.join(". ")}.` : "Every recipient has a valid email and every field fills or has a fallback." });

  // Sender profile (blocks too: a 555 number or placeholder must never go out).
  const sp = sendingProblems(input.sending, { forLaunch: true });
  items.push({ key: "sender", label: "Sender profile is real and complete", ok: sp.length === 0, detail: sp.length ? sp.join(" ") : `${input.sending.from_name} <${input.sending.from_address}>.` });

  // (e) CAN-SPAM footer with a mailing address.
  const addr = input.compliance.mailing_address?.trim();
  const addrPh = addr ? placeholderIn(addr) : null;
  items.push({ key: "footer", label: "CAN-SPAM footer has a mailing address", ok: !!addr && !addrPh,
    detail: !addr ? "The mailing address in Settings is blank, so the campaign can't launch." : addrPh ? `The mailing address contains placeholder text ("${addrPh}").` : `Footer: ${addr}.` });

  // (f) Unsubscribe link.
  items.push({ key: "unsubscribe", label: "Unsubscribe link present", ok: input.unsubscribeReady,
    detail: input.unsubscribeReady ? "Each email gets its own one-click unsubscribe link, which marks the prospect Do Not Contact." : "Unsubscribe links can't be signed on this server." });

  // Pilot and daily cap.
  if (input.pilot.required) {
    const n = rs.length;
    const ok = n >= input.pilot.min && n <= input.pilot.max;
    items.push({ key: "pilot", label: `Pilot: first campaign is ${input.pilot.min}–${input.pilot.max} recipients`, ok,
      detail: ok ? `${n} recipients.` : `${n} recipients. A first campaign must be between ${input.pilot.min} and ${input.pilot.max}.` });
  }
  const capOk = input.dailyCap >= 1 && input.dailyCap <= input.hardMax;
  items.push({ key: "cap", label: "Daily cap within the limit", ok: capOk, detail: capOk ? `${input.dailyCap} a day (limit ${input.hardMax}).` : `${input.dailyCap} a day is over the limit of ${input.hardMax}.` });

  return { ok: items.every((i) => i.ok), items };
}
