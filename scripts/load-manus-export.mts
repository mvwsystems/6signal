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
import { transformManusExport, type ManusExport } from "../app/lib/crmCore.ts";

type Row = Record<string, unknown>;

const file = process.argv[2];
const commit = process.argv.includes("--commit");
if (!file) {
  console.error("Usage: node scripts/load-manus-export.mts <export.json> [--commit]");
  process.exit(1);
}

const exp = JSON.parse(readFileSync(file, "utf8")) as ManusExport & { contacts?: Record<string, Row[]> };
// Same mapping the dashboard's "Load Manus export" panel uses.
const { prospects, contacts: contactRows, notes: noteRows, problems, stats } = transformManusExport(exp);

console.log("Export summary");
console.log(`  prospects        ${stats.prospects}`);
console.log(`  decision makers  ${stats.contacts} on ${Object.keys(exp.contacts ?? {}).length} prospects`);
console.log(`  notes            ${stats.notes}`);
console.log(`  sequences        ${stats.sequences} (not loaded; C4)`);
console.log(`  Do Not Contact   ${stats.doNotContact}`);
console.log(`  with email       ${stats.withEmail}, phone ${stats.withPhone}`);
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

const withProspect = (rows: (Row & { pid: number })[]) => rows.map(({ pid, ...r }) => ({ ...r, prospect_id: idByLegacy.get(pid) }));
await upsert("crm_contacts", withProspect(contactRows), "decision makers");
await upsert("crm_notes", withProspect(noteRows), "notes");

const { count: loaded } = await s.from("crm_prospects").select("id", { count: "exact", head: true }).not("legacy_id", "is", null);
const { count: dnc } = await s.from("crm_prospects").select("id", { count: "exact", head: true }).eq("status", "Do Not Contact");
await s.from("crm_activity").insert({
  entity_type: "import", action: "imported",
  summary: `Loaded the Manus CRM export: ${prospects.length} prospects, ${contactRows.length} decision makers, ${noteRows.length} notes`,
});
console.log(`\nVerify: ${loaded} Manus prospects in the table (expected ${prospects.length}), ${dnc} Do Not Contact.`);
if (loaded !== prospects.length) process.exit(2);
