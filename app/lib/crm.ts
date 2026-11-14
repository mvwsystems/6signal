import { db } from "./db";
import {
  ListFilters, Prospect, EditableField, EDITABLE_FIELDS, DedupeKey, ImportRecord, RowVerdict,
  companyDomain, diff, mergeRecords, findClusters, Cluster, DEAL_STAGES,
} from "./crmCore";

// Server-side CRM data access (Supabase, service role). Unlike the funnel
// helpers in db.ts, these return errors instead of swallowing them: the CRM is
// an operator tool and a silent empty list would read as "no prospects".

export class CrmError extends Error {
  constructor(message: string, public status = 500) { super(message); }
}

function client() {
  const s = db();
  if (!s) throw new CrmError("Database not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).", 503);
  return s;
}

// PostgREST caps a select at 1,000 rows, so whole-table reads page through.
async function selectAll<T>(table: string, columns: string): Promise<T[]> {
  const s = client();
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await s.from(table).select(columns).order("id").range(from, from + 999);
    if (error) throw new CrmError(error.message);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

// Characters that would break a PostgREST or() expression are stripped from
// free-text search rather than escaped.
const safeTerm = (q: string) => q.replace(/[,()*%"\\]/g, " ").replace(/\s+/g, " ").trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(query: any, f: ListFilters) {
  let qy = query;
  if (f.q) {
    const t = safeTerm(f.q);
    const digits = t.replace(/\D/g, "");
    const parts = ["company", "contact_name", "email", "city", "website"].map((c) => `${c}.ilike."*${t}*"`);
    if (digits.length >= 4) parts.push(`phone.ilike.*${digits.split("").join("*")}*`);
    else parts.push(`phone.ilike.*${t}*`);
    if (t) qy = qy.or(parts.join(","));
  }
  if (f.status?.length) qy = qy.in("status", f.status);
  if (f.category) qy = qy.eq("category", f.category);
  if (f.state) qy = qy.eq("state", f.state);
  if (f.angle) qy = qy.eq("service_angle", f.angle);
  if (f.tags?.length) qy = qy.overlaps("tags", f.tags);
  if (f.has?.includes("email")) qy = qy.not("email", "is", null);
  if (f.has?.includes("phone")) qy = qy.not("phone", "is", null);
  return qy;
}

// "Has decision makers" is an inner join on crm_contacts: PostgREST then keeps
// only prospects with at least one contact, and the count follows.
const withContacts = (f: ListFilters, cols: string) => (f.has?.includes("contacts") ? `${cols}, crm_contacts!inner(id)` : cols);

export async function listProspects(f: ListFilters): Promise<{ rows: Prospect[]; total: number }> {
  const s = client();
  const page = f.page ?? 1;
  const size = f.pageSize ?? 50;
  let q = s.from("crm_prospects").select(withContacts(f, "*"), { count: "exact" });
  q = applyFilters(q, f);
  q = q.order(f.sort ?? "company", { ascending: (f.dir ?? "asc") === "asc", nullsFirst: false }).order("id");
  const { data, error, count } = await q.range((page - 1) * size, page * size - 1);
  if (error) throw new CrmError(error.message);
  const rows = ((data ?? []) as unknown as (Prospect & { crm_contacts?: unknown })[]).map(({ crm_contacts: _c, ...r }) => r as Prospect); // eslint-disable-line @typescript-eslint/no-unused-vars
  return { rows, total: count ?? 0 };
}

// Ids of every prospect matching the filter (for "select all matching").
export async function matchingIds(f: ListFilters): Promise<string[]> {
  const s = client();
  const ids: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await applyFilters(s.from("crm_prospects").select(withContacts(f, "id")), f).order("id").range(from, from + 999);
    if (error) throw new CrmError(error.message);
    ids.push(...(data ?? []).map((r: { id: string }) => r.id));
    if (!data || data.length < 1000) break;
  }
  return ids;
}

export async function facets(): Promise<{ states: string[]; tags: string[]; categories: string[]; total: number }> {
  const rows = await selectAll<{ id: string; state: string | null; tags: string[]; category: string | null }>("crm_prospects", "id, state, tags, category");
  const uniq = (v: (string | null)[]) => Array.from(new Set(v.filter((x): x is string => !!x))).sort();
  return { states: uniq(rows.map((r) => r.state)), tags: uniq(rows.flatMap((r) => r.tags ?? [])), categories: uniq(rows.map((r) => r.category)), total: rows.length };
}

export async function logActivity(a: { entityType: string; entityId?: string | null; action: string; summary: string; changes?: unknown }) {
  const { error } = await client().from("crm_activity").insert({
    entity_type: a.entityType, entity_id: a.entityId ?? null, action: a.action, summary: a.summary, changes: a.changes ?? null,
  });
  if (error) throw new CrmError(`Activity log write failed: ${error.message}`);
}

export async function getProspect(id: string) {
  const s = client();
  const [p, contacts, notes, merges] = await Promise.all([
    s.from("crm_prospects").select("*").eq("id", id).maybeSingle(),
    s.from("crm_contacts").select("*").eq("prospect_id", id).order("is_primary", { ascending: false }),
    s.from("crm_notes").select("*").eq("prospect_id", id).order("created_at", { ascending: false }),
    s.from("crm_merge_log").select("id, merged_id, reason, created_at, company:merged_snapshot->>company").eq("survivor_id", id),
  ]);
  if (merges.error) throw new CrmError(merges.error.message);
  // A merged record's history stays under its own id; show it here too.
  const ids = [id, ...(merges.data ?? []).map((m: { merged_id: string }) => m.merged_id)];
  const activity = await s.from("crm_activity").select("*").eq("entity_type", "prospect").in("entity_id", ids).order("created_at", { ascending: false }).limit(100);
  for (const r of [p, contacts, notes, activity, merges]) if (r.error) throw new CrmError(r.error.message);
  if (!p.data) return null;
  return { prospect: p.data as Prospect, contacts: contacts.data ?? [], notes: notes.data ?? [], activity: activity.data ?? [], merges: merges.data ?? [] };
}

function cleanPatch(input: Record<string, unknown>): Partial<Record<EditableField, unknown>> {
  const patch: Partial<Record<EditableField, unknown>> = {};
  for (const k of EDITABLE_FIELDS) {
    if (!(k in input)) continue;
    let v = input[k];
    if (typeof v === "string") v = v.trim() === "" ? null : v.trim();
    if (k === "tags") v = Array.isArray(v) ? (v as unknown[]).map(String).map((t) => t.trim()).filter(Boolean) : [];
    if (k === "lead_score" || k === "deal_value" || k === "priority_call_rank") v = v == null ? (k === "priority_call_rank" ? null : 0) : Number(v);
    patch[k] = v;
  }
  return patch;
}

export async function updateProspect(id: string, input: Record<string, unknown>) {
  const s = client();
  const { data: before, error: e1 } = await s.from("crm_prospects").select("*").eq("id", id).maybeSingle();
  if (e1) throw new CrmError(e1.message);
  if (!before) throw new CrmError("Prospect not found", 404);
  const patch: Record<string, unknown> = cleanPatch(input);
  if ("company" in patch && !patch.company) throw new CrmError("Company can't be blank", 400);
  if ("website" in patch || "email" in patch) {
    patch.website_domain = companyDomain((patch.website ?? before.website) as string | null, (patch.email ?? before.email) as string | null);
  }
  const changes = diff(before, patch);
  if (!Object.keys(changes).length) return { prospect: before as Prospect, changed: 0 };
  const { data, error } = await s.from("crm_prospects").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select("*").single();
  if (error) throw new CrmError(error.message, 400);
  const fields = Object.keys(changes).filter((k) => k !== "website_domain");
  await logActivity({ entityType: "prospect", entityId: id, action: "updated", summary: `Edited ${fields.join(", ")}`, changes });
  return { prospect: data as Prospect, changed: fields.length };
}

export async function createProspect(input: Record<string, unknown>) {
  const patch: Record<string, unknown> = cleanPatch(input);
  if (!patch.company) throw new CrmError("Company is required", 400);
  patch.website_domain = companyDomain(patch.website as string | null, patch.email as string | null);
  const { data, error } = await client().from("crm_prospects").insert(patch).select("*").single();
  if (error) throw new CrmError(error.message, 400);
  await logActivity({ entityType: "prospect", entityId: data.id, action: "created", summary: `Added ${data.company}` });
  return data as Prospect;
}

export async function addNote(prospectId: string, content: string, type = "note") {
  const { data, error } = await client().from("crm_notes").insert({ prospect_id: prospectId, content, type }).select("*").single();
  if (error) throw new CrmError(error.message, 400);
  await logActivity({ entityType: "prospect", entityId: prospectId, action: "noted", summary: `Added a ${type}` });
  return data;
}

// Bulk status/tag changes. The caller states the count it showed the operator;
// a mismatch (the filter matched more or fewer rows since) refuses the change.
export async function bulkUpdate(ids: string[], expectedCount: number, op: { status?: string; addTag?: string; removeTag?: string }) {
  if (ids.length !== expectedCount) throw new CrmError(`Selection changed: expected ${expectedCount}, found ${ids.length}. Nothing was changed.`, 409);
  if (!op.status && !op.addTag && !op.removeTag) throw new CrmError("Nothing to change", 400);
  const s = client();
  let done = 0;
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    if (op.status) {
      const { error } = await s.from("crm_prospects").update({ status: op.status, updated_at: new Date().toISOString() }).in("id", chunk);
      if (error) throw new CrmError(`${error.message} (after ${done} of ${ids.length})`, 400);
    }
    if (op.addTag || op.removeTag) {
      const { data, error } = await s.from("crm_prospects").select("id, tags").in("id", chunk);
      if (error) throw new CrmError(error.message);
      for (const r of data ?? []) {
        let tags: string[] = r.tags ?? [];
        if (op.addTag && !tags.includes(op.addTag)) tags = [...tags, op.addTag];
        if (op.removeTag) tags = tags.filter((t) => t !== op.removeTag);
        const { error: e2 } = await s.from("crm_prospects").update({ tags, updated_at: new Date().toISOString() }).eq("id", r.id);
        if (e2) throw new CrmError(`${e2.message} (after ${done} of ${ids.length})`);
      }
    }
    done += chunk.length;
  }
  const what = [op.status && `status → ${op.status}`, op.addTag && `added tag "${op.addTag}"`, op.removeTag && `removed tag "${op.removeTag}"`].filter(Boolean).join(", ");
  await logActivity({ entityType: "prospect", action: "bulk_updated", summary: `Bulk: ${what} on ${done} prospects`, changes: { ids, op } });
  return done;
}

export async function dedupeKeys(): Promise<DedupeKey[]> {
  return selectAll<DedupeKey>("crm_prospects", "id, company, email, website, phone");
}

// Inserts only rows whose verdict is "new"; everything else is reported on
// the import record, never written to prospects.
export async function commitImport(args: { filename: string; source: string | null; mapping: unknown; records: ImportRecord[]; verdicts: RowVerdict[] }) {
  const s = client();
  const toInsert = args.records
    .map((r, i) => ({ r, v: args.verdicts[i] }))
    .filter(({ v }) => v?.verdict === "new")
    .map(({ r }) => {
      const p = cleanPatch(r as Record<string, unknown>) as Record<string, unknown>;
      p.website_domain = companyDomain(p.website as string | null, p.email as string | null);
      if (!p.source && args.source) p.source = args.source;
      if (args.source) p.tags = Array.from(new Set([...((p.tags as string[]) ?? []), `Imported: ${args.source}`]));
      return p;
    });
  const count = (v: string) => args.verdicts.filter((x) => x.verdict === v).length;
  const candidates = args.verdicts.filter((v) => v.verdict === "duplicate-in-db").map((v) => ({ row: v.row, existingId: v.existingId, existingCompany: v.existingCompany, reason: v.reason, record: args.records[v.row - 1] }));
  const { data: imp, error: e1 } = await s.from("crm_imports").insert({
    filename: args.filename, source: args.source, mapping: args.mapping, row_count: args.records.length,
    added: 0, duplicates_in_file: count("duplicate-in-file"), duplicates_in_db: count("duplicate-in-db"), invalid: count("invalid"), merge_candidates: candidates,
  }).select("id").single();
  if (e1) throw new CrmError(e1.message);
  let added = 0;
  for (let i = 0; i < toInsert.length; i += 500) {
    const { error } = await s.from("crm_prospects").insert(toInsert.slice(i, i + 500));
    if (error) {
      await s.from("crm_imports").update({ added }).eq("id", imp.id);
      throw new CrmError(`Import stopped after ${added} of ${toInsert.length} new rows: ${error.message}`);
    }
    added += Math.min(500, toInsert.length - i);
  }
  await s.from("crm_imports").update({ added }).eq("id", imp.id);
  await logActivity({ entityType: "import", entityId: imp.id, action: "imported", summary: `Imported ${args.filename}: ${added} added, ${candidates.length} possible duplicates held for review, ${count("duplicate-in-file")} repeated rows and ${count("invalid")} invalid rows skipped` });
  return { importId: imp.id as string, added, candidates: candidates.length };
}

export async function listImports() {
  const { data, error } = await client().from("crm_imports").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw new CrmError(error.message);
  return data ?? [];
}

export async function duplicateClusters(): Promise<{ clusters: (Cluster & { rows: Prospect[] })[] }> {
  const all = await selectAll<Prospect>("crm_prospects", "*");
  const byId = new Map(all.map((p) => [p.id, p]));
  const clusters = findClusters(all).map((c) => ({ ...c, rows: c.ids.map((id) => byId.get(id)!).filter(Boolean) }));
  return { clusters };
}

// Merge `mergedId` into `survivorId`: fill blanks, union tags, append notes,
// move contacts and notes, snapshot the merged record, then delete it.
export async function mergeProspects(survivorId: string, mergedId: string, reason: string) {
  if (survivorId === mergedId) throw new CrmError("Pick two different records", 400);
  const s = client();
  const [a, b] = await Promise.all([
    s.from("crm_prospects").select("*").eq("id", survivorId).maybeSingle(),
    s.from("crm_prospects").select("*").eq("id", mergedId).maybeSingle(),
  ]);
  if (a.error || b.error) throw new CrmError((a.error ?? b.error)!.message);
  if (!a.data || !b.data) throw new CrmError("One of the records no longer exists", 404);
  const survivor = a.data as Prospect;
  const merged = b.data as Prospect;
  const patch = mergeRecords(survivor, merged);

  const { error: logErr } = await s.from("crm_merge_log").insert({ survivor_id: survivorId, merged_id: mergedId, merged_snapshot: merged, reason });
  if (logErr) throw new CrmError(`Merge log write failed, nothing merged: ${logErr.message}`);
  if (Object.keys(patch).length) {
    const { error } = await s.from("crm_prospects").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", survivorId);
    if (error) throw new CrmError(error.message);
  }
  for (const t of ["crm_contacts", "crm_notes"]) {
    const { error } = await s.from(t).update({ prospect_id: survivorId }).eq("prospect_id", mergedId);
    if (error) throw new CrmError(error.message);
  }
  const { error: delErr } = await s.from("crm_prospects").delete().eq("id", mergedId);
  if (delErr) throw new CrmError(delErr.message);
  await logActivity({ entityType: "prospect", entityId: survivorId, action: "merged", summary: `Merged "${merged.company}" into this record (${reason})`, changes: diff(survivor as unknown as Record<string, unknown>, patch as Record<string, unknown>) });
  return { patchFields: Object.keys(patch) };
}

export async function listViews() {
  const { data, error } = await client().from("crm_saved_views").select("*").order("name");
  if (error) throw new CrmError(error.message);
  return data ?? [];
}

export async function saveView(name: string, filters: unknown) {
  const { data, error } = await client().from("crm_saved_views").insert({ name, filters }).select("*").single();
  if (error) throw new CrmError(error.message, 400);
  return data;
}

export async function deleteView(id: string) {
  const { error } = await client().from("crm_saved_views").delete().eq("id", id);
  if (error) throw new CrmError(error.message);
}

// ─── One-time Manus export load ────────────────────────────────────────────
// Batches come from the browser (the file is read and mapped there with
// transformManusExport). Rows upsert on legacy_id, the Manus id, so a re-run
// updates instead of duplicating. Only known columns are written.

const LEGACY_COLUMNS = {
  prospects: ["legacy_id", "company", "contact_name", "contact_title", "email", "phone", "city", "state", "zip", "website", "website_domain", "linkedin", "category", "service_angle", "primary_service", "primary_sub_service", "addon_services", "status", "tags", "lead_score", "priority_call_rank", "estimated_revenue", "company_size", "source", "notes", "deal_stage", "deal_value", "follow_up_count", "last_contact_at", "created_at", "updated_at"],
  contacts: ["legacy_id", "name", "title", "email", "phone", "linkedin", "source_urls", "confidence", "is_primary", "created_at", "updated_at"],
  notes: ["legacy_id", "type", "content", "scheduled_at", "completed_at", "created_at"],
} as const;
type LegacyKind = keyof typeof LEGACY_COLUMNS;
const LEGACY_TABLE: Record<LegacyKind, string> = { prospects: "crm_prospects", contacts: "crm_contacts", notes: "crm_notes" };

export async function loadLegacyBatch(kind: string, rows: Record<string, unknown>[]) {
  if (!(kind in LEGACY_COLUMNS)) throw new CrmError("Unknown batch kind", 400);
  const k = kind as LegacyKind;
  if (!Array.isArray(rows) || !rows.length) throw new CrmError("No rows", 400);
  if (rows.length > 1000) throw new CrmError("Send at most 1,000 rows per batch", 400);
  const s = client();
  let pidMap = new Map<number, string>();
  if (k !== "prospects") {
    const pids = Array.from(new Set(rows.map((r) => Number(r.pid))));
    const { data, error } = await s.from("crm_prospects").select("id, legacy_id").in("legacy_id", pids);
    if (error) throw new CrmError(error.message);
    pidMap = new Map((data ?? []).map((d) => [d.legacy_id as number, d.id as string]));
    const missing = pids.filter((p) => !pidMap.has(p));
    if (missing.length) throw new CrmError(`Load prospects first: Manus #${missing.slice(0, 5).join(", #")} not found`, 409);
  }
  const clean = rows.map((r) => {
    if (!Number.isInteger(Number(r.legacy_id))) throw new CrmError("A row has no Manus id", 400);
    const o: Record<string, unknown> = {};
    for (const c of LEGACY_COLUMNS[k]) if (c in r) o[c] = r[c];
    if (k !== "prospects") o.prospect_id = pidMap.get(Number(r.pid));
    return o;
  });
  const { error } = await s.from(LEGACY_TABLE[k]).upsert(clean, { onConflict: "legacy_id" });
  if (error) throw new CrmError(`${k}: ${error.message}`);
  return { written: clean.length };
}

export async function finishLegacyLoad(expected: { prospects: number; contacts: number; notes: number }) {
  const s = client();
  const countOf = async (table: string, extra?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    let q = s.from(table).select("id", { count: "exact", head: true }).not("legacy_id", "is", null);
    if (extra) q = extra(q);
    const { count, error } = await q;
    if (error) throw new CrmError(error.message);
    return count ?? 0;
  };
  const got = {
    prospects: await countOf("crm_prospects"),
    contacts: await countOf("crm_contacts"),
    notes: await countOf("crm_notes"),
    doNotContact: await countOf("crm_prospects", (q) => q.eq("status", "Do Not Contact")),
  };
  await logActivity({ entityType: "import", action: "imported", summary: `Loaded the Manus CRM export: ${got.prospects} prospects, ${got.contacts} decision makers, ${got.notes} notes (expected ${expected.prospects}, ${expected.contacts}, ${expected.notes})` });
  return { got, ok: got.prospects === expected.prospects && got.contacts === expected.contacts && got.notes === expected.notes };
}

// ─── CRM dashboard numbers (Manus-style overview) ──────────────────────────
export async function crmStats() {
  const s = client();
  const count = async (table: string, f?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    let q = s.from(table).select("id", { count: "exact", head: true });
    if (f) q = f(q);
    const { count: n, error } = await q;
    if (error) throw new CrmError(error.message);
    return n ?? 0;
  };
  const [total, withEmail, withPhone, decisionMakers, contacted, customers] = await Promise.all([
    count("crm_prospects"),
    count("crm_prospects", (q) => q.not("email", "is", null)),
    count("crm_prospects", (q) => q.not("phone", "is", null)),
    count("crm_contacts"),
    count("crm_prospects", (q) => q.neq("status", "Never contacted")),
    count("crm_prospects", (q) => q.eq("status", "Customer")),
  ]);
  const { data: activity, error } = await s.from("crm_activity").select("id, entity_type, action, summary, created_at").order("created_at", { ascending: false }).limit(100);
  if (error) throw new CrmError(error.message);
  return { total, withEmail, withPhone, decisionMakers, contacted, customers, activity: activity ?? [] };
}

// ─── C2: pipeline, customers, Hit List ─────────────────────────────────────

const CARD_COLS = "id, company, contact_name, city, state, status, service_angle, deal_stage, deal_value, updated_at, last_contact_at, priority_call_rank";
export type PipelineCard = Pick<Prospect, "id" | "company" | "contact_name" | "city" | "state" | "status" | "service_angle" | "deal_stage" | "deal_value" | "updated_at" | "last_contact_at" | "priority_call_rank">;

// Stage totals for the whole board plus the first page of cards per stage
// (most recently touched first). New Lead holds thousands, so cards page.
export async function pipeline(angle: string | null, stage: string | null, offset: number, limit = 40) {
  const s = client();
  const stages = stage ? [stage] : [...DEAL_STAGES];
  const all = await selectAll<{ id: string; deal_stage: string; deal_value: number; service_angle: string | null }>("crm_prospects", "id, deal_stage, deal_value, service_angle");
  const totals: Record<string, { count: number; value: number }> = {};
  for (const st of DEAL_STAGES) totals[st] = { count: 0, value: 0 };
  for (const r of all) {
    if (angle && r.service_angle !== angle) continue;
    const t = totals[r.deal_stage];
    if (t) { t.count += 1; t.value += Number(r.deal_value) || 0; }
  }
  const cards: Record<string, PipelineCard[]> = {};
  await Promise.all(stages.map(async (st) => {
    let q = s.from("crm_prospects").select(CARD_COLS).eq("deal_stage", st);
    if (angle) q = q.eq("service_angle", angle);
    const { data, error } = await q.order("updated_at", { ascending: false }).order("id").range(offset, offset + limit - 1);
    if (error) throw new CrmError(error.message);
    cards[st] = (data ?? []) as PipelineCard[];
  }));
  return { totals, cards };
}

// Moves a deal to another stage. Status follows only where the mapping is
// unambiguous: Closed Won → Customer. The move resets the idle clock
// (updated_at) and is written to the activity log with both changes.
export async function moveStage(id: string, stage: string) {
  if (!(DEAL_STAGES as readonly string[]).includes(stage)) throw new CrmError("Unknown stage", 400);
  const s = client();
  const { data: before, error: e1 } = await s.from("crm_prospects").select("id, company, deal_stage, status").eq("id", id).maybeSingle();
  if (e1) throw new CrmError(e1.message);
  if (!before) throw new CrmError("Prospect not found", 404);
  if (before.deal_stage === stage) return { moved: false };
  const patch: Record<string, unknown> = { deal_stage: stage, updated_at: new Date().toISOString() };
  const changes: Record<string, { from: unknown; to: unknown }> = { deal_stage: { from: before.deal_stage, to: stage } };
  if (stage === "Closed Won" && before.status !== "Customer") {
    patch.status = "Customer";
    changes.status = { from: before.status, to: "Customer" };
  }
  const { error } = await s.from("crm_prospects").update(patch).eq("id", id);
  if (error) throw new CrmError(error.message, 400);
  await logActivity({
    entityType: "prospect", entityId: id, action: "stage_moved", changes,
    summary: `Moved ${before.company} from ${before.deal_stage} to ${stage}${changes.status ? " (status set to Customer)" : ""}`,
  });
  return { moved: true, statusChanged: !!changes.status };
}

// Customers = status Customer. Next deliverable is the earliest open dated
// note or follow-up; billing comes from Stripe on the client, matched by email.
export async function customers() {
  const s = client();
  const { data, error } = await s.from("crm_prospects")
    .select("id, company, contact_name, email, primary_service, primary_sub_service, addon_services, deal_stage, deal_value, last_contact_at, updated_at")
    .eq("status", "Customer").order("company");
  if (error) throw new CrmError(error.message);
  const rows = data ?? [];
  const next: Record<string, { content: string; scheduled_at: string }> = {};
  if (rows.length) {
    const { data: notes, error: e2 } = await s.from("crm_notes").select("prospect_id, content, scheduled_at")
      .in("prospect_id", rows.map((r) => r.id)).is("completed_at", null).not("scheduled_at", "is", null).order("scheduled_at");
    if (e2) throw new CrmError(e2.message);
    for (const n of notes ?? []) if (!next[n.prospect_id]) next[n.prospect_id] = { content: n.content, scheduled_at: n.scheduled_at };
  }
  return { customers: rows.map((r) => ({ ...r, next: next[r.id] ?? null })) };
}

// The daily queue: follow-ups due by `until` (end of the operator's day),
// replies nobody has worked yet (status Replied), and the hand-curated
// priority call list (priority_call_rank, 1 = first).
export async function hitList(until: string) {
  const s = client();
  const [fu, replies, calls] = await Promise.all([
    s.from("crm_notes").select("id, content, scheduled_at, prospect:crm_prospects(id, company, contact_name, phone, email, status)")
      .eq("type", "follow_up").is("completed_at", null).lte("scheduled_at", until).order("scheduled_at"),
    s.from("crm_prospects").select("id, company, contact_name, phone, email, status, updated_at").eq("status", "Replied").order("updated_at"),
    s.from("crm_prospects").select("id, company, contact_name, phone, email, status, city, state, priority_call_rank, last_contact_at")
      .not("priority_call_rank", "is", null).order("priority_call_rank"),
  ]);
  for (const r of [fu, replies, calls]) if (r.error) throw new CrmError(r.error.message);
  return { followUps: fu.data ?? [], replies: replies.data ?? [], calls: calls.data ?? [] };
}

export async function scheduleFollowUp(prospectId: string, at: string, content: string) {
  const when = new Date(at);
  if (Number.isNaN(when.getTime())) throw new CrmError("Pick a follow-up date", 400);
  const { data, error } = await client().from("crm_notes")
    .insert({ prospect_id: prospectId, type: "follow_up", content: content?.trim() || "Follow up", scheduled_at: when.toISOString() })
    .select("id").single();
  if (error) throw new CrmError(error.message, 400);
  await logActivity({ entityType: "prospect", entityId: prospectId, action: "follow_up_set", summary: `Follow-up set for ${when.toISOString().slice(0, 10)}` });
  return data;
}

export async function completeFollowUp(noteId: string) {
  const s = client();
  const { data, error } = await s.from("crm_notes").update({ completed_at: new Date().toISOString() }).eq("id", noteId).is("completed_at", null).select("prospect_id").maybeSingle();
  if (error) throw new CrmError(error.message, 400);
  if (!data) throw new CrmError("Already done or not found", 404);
  await logActivity({ entityType: "prospect", entityId: data.prospect_id, action: "follow_up_done", summary: "Follow-up marked done" });
  return { done: true };
}

// Call list order: add (to the end), remove, or swap with the neighbour.
export async function changeCallRank(prospectId: string, op: "add" | "remove" | "up" | "down") {
  const s = client();
  const { data: list, error } = await s.from("crm_prospects").select("id, company, priority_call_rank").not("priority_call_rank", "is", null).order("priority_call_rank");
  if (error) throw new CrmError(error.message);
  const rows = list ?? [];
  const i = rows.findIndex((r) => r.id === prospectId);
  const set = async (id: string, rank: number | null) => {
    const { error: e } = await s.from("crm_prospects").update({ priority_call_rank: rank, updated_at: new Date().toISOString() }).eq("id", id);
    if (e) throw new CrmError(e.message, 400);
  };
  if (op === "add") {
    if (i >= 0) return { changed: false };
    await set(prospectId, (rows.at(-1)?.priority_call_rank ?? 0) + 1);
    await logActivity({ entityType: "prospect", entityId: prospectId, action: "updated", summary: "Added to the priority call list" });
  } else if (op === "remove") {
    if (i < 0) return { changed: false };
    await set(prospectId, null);
    await logActivity({ entityType: "prospect", entityId: prospectId, action: "updated", summary: "Removed from the priority call list" });
  } else {
    const j = op === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= rows.length) return { changed: false };
    await set(rows[i].id, rows[j].priority_call_rank);
    await set(rows[j].id, rows[i].priority_call_rank);
    await logActivity({ entityType: "prospect", entityId: prospectId, action: "updated", summary: `Moved ${op} the priority call list to #${rows[j].priority_call_rank}` });
  }
  return { changed: true };
}
