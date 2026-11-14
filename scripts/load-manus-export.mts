// One-time load of the Manus CRM export into the dashboard CRM tables.
//
//   node scripts/load-manus-export.mts path/to/manus-crm-export-YYYYMMDD.json            # dry run, writes nothing
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
//   node scripts/load-manus-export.mts path/to/manus-crm-export-YYYYMMDD.json --commit   # load
//
// Safe to re-run: rows are upserted on legacy_id (the Manus id), so a second
// run updates instead of duplicating. Duplicates inside the Manus data are
// loaded as-is on purpose; they get merged on the Duplicates page, where each
// merge is logged. Sequences are counted but not loaded (they belong to C4).
// Needs Node 22.18+ (runs TypeScript directly).

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { STATUSES, DEAL_STAGES, companyDomain } from "../app/lib/crmCore.ts";

type Row = Record<string, unknown>;

const file = process.argv[2];
const commit = process.argv.includes("--commit");
if (!file) {
  console.error("Usage: node scripts/load-manus-export.mts <export.json> [--commit]");
  process.exit(1);
}

const exp = JSON.parse(readFileSync(file, "utf8")) as {
  manifest?: { counts?: Record<string, number> };
  prospects: Row[];
  contacts: Record<string, Row[]>;
  notes: Record<string, Row[]>;
  sequences?: Row[];
};

const ANGLE: Record<string, string> = {
  "AI-Generated Website": "Website Lead",
  "AI Visibility": "AI Visibility Lead",
  "AI Infrastructure": "AI Infrastructure Lead",
};

const str = (v: unknown): string | null => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};
const num = (v: unknown, d = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const date = (v: unknown): string | null => (v ? new Date(String(v)).toISOString() : null);

const problems: string[] = [];

const prospects = exp.prospects.map((p) => {
  const status = str(p.contactStatus) ?? "Never contacted";
  if (!(STATUSES as readonly string[]).includes(status)) problems.push(`Manus #${p.id}: unknown status "${status}"`);
  const stage = str(p.dealStage) ?? "New Lead";
  if (!(DEAL_STAGES as readonly string[]).includes(stage)) problems.push(`Manus #${p.id}: unknown deal stage "${stage}"`);
  const tags = Array.isArray(p.tags) ? (p.tags as unknown[]).map(String) : [];
  const importTag = tags.find((t) => t.startsWith("Imported: "));
  if (!str(p.companyName)) problems.push(`Manus #${p.id}: no company name`);
  return {
    legacy_id: num(p.id),
    company: str(p.companyName) ?? "Unknown",
    contact_name: str(p.contactName),
    contact_title: str(p.contactTitle),
    email: str(p.email),
    phone: str(p.phone),
    city: str(p.city),
    state: str(p.state),
    zip: str(p.zipCode),
    website: str(p.website),
    website_domain: companyDomain(str(p.website), str(p.email)),
    linkedin: str(p.linkedinUrl),
    category: str(p.category),
    service_angle: ANGLE[String(p.primaryService)] ?? null,
    primary_service: str(p.primaryService),
    primary_sub_service: str(p.primarySubService),
    addon_services: Array.isArray(p.addonServices) ? (p.addonServices as unknown[]).map(String) : [],
    status,
    tags,
    lead_score: num(p.leadScore),
    priority_call_rank: p.priorityCallRank == null ? null : num(p.priorityCallRank),
    estimated_revenue: str(p.estimatedRevenue),
    company_size: str(p.companySize),
    source: importTag ? `Manus: ${importTag.slice("Imported: ".length)}` : "Manus CRM",
    notes: str(p.notes),
    deal_stage: stage,
    deal_value: num(p.dealValue),
    follow_up_count: num(p.followUpCount),
    last_contact_at: date(p.lastContactDate),
    created_at: date(p.createdAt) ?? new Date().toISOString(),
    updated_at: date(p.updatedAt) ?? new Date().toISOString(),
  };
});

const contactRows = Object.entries(exp.contacts ?? {}).flatMap(([pid, list]) => list.map((c) => ({ pid: Number(pid), c })));
const noteRows = Object.entries(exp.notes ?? {}).flatMap(([pid, list]) => list.map((n) => ({ pid: Number(pid), n })));

const legacyIds = new Set(prospects.map((p) => p.legacy_id));
if (legacyIds.size !== prospects.length) problems.push(`${prospects.length - legacyIds.size} repeated Manus ids in the export`);
for (const { pid } of [...contactRows, ...noteRows]) if (!legacyIds.has(pid)) problems.push(`Contact or note points at missing Manus #${pid}`);

const count = (pred: (p: (typeof prospects)[number]) => boolean) => prospects.filter(pred).length;
console.log("Export summary");
console.log(`  prospects        ${prospects.length}`);
console.log(`  decision makers  ${contactRows.length} on ${Object.keys(exp.contacts ?? {}).length} prospects`);
console.log(`  notes            ${noteRows.length}`);
console.log(`  sequences        ${exp.sequences?.length ?? 0} (not loaded; C4)`);
console.log(`  Do Not Contact   ${count((p) => p.status === "Do Not Contact")}`);
console.log(`  with email       ${count((p) => !!p.email)}, phone ${count((p) => !!p.phone)}, website ${count((p) => !!p.website)}, LinkedIn ${count((p) => !!p.linkedin)}, ZIP ${count((p) => !!p.zip)}`);
if (exp.manifest?.counts) {
  const m = exp.manifest.counts;
  const check = (name: string, got: number, want?: number) => {
    if (want != null && want !== got) problems.push(`${name}: export manifest says ${want}, file has ${got}`);
  };
  check("prospects", prospects.length, m.prospects);
  check("contacts", contactRows.length, m.contacts);
  check("notes", noteRows.length, m.notes);
  check("sequences", exp.sequences?.length ?? 0, m.sequences);
}
if (problems.length) {
  console.error(`\n${problems.length} problem(s), nothing loaded:`);
  for (const p of problems.slice(0, 50)) console.error(`  - ${p}`);
  process.exit(1);
}
if (!commit) {
  console.log("\nDry run only. Add --commit to load.");
  process.exit(0);
}

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to load.");
  process.exit(1);
}
const s = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function upsert(table: string, rows: Row[], label: string) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await s.from(table).upsert(rows.slice(i, i + 500), { onConflict: "legacy_id" });
    if (error) throw new Error(`${label}: stopped after ${i} of ${rows.length}: ${error.message}`);
  }
  console.log(`  ${label}: ${rows.length}`);
}

console.log("\nLoading");
await upsert("crm_prospects", prospects, "prospects");

const idByLegacy = new Map<number, string>();
for (let from = 0; ; from += 1000) {
  const { data, error } = await s.from("crm_prospects").select("id, legacy_id").not("legacy_id", "is", null).order("legacy_id").range(from, from + 999);
  if (error) throw new Error(error.message);
  for (const r of data ?? []) idByLegacy.set(r.legacy_id as number, r.id as string);
  if (!data || data.length < 1000) break;
}

await upsert("crm_contacts", contactRows.map(({ pid, c }) => ({
  legacy_id: num(c.id),
  prospect_id: idByLegacy.get(pid),
  name: str(c.name),
  title: str(c.title),
  email: str(c.email),
  phone: str(c.phone),
  linkedin: str(c.linkedinUrl),
  source_urls: Array.isArray(c.sourceUrls) ? (c.sourceUrls as unknown[]).map(String) : c.sourceUrls ? [String(c.sourceUrls)] : [],
  confidence: str(c.confidence),
  is_primary: !!c.isPrimary,
  created_at: date(c.createdAt) ?? new Date().toISOString(),
  updated_at: date(c.updatedAt) ?? new Date().toISOString(),
})), "decision makers");

await upsert("crm_notes", noteRows.map(({ pid, n }) => ({
  legacy_id: num(n.id),
  prospect_id: idByLegacy.get(pid),
  type: str(n.type) ?? "note",
  content: str(n.content) ?? "",
  scheduled_at: date(n.scheduledAt),
  completed_at: date(n.completedAt),
  created_at: date(n.createdAt) ?? new Date().toISOString(),
})), "notes");

const { count: loaded } = await s.from("crm_prospects").select("id", { count: "exact", head: true }).not("legacy_id", "is", null);
const { count: dnc } = await s.from("crm_prospects").select("id", { count: "exact", head: true }).eq("status", "Do Not Contact");
await s.from("crm_activity").insert({
  entity_type: "import", action: "imported",
  summary: `Loaded the Manus CRM export: ${prospects.length} prospects, ${contactRows.length} decision makers, ${noteRows.length} notes`,
});
console.log(`\nVerify: ${loaded} Manus prospects in the table (expected ${prospects.length}), ${dnc} Do Not Contact.`);
if (loaded !== prospects.length) process.exit(2);
