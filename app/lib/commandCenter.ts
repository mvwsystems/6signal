import { db } from "./db";
import { currentActor } from "./actor";
import { CrmError, logActivity, hitList } from "./crm";
import { sendAlert } from "./alerts";
import type { Role } from "./dashboard-auth";

// ─────────────────────────────────────────────────────────────────────────────
// Command Center Phase 0 (Casey's Command Center Spec): Items, Approvals,
// Activity, Connections, and the Today queries.
//
// Tiers are enforced here, not in the UI (spec §2 rule 4):
//   Green  → runs at once for Matt or Casey, and is logged.
//   Yellow → becomes an approval Item; nothing runs until Matt approves, and
//            approving is what runs it (no hand-copied second step).
//   Red    → same, and only Matt's owner account can approve, so only Matt
//            can make it run. Money movement is never an action here.
// Casey (operator) can run Green, prepare Yellow/Red, and cannot approve.
// Later phases register their real actions (campaign launch, follow-up
// batches, client reports) with registerAction, so they inherit the gate.
// ─────────────────────────────────────────────────────────────────────────────

export const TIERS = ["green", "yellow", "red"] as const;
export type Tier = (typeof TIERS)[number];
export const ITEM_TYPES = ["approval", "task", "exception", "job", "booking", "invoice", "reply", "check"] as const;
export const ITEM_STATUSES = ["new", "waiting", "approved", "done", "blocked", "failed"] as const;

export interface ActionDef {
  tier: Tier;
  label: string;
  run: (args: Record<string, unknown>) => Promise<string>;
}

const ACTIONS: Record<string, ActionDef> = {};
export function registerAction(key: string, def: ActionDef) { ACTIONS[key] = def; }

// Harmless actions for the QA tier test (migration plan §5): running one only
// writes an Activity entry, so the gate can be proven on live safely.
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
for (const tier of TIERS) {
  registerAction(`check.${tier}`, { tier, label: `${cap(tier)} tier check`, run: async () => `${cap(tier)} tier check ran. Nothing else was changed.` });
}
export const actionList = () => Object.entries(ACTIONS).map(([key, a]) => ({ key, tier: a.tier, label: a.label }));

export const canApprove = (role: Role) => role === "owner";
const ownerKey = (role: Role) => (role === "owner" ? "matt" : "casey");

export interface Approval {
  id: string; item_id: string; summary: string; recommendation: string | null; options: { label: string; effect: string }[];
  expires_at: string | null; decision: "approved" | "killed" | null; decision_note: string | null; decided_by: string | null; decided_at: string | null;
}
export interface Item {
  id: string; type: (typeof ITEM_TYPES)[number]; title: string; detail: string | null; source: string; source_id: string | null; source_url: string | null;
  owner: string; tier: Tier; status: (typeof ITEM_STATUSES)[number]; due_at: string | null; payload: Record<string, unknown>;
  created_at: string; updated_at: string; approval?: Approval | null;
}

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
const now = () => new Date().toISOString();
const ITEM_COLS = "*, approval:approvals(*)";

async function insertItem(row: Partial<Item>): Promise<Item> {
  const { data, error } = await client().from("items").insert(row).select("*").single();
  if (error) throw new CrmError(error.message);
  return data as Item;
}

// ─── The gate ───────────────────────────────────────────────────────────────

export async function perform(key: string, args: Record<string, unknown> = {}, meta: { title?: string; detail?: string; summary?: string; recommendation?: string; sourceUrl?: string } = {}) {
  const def = ACTIONS[key];
  if (!def) throw new CrmError(`Unknown action: ${key}`, 400);
  const who = actor();
  if (def.tier === "green") {
    const result = await def.run(args);
    await logActivity({ entityType: "action", action: "executed", summary: `${who.name} ran ${def.label}: ${result}`, changes: { action: key, tier: "green", args } });
    return { ran: true, result };
  }
  const item = await insertItem({
    type: "approval", title: meta.title || def.label, detail: meta.detail ?? null, source: "dashboard", source_url: meta.sourceUrl ?? null,
    owner: "matt", tier: def.tier, status: "waiting", payload: { action: key, args, requested_by: who.name },
  });
  const { error } = await client().from("approvals").insert({
    item_id: item.id, summary: meta.summary || meta.title || def.label, recommendation: meta.recommendation ?? null,
    options: [{ label: "Approve", effect: `Runs: ${def.label}` }, { label: "Kill", effect: "Nothing runs. A reason is required." }],
    expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  });
  if (error) throw new CrmError(error.message);
  await logActivity({ entityType: "item", entityId: item.id, action: "approval_requested", summary: `${who.name} asked for approval: ${item.title} (${cap(def.tier)})` });
  return { ran: false, item };
}

export async function decide(itemId: string, decision: "approve" | "kill", note?: string) {
  const who = actor();
  if (!canApprove(who.role)) throw new CrmError("Only Matt can approve or kill.", 403);
  if (decision === "kill" && !note?.trim()) throw new CrmError("Say why you're killing it.", 400);
  const s = client();
  const { data: item, error } = await s.from("items").select(ITEM_COLS).eq("id", itemId).maybeSingle();
  if (error) throw new CrmError(error.message);
  if (!item || item.type !== "approval") throw new CrmError("Approval not found.", 404);
  // Recording the decision is the claim: only one decision can ever land, so
  // a double tap or a second tab can't run the action twice.
  const { data: rec, error: dErr } = await s.from("approvals")
    .update({ decision: decision === "approve" ? "approved" : "killed", decision_note: note?.trim() || null, decided_by: who.name, decided_at: now() })
    .eq("item_id", itemId).is("decision", null).select("*").maybeSingle();
  if (dErr) throw new CrmError(dErr.message);
  if (!rec) throw new CrmError("This approval was already decided.", 409);

  if (decision === "kill") {
    await s.from("items").update({ status: "done", payload: { ...item.payload, outcome: "killed" }, updated_at: now() }).eq("id", itemId);
    await logActivity({ entityType: "item", entityId: itemId, action: "killed", summary: `${who.name} killed "${item.title}": ${note!.trim()}` });
    return { decision: "killed" };
  }
  await logActivity({ entityType: "item", entityId: itemId, action: "approved", summary: `${who.name} approved "${item.title}"${note?.trim() ? `: ${note.trim()}` : ""}` });
  const key = typeof item.payload?.action === "string" ? item.payload.action : null;
  const def = key ? ACTIONS[key] : undefined;
  if (!key) {
    // An approval with nothing to run (e.g. a sample): approving closes it.
    await s.from("items").update({ status: "done", payload: { ...item.payload, outcome: "approved" }, updated_at: now() }).eq("id", itemId);
    return { decision: "approved", ran: false };
  }
  let status: "done" | "failed" = "done";
  let result: string;
  try {
    if (!def) throw new Error(`This action (${key}) is no longer available.`);
    result = await def.run((item.payload?.args as Record<string, unknown>) ?? {});
  } catch (e) {
    status = "failed";
    result = e instanceof Error ? e.message : String(e);
  }
  await s.from("items").update({ status, payload: { ...item.payload, outcome: status === "done" ? "approved" : "failed", result }, updated_at: now() }).eq("id", itemId);
  await logActivity({ entityType: "item", entityId: itemId, action: status === "done" ? "executed" : "failed", summary: `"${item.title}" ${status === "done" ? `ran: ${result}` : `failed: ${result}`}` });
  return { decision: "approved", ran: status === "done", result };
}

// ─── Items ──────────────────────────────────────────────────────────────────

export async function createTask(input: { title?: string; detail?: string; due_at?: string | null; owner?: string }) {
  const who = actor();
  const title = input.title?.trim();
  if (!title) throw new CrmError("Give the task a title.", 400);
  const owner = input.owner === "matt" || input.owner === "casey" || input.owner === "unassigned" ? input.owner : ownerKey(who.role);
  let due: string | null = null;
  if (input.due_at) {
    const d = new Date(input.due_at);
    if (Number.isNaN(d.getTime())) throw new CrmError("That due date isn't valid.", 400);
    due = d.toISOString();
  }
  const item = await insertItem({ type: "task", title, detail: input.detail?.trim() || null, source: "manual", owner, tier: "green", status: "new", due_at: due, payload: { created_by: who.name } });
  await logActivity({ entityType: "item", entityId: item.id, action: "created", summary: `${who.name} added a task: ${title}` });
  return item;
}

export async function setItemStatus(id: string, status: string) {
  const who = actor();
  if (!["new", "waiting", "done", "blocked"].includes(status)) throw new CrmError("Status must be new, waiting, done or blocked.", 400);
  const s = client();
  const { data: item, error } = await s.from("items").select("*").eq("id", id).maybeSingle();
  if (error) throw new CrmError(error.message);
  if (!item) throw new CrmError("Item not found.", 404);
  if (item.type === "approval") throw new CrmError("Approvals close by approving or killing them.", 400);
  const { data, error: uErr } = await s.from("items").update({ status, updated_at: now() }).eq("id", id).select("*").single();
  if (uErr) throw new CrmError(uErr.message);
  const verb = status === "done" ? "marked done" : status === "blocked" ? "marked blocked" : status === "waiting" ? "marked waiting" : "reopened";
  await logActivity({ entityType: "item", entityId: id, action: `status_${status}`, summary: `${who.name} ${verb}: ${item.title}`, changes: { status: { from: item.status, to: status } } });
  return data as Item;
}

export async function deleteSampleItems() {
  const who = actor();
  const { data, error } = await client().from("items").delete().eq("payload->>sample", "true").select("id");
  if (error) throw new CrmError(error.message);
  await logActivity({ entityType: "item", action: "deleted", summary: `${who.name} deleted ${data?.length ?? 0} sample items` });
  return { deleted: data?.length ?? 0 };
}

// An exception Item, deduped on source + source_id while one is still open
// (spec Phase 1 rule), with an alert when its route is "immediate".
export async function raiseException(e: { title: string; detail?: string; sourceId: string; severity: "high" | "medium" | "low"; immediate?: boolean; tier?: Tier }) {
  const s = client();
  const { data: open } = await s.from("items").select("id").eq("type", "exception").eq("source", "dashboard").eq("source_id", e.sourceId).neq("status", "done").limit(1);
  if (open && open.length) return { id: open[0].id, deduped: true };
  const item = await insertItem({ type: "exception", title: e.title, detail: e.detail ?? null, source: "dashboard", source_id: e.sourceId, owner: "matt", tier: e.tier ?? "red", status: "new", payload: { severity: e.severity } });
  await logActivity({ entityType: "item", entityId: item.id, action: "exception_raised", summary: e.title });
  if (e.immediate) await sendAlert({ title: e.title, message: e.detail ?? e.title, severity: e.severity });
  return { id: item.id, deduped: false };
}

export async function clearException(sourceId: string, why: string) {
  const { data } = await client().from("items").update({ status: "done", updated_at: now() }).eq("type", "exception").eq("source", "dashboard").eq("source_id", sourceId).neq("status", "done").select("id, title");
  for (const r of data ?? []) await logActivity({ entityType: "item", entityId: r.id, action: "status_done", summary: `Cleared "${r.title}": ${why}` });
}

// ─── Today (spec §5): five filtered views of Items ─────────────────────────

const SEV: Record<string, number> = { high: 0, medium: 1, low: 2 };

export async function today(until: string, since: string) {
  const who = actor();
  const s = client();
  const [open, done, crm] = await Promise.all([
    s.from("items").select(ITEM_COLS).not("status", "in", "(done)").order("created_at").limit(500),
    s.from("items").select(ITEM_COLS).eq("status", "done").gte("updated_at", since).order("updated_at", { ascending: false }).limit(50),
    hitList(until).catch(() => null),
  ]);
  if (open.error) throw new CrmError(open.error.message);
  if (done.error) throw new CrmError(done.error.message);
  const rows = (open.data ?? []) as Item[];
  const decide = rows.filter((r) => r.type === "approval");
  const exceptions = rows.filter((r) => r.type === "exception")
    .sort((a, b) => (SEV[String(a.payload?.severity)] ?? 1) - (SEV[String(b.payload?.severity)] ?? 1) || a.created_at.localeCompare(b.created_at));
  const rest = rows.filter((r) => r.type !== "approval" && r.type !== "exception");
  const happening = rest.filter((r) => r.due_at && r.due_at <= until).sort((a, b) => a.due_at!.localeCompare(b.due_at!));
  const watching = rest.filter((r) => !r.due_at || r.due_at > until);
  return {
    me: { role: who.role, name: who.name, canApprove: canApprove(who.role) },
    updatedAt: now(),
    decide, exceptions, happening, watching,
    done: (done.data ?? []) as Item[],
    crm: crm ? { followUps: crm.followUps.length, replies: crm.replies.length } : null,
  };
}

export async function listApprovals(open: boolean) {
  let q = client().from("items").select(ITEM_COLS).eq("type", "approval");
  q = open ? q.neq("status", "done") : q.eq("status", "done");
  const { data, error } = await q.order("created_at", { ascending: !open }).limit(100);
  if (error) throw new CrmError(error.message);
  return { rows: (data ?? []) as Item[], actions: actionList() };
}

// ─── Activity ───────────────────────────────────────────────────────────────

export async function activity(f: { targetType?: string | null; offset?: number; limit?: number }) {
  let q = client().from("activity").select("*", { count: "exact" });
  if (f.targetType) q = q.eq("target_type", f.targetType);
  const off = f.offset ?? 0;
  const { data, count, error } = await q.order("created_at", { ascending: false }).range(off, off + (f.limit ?? 50) - 1);
  if (error) throw new CrmError(error.message);
  return { rows: data ?? [], total: count ?? 0 };
}

// ─── Connections (manual status in Phase 0) ─────────────────────────────────

export const CONNECTION_STATUSES = ["connected", "degraded", "down", "not_configured"] as const;

export async function listConnections() {
  const { data, error } = await client().from("connections").select("*").order("sort");
  if (error) throw new CrmError(error.message);
  return { rows: data ?? [], updatedAt: now() };
}

export async function updateConnection(name: string, patch: { status?: string; note?: string }) {
  const who = actor();
  const s = client();
  const { data: cur, error } = await s.from("connections").select("*").eq("name", name).maybeSingle();
  if (error) throw new CrmError(error.message);
  if (!cur) throw new CrmError("Connection not found.", 404);
  const upd: Record<string, unknown> = { updated_by: who.name, updated_at: now() };
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  if (patch.status !== undefined) {
    if (!(CONNECTION_STATUSES as readonly string[]).includes(patch.status)) throw new CrmError("Unknown status.", 400);
    upd.status = patch.status;
    if (patch.status !== cur.status) changes.status = { from: cur.status, to: patch.status };
  }
  if (patch.note !== undefined) {
    upd.note = patch.note.trim() || null;
    if ((upd.note ?? null) !== (cur.note ?? null)) changes.note = { from: cur.note, to: upd.note };
  }
  const { data, error: uErr } = await s.from("connections").update(upd).eq("name", name).select("*").single();
  if (uErr) throw new CrmError(uErr.message);
  if (Object.keys(changes).length) {
    const what = changes.status ? `set ${cur.label} to ${String(patch.status).replace("_", " ")}` : `updated the note on ${cur.label}`;
    await logActivity({ entityType: "connection", action: "updated", summary: `${who.name} ${what}`, changes });
  }
  // A down connection is itself an exception (spec §4); route "immediate".
  if (changes.status && patch.status === "down") {
    await raiseException({ title: `${cur.label} is down`, detail: (upd.note as string | null) ?? "Marked down on the Connections page.", sourceId: `connection:${name}`, severity: "high", immediate: true });
  }
  if (changes.status && patch.status === "connected") await clearException(`connection:${name}`, `${cur.label} marked connected`);
  return data;
}

// ─── Break-glass alarm (spec §3) ────────────────────────────────────────────

export async function breakGlassUsed(info: { ip: string | null; userAgent: string | null }) {
  const when = new Date().toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" });
  const detail = `Someone signed in with the old shared password at ${when} CT${info.ip ? ` from ${info.ip}` : ""}. If this wasn't you, change DASHBOARD_PASSWORD in Netlify now.`;
  try {
    await logActivity({ entityType: "session", action: "break_glass_login", summary: "Signed in with the break-glass password", changes: { ip: info.ip, user_agent: info.userAgent } });
    await raiseException({ title: "Break-glass password was used", detail, sourceId: `break-glass:${Date.now()}`, severity: "high", immediate: false });
  } catch (e) {
    console.error("[auth] break-glass log failed", e);
  }
  await sendAlert({ title: "Break-glass password was used", message: detail, severity: "high" });
}
