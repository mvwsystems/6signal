import crypto from "crypto";
import { db } from "./db";
import { currentActor } from "./actor";
import { CrmError, logActivity, matchingIds, stopForProspects } from "./crm";
import { ListFilters, STATUSES, DEAL_STAGES, SERVICE_ANGLES, CATEGORIES } from "./crmCore";
import { perform, registerAction, canApprove } from "./commandCenter";
import { sendEmail } from "./email";
import { BASE } from "./site";
const siteOrigin = () => BASE; // links in emails always point at the live site
import { ownerEmails, operatorEmails } from "./dashboard-auth";
import {
  SendingSettings, ComplianceSettings, CampaignDefaults, DEFAULT_SENDING, DEFAULT_COMPLIANCE, DEFAULT_CAMPAIGN,
  sendingProblems, placeholderIn, isEmail, firstNameFrom, render, fullBody, textToHtml, UNSUB_TOKEN,
  Recipient, Territory, ClaimedMarket, Geo, placeKey, matchesTrade, runChecklist, Checklist,
} from "./campaignCore";

// ─────────────────────────────────────────────────────────────────────────────
// C3: campaigns with approval-first safety, and the Settings tab's data.
//
// The path to a real send has four locks, in this order:
//   1. Creating a campaign freezes its recipients and runs the pre-launch
//      checklist. A failed checklist can't be submitted.
//   2. Submitting makes a Red approval Item in the Command Center. Only Matt
//      (owner) can approve it, and approving is what runs the launch.
//   3. The launch runs the checklist again on the frozen list.
//   4. Unless SEND_ENABLED=true is set in Netlify (Matt's flag), an approved
//      campaign is marked Queued with the reason and nothing is sent.
// Only then is it pushed to Instantly (the sending engine), which needs
// INSTANTLY_API_KEY. A TEST send goes to one address through Resend.
// ─────────────────────────────────────────────────────────────────────────────

function client() {
  const s = db();
  if (!s) throw new CrmError("Database not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).", 503);
  return s;
}
function actor() {
  const a = currentActor();
  if (!a) throw new CrmError("Not signed in", 401);
  return a;
}
function ownerOnly() {
  const a = actor();
  if (!canApprove(a.role)) throw new CrmError("Only Matt can change this.", 403);
  return a;
}
const now = () => new Date().toISOString();

// ─── Config (Netlify env) ───────────────────────────────────────────────────

export const sendEnabled = () => process.env.SEND_ENABLED?.trim().toLowerCase() === "true";
export const hardDailyMax = () => {
  const n = Number(process.env.CAMPAIGN_DAILY_CAP_MAX);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 50;
};
const instantlyKey = () => process.env.INSTANTLY_API_KEY?.trim() || null;

// ─── Settings ───────────────────────────────────────────────────────────────

type SettingKey = "sending" | "compliance" | "campaign_defaults";
const DEFAULTS: Record<SettingKey, unknown> = { sending: DEFAULT_SENDING, compliance: DEFAULT_COMPLIANCE, campaign_defaults: DEFAULT_CAMPAIGN };

async function readSettings(): Promise<{ sending: SendingSettings; compliance: ComplianceSettings; campaign_defaults: CampaignDefaults; updated: Record<string, { by: string | null; at: string }> }> {
  const { data, error } = await client().from("settings").select("*");
  if (error) throw new CrmError(error.message);
  const by = new Map((data ?? []).map((r: { key: string; value: unknown; updated_by: string | null; updated_at: string }) => [r.key, r]));
  const val = <T>(k: SettingKey): T => {
    const d = DEFAULTS[k] as Record<string, unknown>;
    const v = (by.get(k)?.value ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...d, ...v };
    if (k === "sending") merged.signature = { ...(d.signature as object), ...((v.signature as object) ?? {}) };
    return merged as T;
  };
  const updated: Record<string, { by: string | null; at: string }> = {};
  for (const [k, r] of by) if (k in DEFAULTS) updated[k] = { by: r.updated_by, at: r.updated_at };
  return { sending: val("sending"), compliance: val("compliance"), campaign_defaults: val("campaign_defaults"), updated };
}

async function connectionsStatus() {
  const { data } = await client().from("connections").select("name,status,note,last_sync_at,last_error").in("name", ["instantly", "resend"]);
  return data ?? [];
}

export async function getSettings() {
  const s = await readSettings();
  const territories = await listTerritories();
  const { data: claimed, error } = await client().from("claimed_markets").select("*").order("client").order("city");
  if (error) throw new CrmError(error.message);
  return {
    ...s,
    territories, claimed: claimed ?? [],
    config: {
      send_enabled: sendEnabled(), hard_daily_max: hardDailyMax(),
      instantly_key: !!instantlyKey(), resend_key: !!process.env.RESEND_API_KEY?.trim(), places_key: !!process.env.GOOGLE_PLACES_API_KEY?.trim(),
      email_from: process.env.EMAIL_FROM?.trim() || null,
    },
    connections: await connectionsStatus(),
    team: { owners: ownerEmails(), operators: operatorEmails() },
    lists: { statuses: STATUSES, deal_stages: DEAL_STAGES, service_angles: SERVICE_ANGLES, categories: CATEGORIES },
    can_edit: canApprove(actor().role),
  };
}

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function saveSettings(key: string, input: Record<string, unknown>) {
  const who = ownerOnly();
  let value: unknown;
  if (key === "sending") {
    const sig = (input.signature ?? {}) as Record<string, unknown>;
    const v: SendingSettings = {
      from_name: str(input.from_name, 80), from_address: str(input.from_address, 200), reply_to: str(input.reply_to, 200),
      signature: { name: str(sig.name, 80), title: str(sig.title, 120), company: str(sig.company, 80), phone: str(sig.phone, 40) },
    };
    const problems = sendingProblems(v);
    if (problems.length) throw new CrmError(problems.join(" "), 400);
    value = v;
  } else if (key === "compliance") {
    const v: ComplianceSettings = { mailing_address: str(input.mailing_address, 300), booking_link: str(input.booking_link, 300) };
    const ph = v.mailing_address ? placeholderIn(v.mailing_address) : null;
    if (ph) throw new CrmError(`The mailing address contains placeholder text ("${ph}").`, 400);
    if (v.booking_link && !/^https:\/\/\S+$/.test(v.booking_link)) throw new CrmError("The booking link must start with https://", 400);
    value = v;
  } else if (key === "campaign_defaults") {
    const max = hardDailyMax();
    const cap = Math.floor(Number(input.daily_cap));
    if (!(cap >= 1 && cap <= max)) throw new CrmError(`Daily cap must be between 1 and ${max} (the limit set in Netlify).`, 400);
    const pmin = Math.floor(Number(input.pilot_min)), pmax = Math.floor(Number(input.pilot_max));
    if (!(pmin >= 5 && pmax <= 50 && pmin <= pmax)) throw new CrmError("Pilot size must stay within 5 to 50.", 400);
    const from = str(input.send_window_from, 5), to = str(input.send_window_to, 5);
    if (!/^\d\d:\d\d$/.test(from) || !/^\d\d:\d\d$/.test(to) || from >= to) throw new CrmError("Send window must be HH:MM to a later HH:MM.", 400);
    const days = Array.isArray(input.send_days) ? Array.from(new Set((input.send_days as unknown[]).map(Number).filter((d) => d >= 0 && d <= 6))).sort() : [];
    if (!days.length) throw new CrmError("Pick at least one send day.", 400);
    value = { daily_cap: cap, pilot_min: pmin, pilot_max: pmax, send_window_from: from, send_window_to: to, send_days: days } satisfies CampaignDefaults;
  } else throw new CrmError("Unknown settings section.", 400);

  const before = (await readSettings())[key as SettingKey];
  const { error } = await client().from("settings").upsert({ key, value, updated_by: who.name, updated_at: now() });
  if (error) throw new CrmError(error.message);
  await logActivity({ entityType: "settings", action: "updated", summary: `${who.name} updated Settings → ${key.replace("_", " ")}`, changes: { from: before, to: value }, service: "Command Center" });
  return { ok: true };
}

// ─── Territories and claimed markets ───────────────────────────────────────

export async function listTerritories(): Promise<Territory[]> {
  const { data, error } = await client().from("territories").select("*").order("name");
  if (error) throw new CrmError(error.message);
  return (data ?? []) as Territory[];
}

export async function saveTerritory(input: Record<string, unknown>) {
  const who = ownerOnly();
  const row = {
    name: str(input.name, 80) || `${str(input.center_city, 80)} ${str(input.center_state, 2).toUpperCase()}`,
    center_city: str(input.center_city, 80), center_state: str(input.center_state, 2).toUpperCase(),
    radius_miles: Number(input.radius_miles), trade: str(input.trade, 60).toLowerCase(), reason: str(input.reason, 200) || null,
    active: input.active !== false, updated_at: now(),
  };
  if (!row.center_city || !/^[A-Z]{2}$/.test(row.center_state)) throw new CrmError("Centre city and a 2-letter state are required.", 400);
  if (!(row.radius_miles > 0 && row.radius_miles <= 500)) throw new CrmError("Radius must be between 1 and 500 miles.", 400);
  if (!row.trade) throw new CrmError("Trade is required (for example plumbing).", 400);
  const place = await locate([{ city: row.center_city, state: row.center_state }]);
  const c = place.get(placeKey(row.center_city, row.center_state)!);
  const withGeo = { ...row, lat: c?.lat ?? null, lng: c?.lng ?? null };
  const id = str(input.id, 40);
  const q = id ? client().from("territories").update(withGeo).eq("id", id) : client().from("territories").insert(withGeo);
  const { data, error } = await q.select("*").single();
  if (error) throw new CrmError(error.message, 400);
  await logActivity({ entityType: "territory", entityId: data.id, action: id ? "updated" : "created", summary: `${who.name} ${id ? "updated" : "added"} protected territory ${row.name}: ${row.radius_miles} mi around ${row.center_city}, ${row.center_state} for ${row.trade}${c ? "" : " (centre not found on the map yet)"}`, service: "Command Center" });
  return data;
}

export async function deleteTerritory(id: string) {
  const who = ownerOnly();
  const { data, error } = await client().from("territories").delete().eq("id", id).select("name").maybeSingle();
  if (error) throw new CrmError(error.message);
  await logActivity({ entityType: "territory", entityId: id, action: "deleted", summary: `${who.name} removed protected territory ${data?.name ?? id}`, service: "Command Center" });
  return { ok: true };
}

export async function saveClaimed(input: Record<string, unknown>) {
  const who = ownerOnly();
  const row = { client: str(input.client, 80), city: str(input.city, 80), state: str(input.state, 2).toUpperCase(), trade: str(input.trade, 60).toLowerCase(), note: str(input.note, 200) || null, active: input.active !== false };
  if (!row.client || !row.city || !/^[A-Z]{2}$/.test(row.state) || !row.trade) throw new CrmError("Client, city, 2-letter state and trade are required.", 400);
  const id = str(input.id, 40);
  const q = id ? client().from("claimed_markets").update(row).eq("id", id) : client().from("claimed_markets").insert(row);
  const { data, error } = await q.select("*").single();
  if (error) throw new CrmError(error.message.includes("duplicate") ? "That market is already claimed by that client." : error.message, 400);
  await logActivity({ entityType: "claimed_market", entityId: data.id, action: id ? "updated" : "created", summary: `${who.name} ${id ? "updated" : "added"} claimed market: ${row.trade} in ${row.city}, ${row.state} for ${row.client}`, service: "Command Center", client: row.client });
  return data;
}

export async function deleteClaimed(id: string) {
  const who = ownerOnly();
  const { data, error } = await client().from("claimed_markets").delete().eq("id", id).select("client,city,state,trade").maybeSingle();
  if (error) throw new CrmError(error.message);
  await logActivity({ entityType: "claimed_market", entityId: id, action: "deleted", summary: `${who.name} removed claimed market${data ? `: ${data.trade} in ${data.city}, ${data.state} for ${data.client}` : ""}`, service: "Command Center" });
  return { ok: true };
}

// ─── Places (for the territory radius check) ───────────────────────────────
// Cached in geo_places. A miss is looked up with Google Places (the key the
// Maps tools already use) and cached, found or not, so each town is looked up
// once. At most LOOKUPS_PER_RUN new towns per check keeps one check cheap;
// anything left unlocated blocks the launch by name rather than passing.

const LOOKUPS_PER_RUN = 40;

async function geocodeTown(city: string, state: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) return null;
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.displayName,places.location,places.types" },
      body: JSON.stringify({ textQuery: `${city}, ${state}, USA`, maxResultCount: 1 }),
    });
    if (!res.ok) return null;
    const p = (await res.json()).places?.[0];
    return p?.location ? { lat: p.location.latitude, lng: p.location.longitude, label: p.displayName?.text ?? city } : null;
  } catch { return null; }
}

async function locate(places: { city: string | null; state: string | null }[]): Promise<Geo> {
  const keys = Array.from(new Set(places.map((p) => placeKey(p.city, p.state)).filter((k): k is string => !!k)));
  const geo: Geo = new Map();
  if (!keys.length) return geo;
  const s = client();
  const states = Array.from(new Set(keys.map((k) => k.split("|")[1])));
  const { data, error } = await s.from("geo_places").select("city_key,state,lat,lng").in("state", states);
  if (error) throw new CrmError(error.message);
  for (const r of data ?? []) geo.set(`${r.city_key}|${r.state}`, r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : null);
  let lookups = 0;
  for (const k of keys) {
    if (geo.has(k) || lookups >= LOOKUPS_PER_RUN) continue;
    lookups++;
    const [cityKey, state] = k.split("|");
    const city = places.find((p) => placeKey(p.city, p.state) === k)!.city!.trim();
    const hit = await geocodeTown(city, state);
    geo.set(k, hit ? { lat: hit.lat, lng: hit.lng } : null);
    if (process.env.GOOGLE_PLACES_API_KEY?.trim()) {
      await s.from("geo_places").upsert({ city_key: cityKey, state, lat: hit?.lat ?? null, lng: hit?.lng ?? null, label: hit?.label ?? null });
    }
  }
  return geo;
}

// ─── Audience ───────────────────────────────────────────────────────────────

const RECIPIENT_COLS = "id, company, contact_name, email, city, state, status, category, primary_service, primary_sub_service, tags, lead_score";
type ProspectRow = { id: string; company: string; contact_name: string | null; email: string | null; city: string | null; state: string | null; status: string; category: string | null; primary_service: string | null; primary_sub_service: string | null; tags: string[] | null; lead_score: number };

async function audienceFilters(input: { view_id?: unknown; filters?: unknown }): Promise<{ filters: ListFilters; view_id: string | null; view_name: string | null }> {
  const viewId = str(input.view_id, 40);
  if (viewId) {
    const { data, error } = await client().from("crm_saved_views").select("*").eq("id", viewId).maybeSingle();
    if (error) throw new CrmError(error.message);
    if (!data) throw new CrmError("That saved view no longer exists.", 404);
    return { filters: (data.filters ?? {}) as ListFilters, view_id: data.id, view_name: data.name };
  }
  if (input.filters && typeof input.filters === "object") return { filters: input.filters as ListFilters, view_id: null, view_name: null };
  throw new CrmError("Pick a saved view as the audience.", 400);
}

async function fetchProspects(ids: string[]): Promise<ProspectRow[]> {
  const out: ProspectRow[] = [];
  for (let i = 0; i < ids.length; i += 300) {
    const { data, error } = await client().from("crm_prospects").select(RECIPIENT_COLS).in("id", ids.slice(i, i + 300));
    if (error) throw new CrmError(error.message);
    out.push(...((data ?? []) as ProspectRow[]));
  }
  return out;
}

// First names: the prospect's own contact first, else its primary decision maker.
async function decisionMakerNames(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (let i = 0; i < ids.length; i += 300) {
    const { data, error } = await client().from("crm_contacts").select("prospect_id,name,is_primary").in("prospect_id", ids.slice(i, i + 300)).order("is_primary", { ascending: false });
    if (error) throw new CrmError(error.message);
    for (const c of data ?? []) if (!out.has(c.prospect_id) && firstNameFrom(c.name)) out.set(c.prospect_id, firstNameFrom(c.name)!);
  }
  return out;
}

async function buildAudience(filters: ListFilters, pilotSize: number | null) {
  const ids = await matchingIds({ ...filters, page: undefined, pageSize: undefined });
  const rows = await fetchProspects(ids);
  const withEmail = rows.filter((r) => r.email?.trim());
  const dm = await decisionMakerNames(withEmail.filter((r) => !firstNameFrom(r.contact_name)).map((r) => r.id));
  let recipients: Recipient[] = withEmail
    .sort((a, b) => (b.lead_score ?? 0) - (a.lead_score ?? 0) || a.company.localeCompare(b.company))
    .map((r) => ({
      prospect_id: r.id, email: r.email!.trim(), first_name: firstNameFrom(r.contact_name) ?? dm.get(r.id) ?? null,
      company: r.company, city: r.city, state: r.state, status: r.status,
      category: r.category, primary_service: r.primary_service, primary_sub_service: r.primary_sub_service, tags: r.tags,
    }));
  if (pilotSize) recipients = recipients.slice(0, pilotSize);
  return { matched: rows.length, withEmail: withEmail.length, recipients };
}

async function anySent(): Promise<boolean> {
  const { count, error } = await client().from("campaigns").select("id", { count: "exact", head: true }).in("status", ["sending", "sent", "paused"]);
  if (error) throw new CrmError(error.message);
  return (count ?? 0) > 0;
}

async function checklistFor(recipients: Recipient[], c: { subject: string; body: string; pilot: boolean; pilot_size: number | null; daily_cap: number }): Promise<Checklist> {
  const settings = await readSettings();
  const territories = await listTerritories();
  const { data: claimed, error } = await client().from("claimed_markets").select("*");
  if (error) throw new CrmError(error.message);
  // Only recipients in a protected trade need a place on the map.
  const needPlace = recipients.filter((r) => territories.some((t) => t.active && matchesTrade(r, t.trade)));
  const geo = await locate([...needPlace, ...territories.map((t) => ({ city: t.center_city, state: t.center_state }))]);
  const pilotRequired = !(await anySent());
  return runChecklist({
    recipients, subject: c.subject, body: c.body, territories, claimed: (claimed ?? []) as ClaimedMarket[], geo,
    sending: settings.sending, compliance: settings.compliance,
    pilot: { required: pilotRequired || c.pilot, size: c.pilot_size, min: settings.campaign_defaults.pilot_min, max: settings.campaign_defaults.pilot_max },
    dailyCap: c.daily_cap, hardMax: hardDailyMax(), unsubscribeReady: !!unsubKey(),
  });
}

interface DraftInput { name?: unknown; subject?: unknown; body?: unknown; view_id?: unknown; filters?: unknown; pilot?: unknown; pilot_size?: unknown; daily_cap?: unknown; start_at?: unknown }

async function normalizeDraft(input: DraftInput) {
  const settings = await readSettings();
  const pilotRequired = !(await anySent());
  const pilot = pilotRequired || input.pilot === true;
  const pilotSize = pilot ? Math.floor(Number(input.pilot_size) || 25) : null;
  const dailyCap = Math.floor(Number(input.daily_cap) || settings.campaign_defaults.daily_cap);
  const startAt = str(input.start_at, 40);
  if (startAt && Number.isNaN(Date.parse(startAt))) throw new CrmError("Start date/time isn't valid.", 400);
  return {
    name: str(input.name, 120), subject: str(input.subject, 200), body: typeof input.body === "string" ? input.body.slice(0, 10000) : "",
    pilot, pilot_required: pilotRequired, pilot_size: pilotSize, daily_cap: dailyCap, start_at: startAt || null,
  };
}

// Preview: exact count, the first 10 by name, and the checklist. Writes nothing
// except the place cache.
export async function previewCampaign(input: DraftInput) {
  actor();
  const d = await normalizeDraft(input);
  const aud = await audienceFilters(input);
  const { matched, withEmail, recipients } = await buildAudience(aud.filters, d.pilot_size);
  const checklist = await checklistFor(recipients, d);
  const settings = await readSettings();
  const sample = recipients[0] ?? null;
  return {
    view_name: aud.view_name, matched, with_email: withEmail, recipient_count: recipients.length,
    pilot: d.pilot, pilot_required: d.pilot_required, pilot_size: d.pilot_size, daily_cap: d.daily_cap,
    first10: recipients.slice(0, 10).map((r) => ({ company: r.company, first_name: r.first_name, email: r.email, city: r.city, state: r.state })),
    sample: sample ? renderFor(d.subject, d.body, sample, settings.sending, settings.compliance, `${siteOrigin()}/api/unsubscribe?t=preview`) : null,
    checklist,
  };
}

function renderFor(subject: string, body: string, r: Recipient | { first_name: string | null; company: string | null; city: string | null }, s: SendingSettings, c: ComplianceSettings, unsubUrl: string) {
  const data = { first_name: r.first_name, company: r.company, city: r.city };
  const text = render(fullBody(body, s, c), data).split(UNSUB_TOKEN).join(unsubUrl);
  return { subject: render(subject, data), text, html: textToHtml(text) };
}

// Create: freezes the recipient list, stores the checklist, and if it passes,
// files the Red approval. A failing checklist still saves the draft so it can
// be fixed and re-checked.
export async function createCampaign(input: DraftInput) {
  const who = actor();
  const d = await normalizeDraft(input);
  if (!d.name) throw new CrmError("Give the campaign a name.", 400);
  if (!d.subject) throw new CrmError("Subject is required.", 400);
  if (!d.body.trim()) throw new CrmError("Email body is required.", 400);
  const aud = await audienceFilters(input);
  const { matched, recipients } = await buildAudience(aud.filters, d.pilot_size);
  const checklist = await checklistFor(recipients, d);
  const s = client();
  const { data: camp, error } = await s.from("campaigns").insert({
    name: d.name, status: "draft", subject: d.subject, body: d.body,
    audience: { view_id: aud.view_id, view_name: aud.view_name, filters: aud.filters },
    matched_count: matched, recipient_count: recipients.length, pilot: d.pilot, pilot_size: d.pilot_size,
    daily_cap: d.daily_cap, start_at: d.start_at, checklist, checked_at: now(), created_by: who.name,
  }).select("*").single();
  if (error) throw new CrmError(error.message, 400);
  for (let i = 0; i < recipients.length; i += 500) {
    const { error: rErr } = await s.from("campaign_recipients").insert(recipients.slice(i, i + 500).map((r) => ({
      campaign_id: camp.id, prospect_id: r.prospect_id, email: r.email, first_name: r.first_name, company: r.company, city: r.city, state: r.state,
    })));
    if (rErr) { await s.from("campaigns").delete().eq("id", camp.id); throw new CrmError(rErr.message); }
  }
  await logActivity({ entityType: "campaign", entityId: camp.id, action: "created", summary: `${who.name} drafted campaign "${d.name}": ${recipients.length} recipients from ${aud.view_name ?? "a filter"}${checklist.ok ? "" : ` (checklist failing: ${checklist.items.filter((i) => !i.ok).map((i) => i.label).join(", ")})`}`, service: "Sales & proposals" });
  if (!checklist.ok) return { campaign: camp, submitted: false, checklist };
  return { ...(await submitForApproval(camp.id)), checklist };
}

export async function submitForApproval(id: string) {
  const s = client();
  const camp = await getCampaignRow(id);
  if (!["draft", "killed", "failed"].includes(camp.status)) throw new CrmError(`This campaign is ${camp.status}, not a draft.`, 409);
  const recipients = await frozenRecipients(id);
  const checklist = await checklistFor(recipients, camp);
  await s.from("campaigns").update({ checklist, checked_at: now(), updated_at: now() }).eq("id", id);
  if (!checklist.ok) throw new CrmError(`The checklist doesn't pass yet: ${checklist.items.filter((i) => !i.ok).map((i) => i.detail).join(" ")}`, 409);
  const res = await perform("campaign.launch", { campaignId: id }, {
    title: `Launch campaign "${camp.name}" to ${camp.recipient_count} prospects`,
    summary: `Send "${camp.subject}" to ${camp.recipient_count} prospects from ${camp.audience?.view_name ?? "a filter"}, up to ${camp.daily_cap} a day${camp.start_at ? `, starting ${new Date(camp.start_at).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" })} CT` : ""}.`,
    recommendation: sendEnabled() ? "Approving pushes it to Instantly, which starts sending on the schedule." : "Sending is switched off (SEND_ENABLED isn't set), so approving queues it and sends nothing.",
    detail: `Pre-launch checklist passed: ${checklist.items.map((i) => i.label).join("; ")}.`,
  });
  const itemId = (res as { item?: { id: string } }).item?.id ?? null;
  await s.from("campaigns").update({ status: "pending_approval", approval_item_id: itemId, send_note: "Waiting for Matt's approval in the Command Center.", updated_at: now() }).eq("id", id);
  return { campaign: await getCampaignRow(id), submitted: true, approval_item_id: itemId };
}

async function getCampaignRow(id: string) {
  const { data, error } = await client().from("campaigns").select("*").eq("id", id).maybeSingle();
  if (error) throw new CrmError(error.message);
  if (!data) throw new CrmError("Campaign not found.", 404);
  return data;
}

async function frozenRecipients(id: string): Promise<Recipient[]> {
  const s = client();
  const rows: { prospect_id: string; email: string; first_name: string | null; company: string | null; city: string | null; state: string | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await s.from("campaign_recipients").select("prospect_id,email,first_name,company,city,state").eq("campaign_id", id).order("id").range(from, from + 999);
    if (error) throw new CrmError(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  // Status and trade fields are read fresh, so a prospect marked Do Not
  // Contact after the draft was made still blocks the launch.
  const live = new Map((await fetchProspects(rows.map((r) => r.prospect_id))).map((p) => [p.id, p]));
  return rows.map((r) => {
    const p = live.get(r.prospect_id);
    return {
      prospect_id: r.prospect_id, email: r.email, first_name: r.first_name, company: r.company, city: r.city, state: r.state,
      status: p?.status ?? "Dead", category: p?.category ?? null, primary_service: p?.primary_service ?? null, primary_sub_service: p?.primary_sub_service ?? null, tags: p?.tags ?? [],
    };
  });
}

export async function listCampaigns() {
  actor();
  const { data, error } = await client().from("campaigns").select("id,name,status,subject,audience,matched_count,recipient_count,pilot,pilot_size,daily_cap,start_at,checklist,checked_at,approval_item_id,instantly_campaign_id,send_note,created_by,created_at,updated_at").order("created_at", { ascending: false }).limit(100);
  if (error) throw new CrmError(error.message);
  const views = await client().from("crm_saved_views").select("id,name,filters").order("name");
  return { campaigns: data ?? [], views: views.data ?? [], send_enabled: sendEnabled(), pilot_required: !(await anySent()), hard_daily_max: hardDailyMax(), defaults: (await readSettings()).campaign_defaults };
}

export async function getCampaign(id: string) {
  actor();
  const camp = await getCampaignRow(id);
  const { data: first } = await client().from("campaign_recipients").select("company,first_name,email,city,state,status").eq("campaign_id", id).order("id").limit(10);
  return { campaign: camp, first10: first ?? [] };
}

export async function recipientsCsv(id: string): Promise<string> {
  actor();
  const camp = await getCampaignRow(id);
  const rows = await frozenRecipients(id);
  const q = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const lines = [["company", "first_name", "email", "city", "state", "status"].join(",")];
  for (const r of rows) lines.push([r.company, r.first_name, r.email, r.city, r.state, r.status].map(q).join(","));
  await logActivity({ entityType: "campaign", entityId: id, action: "downloaded", summary: `${actor().name} downloaded the recipient list of "${camp.name}" (${rows.length})`, service: "Sales & proposals" });
  return lines.join("\n");
}

export async function deleteDraft(id: string) {
  const who = actor();
  const camp = await getCampaignRow(id);
  if (!["draft", "killed", "failed"].includes(camp.status)) throw new CrmError("Only a draft, killed or failed campaign can be deleted.", 409);
  const { error } = await client().from("campaigns").delete().eq("id", id);
  if (error) throw new CrmError(error.message);
  await logActivity({ entityType: "campaign", entityId: id, action: "deleted", summary: `${who.name} deleted campaign draft "${camp.name}"`, service: "Sales & proposals" });
  return { ok: true };
}

// ─── Unsubscribe links ─────────────────────────────────────────────────────

function unsubKey(): string | null {
  const k = process.env.UNSUBSCRIBE_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return k ? crypto.createHash("sha256").update(`6sig-unsub:${k}`).digest("hex") : null;
}
export function unsubscribeToken(prospectId: string): string | null {
  const k = unsubKey();
  if (!k) return null;
  const sig = crypto.createHmac("sha256", k).update(prospectId).digest("base64url").slice(0, 22);
  return `${prospectId}.${sig}`;
}
export function prospectFromToken(t: string): string | null {
  const [id, sig] = t.split(".");
  if (!id || !sig) return null;
  const want = unsubscribeToken(id)?.split(".")[1];
  if (!want || want.length !== sig.length) return null;
  return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig)) ? id : null;
}
export const unsubscribeUrl = (prospectId: string) => {
  const t = unsubscribeToken(prospectId);
  return t ? `${siteOrigin()}/api/unsubscribe?t=${t}` : null;
};

export async function unsubscribe(token: string): Promise<"done" | "already" | "invalid"> {
  const id = prospectFromToken(token);
  if (!id) return "invalid";
  const s = client();
  const { data: p } = await s.from("crm_prospects").select("id,company,status").eq("id", id).maybeSingle();
  if (!p) return "invalid";
  if (p.status === "Do Not Contact") return "already";
  const { error } = await s.from("crm_prospects").update({ status: "Do Not Contact", updated_at: now() }).eq("id", id);
  if (error) throw new CrmError(error.message);
  await stopForProspects([id], "do_not_contact", "unsubscribe link");
  await logActivity({ entityType: "prospect", entityId: id, action: "unsubscribed", summary: `${p.company} unsubscribed from email, so it's now Do Not Contact`, changes: { status: { from: p.status, to: "Do Not Contact" } }, actor: "Unsubscribe link" });
  return "done";
}

// ─── TEST send (Resend) ─────────────────────────────────────────────────────

export async function testSend(input: { to?: unknown; subject?: unknown; body?: unknown; campaign_id?: unknown }) {
  const who = actor();
  const to = str(input.to, 200);
  if (!isEmail(to)) throw new CrmError("Enter the address to send the test to.", 400);
  let subject = str(input.subject, 200), body = typeof input.body === "string" ? input.body : "";
  const campId = str(input.campaign_id, 40);
  let sample: Recipient | { first_name: string; company: string; city: string } = { first_name: "Alex", company: "Sample Plumbing Co", city: "Dallas" };
  if (campId) {
    const camp = await getCampaignRow(campId);
    subject = camp.subject; body = camp.body;
    const first = (await frozenRecipients(campId))[0];
    if (first) sample = first;
  }
  if (!subject || !body.trim()) throw new CrmError("Subject and body are needed for a test.", 400);
  const settings = await readSettings();
  const problems = sendingProblems(settings.sending);
  if (problems.length) throw new CrmError(`Fix the sender profile first: ${problems.join(" ")}`, 409);
  if (!process.env.RESEND_API_KEY?.trim()) throw new CrmError("Test sends need RESEND_API_KEY, which isn't set on this server.", 503);
  const r = renderFor(subject, body, sample, settings.sending, settings.compliance, `${siteOrigin()}/api/unsubscribe?t=test`);
  const fromAddr = (process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ?? process.env.EMAIL_FROM ?? "").trim() || "onboarding@resend.dev";
  const banner = `<div style="background:#E6FF00;color:#0b0d02;font:600 12px/1.4 monospace;padding:8px 12px;margin:0 0 16px">TEST: not sent to any prospect. Filled in with ${sample.company ?? "sample"}'s details. The unsubscribe link in a test does nothing.</div>`;
  const ok = await sendEmail({
    to, subject: `[TEST] ${r.subject}`, html: `<div style="font:15px/1.5 Arial,sans-serif;color:#111">${banner}${r.html}</div>`, text: `TEST: not sent to any prospect.\n\n${r.text}`,
    from: `${settings.sending.from_name} <${fromAddr}>`, replyTo: settings.sending.reply_to || undefined,
  });
  if (!ok) throw new CrmError("Resend didn't accept the test email. Check the Resend key and sending domain.", 502);
  await logActivity({ entityType: "campaign", entityId: campId || null, action: "test_sent", summary: `${who.name} sent a TEST email ("${r.subject}") to ${to}`, service: "Sales & proposals" });
  return { ok: true, from: `${settings.sending.from_name} <${fromAddr}>`, subject: `[TEST] ${r.subject}` };
}

// ─── Instantly (the sending engine) ─────────────────────────────────────────

const INSTANTLY = "https://api.instantly.ai/api/v2";
async function instantly(path: string, init: RequestInit = {}) {
  const key = instantlyKey();
  if (!key) throw new Error("INSTANTLY_API_KEY isn't set in Netlify.");
  const res = await fetch(`${INSTANTLY}${path}`, { ...init, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
  if (!res.ok) {
    const why = res.status === 401 ? "the API key was refused" : res.status === 402 ? "the Instantly account has no paid plan" : res.status === 429 ? "Instantly's rate limit was hit" : `HTTP ${res.status}`;
    throw new Error(`Instantly ${path}: ${why}${text ? ` (${text.slice(0, 200)})` : ""}`);
  }
  return json as Record<string, unknown>;
}

export async function testInstantly() {
  ownerOnly();
  const s = client();
  try {
    const ws = await instantly("/workspaces/current");
    const acc = await instantly("/accounts?limit=100");
    const accounts = ((acc.items as { email: string; status: number }[]) ?? []).map((a) => ({ email: a.email, active: a.status === 1 }));
    const note = `Workspace "${String(ws.name ?? "")}". Sending accounts: ${accounts.map((a) => `${a.email}${a.active ? "" : " (not active)"}`).join(", ") || "none yet"}.`;
    await s.from("connections").update({ status: accounts.some((a) => a.active) ? "connected" : "degraded", note, last_sync_at: now(), last_error: null, updated_by: actor().name, updated_at: now() }).eq("name", "instantly");
    return { ok: true, workspace: ws.name ?? null, accounts };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await s.from("connections").update({ status: instantlyKey() ? "down" : "not_configured", last_error: msg, updated_at: now() }).eq("name", "instantly");
    return { ok: false, error: msg };
  }
}

// Each lead carries its own resolved fields, so fallbacks are settled here
// and the template in Instantly only uses custom variables.
function instantlyTemplate(text: string) {
  return text
    .replace(/\{\{\s*first_name\s*(\|[^}]*)?\}\}/gi, "{{v_first_name}}")
    .replace(/\{\{\s*company\s*(\|[^}]*)?\}\}/gi, "{{v_company}}")
    .replace(/\{\{\s*city\s*(\|[^}]*)?\}\}/gi, "{{v_city}}")
    .split(UNSUB_TOKEN).join("{{v_unsubscribe_url}}");
}
function fallbackOf(text: string, tok: string) {
  const m = text.match(new RegExp(`\\{\\{\\s*${tok}\\s*\\|([^}]*)\\}\\}`, "i"));
  return m ? m[1].trim() : "";
}

async function launch(args: Record<string, unknown>): Promise<string> {
  const id = String(args.campaignId ?? "");
  const s = client();
  const camp = await getCampaignRow(id);
  if (camp.status !== "pending_approval") throw new Error(`Campaign is ${camp.status}, not waiting for approval.`);
  const recipients = await frozenRecipients(id);
  const checklist = await checklistFor(recipients, camp);
  if (!checklist.ok) {
    const why = checklist.items.filter((i) => !i.ok).map((i) => i.detail).join(" ");
    await s.from("campaigns").update({ status: "draft", checklist, checked_at: now(), send_note: `Approved, but the checklist failed at launch, so nothing was sent: ${why}`, updated_at: now() }).eq("id", id);
    throw new Error(`Checklist failed at launch, nothing sent: ${why}`);
  }
  if (!sendEnabled()) {
    const note = "Approved and queued. Nothing was sent because SEND_ENABLED isn't set to true in Netlify.";
    await s.from("campaigns").update({ status: "queued", checklist, checked_at: now(), send_note: note, updated_at: now() }).eq("id", id);
    await logActivity({ entityType: "campaign", entityId: id, action: "queued", summary: `Campaign "${camp.name}" approved and queued; nothing sent (SEND_ENABLED is off)`, service: "Sales & proposals" });
    return note;
  }
  try {
    return await pushToInstantly(camp, recipients);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await s.from("campaigns").update({ status: "failed", send_note: `Launch failed: ${msg}${camp.instantly_campaign_id ? "" : " Nothing was sent."}`, updated_at: now() }).eq("id", id);
    await s.from("connections").update({ status: "degraded", last_error: msg, updated_at: now() }).eq("name", "instantly");
    throw e;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pushToInstantly(camp: any, recipients: Recipient[]): Promise<string> {
  const s = client();
  const settings = await readSettings();
  const d = settings.campaign_defaults;
  const body = fullBody(camp.body, settings.sending, settings.compliance);
  const days: Record<string, boolean> = {};
  for (let i = 0; i < 7; i++) days[String(i)] = d.send_days.includes(i);
  const start = camp.start_at ? new Date(camp.start_at) : new Date();
  const created = await instantly("/campaigns", {
    method: "POST",
    body: JSON.stringify({
      name: `6S · ${camp.name}`,
      campaign_schedule: {
        start_date: start.toISOString().slice(0, 10),
        schedules: [{ name: "Weekdays CT", timing: { from: d.send_window_from, to: d.send_window_to }, days, timezone: "America/Chicago" }],
      },
      sequences: [{ steps: [{ type: "email", delay: 0, variants: [{ subject: instantlyTemplate(camp.subject), body: textToHtml(instantlyTemplate(body)) }] }] }],
      email_list: [settings.sending.from_address],
      daily_limit: camp.daily_cap,
      stop_on_reply: true, text_only: false, link_tracking: false, open_tracking: false, insert_unsubscribe_header: true,
    }),
  });
  const instId = String(created.id ?? "");
  if (!instId) throw new Error("Instantly didn't return a campaign id.");
  await s.from("campaigns").update({ instantly_campaign_id: instId, status: "sending", send_note: "Created in Instantly; adding leads.", updated_at: now() }).eq("id", camp.id);
  const fb = { first_name: fallbackOf(`${camp.subject}\n${camp.body}`, "first_name"), company: fallbackOf(`${camp.subject}\n${camp.body}`, "company"), city: fallbackOf(`${camp.subject}\n${camp.body}`, "city") };
  let added = 0;
  for (let i = 0; i < recipients.length; i += 500) {
    const batch = recipients.slice(i, i + 500);
    await instantly("/leads/add", {
      method: "POST",
      body: JSON.stringify({
        campaign_id: instId, skip_if_in_workspace: true, idempotency_key: `${camp.id}-${i}`,
        leads: batch.map((r) => ({
          email: r.email, first_name: r.first_name ?? undefined, company_name: r.company ?? undefined,
          custom_variables: { v_first_name: r.first_name || fb.first_name, v_company: r.company || fb.company, v_city: r.city || fb.city, v_unsubscribe_url: unsubscribeUrl(r.prospect_id) ?? "" },
        })),
      }),
    });
    added += batch.length;
    await s.from("campaign_recipients").update({ status: "pushed" }).eq("campaign_id", camp.id).in("prospect_id", batch.map((r) => r.prospect_id));
  }
  await instantly(`/campaigns/${instId}/activate`, { method: "POST", body: "{}" });
  const note = `Pushed to Instantly with ${added} leads and switched on. It sends up to ${camp.daily_cap} a day in the send window.`;
  await s.from("campaigns").update({ status: "sending", send_note: note, updated_at: now() }).eq("id", camp.id);
  await logActivity({ entityType: "campaign", entityId: camp.id, action: "launched", summary: `Campaign "${camp.name}" launched in Instantly: ${added} leads, up to ${camp.daily_cap} a day`, service: "Sales & proposals" });
  return note;
}

export async function pauseCampaign(id: string) {
  const who = actor();
  const camp = await getCampaignRow(id);
  if (camp.status !== "sending" || !camp.instantly_campaign_id) throw new CrmError("Only a campaign that's sending can be paused.", 409);
  try { await instantly(`/campaigns/${camp.instantly_campaign_id}/pause`, { method: "POST", body: "{}" }); }
  catch (e) { throw new CrmError(e instanceof Error ? e.message : String(e), 502); }
  await client().from("campaigns").update({ status: "paused", send_note: `Paused by ${who.name}.`, updated_at: now() }).eq("id", id);
  await logActivity({ entityType: "campaign", entityId: id, action: "paused", summary: `${who.name} paused campaign "${camp.name}"`, service: "Sales & proposals" });
  return { ok: true };
}

// When Matt kills the approval, the campaign goes back to being editable.
export async function noteKilled(itemId: string) {
  await client().from("campaigns").update({ status: "killed", send_note: "Killed in the Command Center. Nothing was sent.", updated_at: now() }).eq("approval_item_id", itemId).eq("status", "pending_approval");
}

registerAction("campaign.launch", { tier: "red", label: "Launch an email campaign", run: launch });
