import { db } from "./db";
import { currentActor } from "./actor";
import { CrmError, logActivity, hitList } from "./crm";
import type { Role } from "./dashboard-auth";

// ─────────────────────────────────────────────────────────────────────────────
// Command Center Phase 0: Items, Approvals, tiers, Activity, Today.
//
// Everything that changes the outside world goes through perform(actionKey).
// Each registered action has a tier:
//   Green  → runs at once for either account, and is logged.
//   Yellow → creates a pending Approval Item; runs only after the owner
//            approves; then either account may run it.
//   Red    → same, but only the owner account can run it, even once approved.
//            The operator never sees a Run button for a Red item.
// Approving and rejecting is the owner's alone. Later phases (campaign
// launch, follow-up sends, reply drafts) register their actions here, so the
// gate is in one place and cannot be skipped from the UI.
// ─────────────────────────────────────────────────────────────────────────────

export const TIERS = ["green", "yellow", "red"] as const;
export type Tier = (typeof TIERS)[number];

export interface ActionDef {
  tier: Tier;
  label: string;
  run: (payload: Record<string, unknown>) => Promise<string>;
}

const ACTIONS: Record<string, ActionDef> = {};

export function registerAction(key: string, def: ActionDef) {
  ACTIONS[key] = def;
}

// Harmless actions for the QA tier test: running one only writes an activity
// entry, so the gate can be proven on live without touching any real data.
for (const tier of TIERS) {
  registerAction(`check.${tier}`, {
    tier,
    label: `${tier[0].toUpperCase()}${tier.slice(1)} tier check`,
    run: async () => `${tier[0].toUpperCase()}${tier.slice(1)} tier check ran. Nothing else was changed.`,
  });
}

export function actionList() {
  return Object.entries(ACTIONS).map(([key, a]) => ({ key, tier: a.tier, label: a.label }));
}

export const canDecide = (role: Role) => role === "owner";
export const canExecute = (role: Role, tier: Tier) => (tier === "red" ? role === "owner" : true);

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

export interface Item {
  id: string; kind: "task" | "approval" | "report"; title: string; body: string | null; tier: Tier; status: string;
  assignee: Role; due_at: string | null; action: string | null; payload: Record<string, unknown> | null;
  entity_type: string | null; entity_id: string | null; created_by: string; decided_by: string | null; decided_at: string | null;
  decision_note: string | null; executed_by: string | null; executed_at: string | null; result: string | null;
  created_at: string; updated_at: string;
}

const now = () => new Date().toISOString();
const tierName = (t: Tier) => `${t[0].toUpperCase()}${t.slice(1)}`;

// ─── Gate ───────────────────────────────────────────────────────────────────

export async function perform(key: string, payload: Record<string, unknown> = {}, meta: { title?: string; body?: string; entityType?: string; entityId?: string } = {}) {
  const def = ACTIONS[key];
  if (!def) throw new CrmError(`Unknown action: ${key}`, 400);
  const who = actor();
  if (def.tier === "green") {
    const result = await def.run(payload);
    await logActivity({ entityType: meta.entityType ?? "action", entityId: meta.entityId ?? null, action: "executed", summary: `${def.label}: ${result}`, changes: { action: key, tier: "green", payload } });
    return { ran: true, result };
  }
  const { data, error } = await client().from("cc_items").insert({
    kind: "approval", title: meta.title || def.label, body: meta.body ?? null, tier: def.tier, status: "pending",
    assignee: "owner", action: key, payload, entity_type: meta.entityType ?? null, entity_id: meta.entityId ?? null, created_by: who.name,
  }).select("*").single();
  if (error) throw new CrmError(error.message);
  await logActivity({ entityType: "item", entityId: data.id, action: "approval_requested", summary: `${who.name} asked for approval: ${data.title} (${tierName(def.tier)})` });
  return { ran: false, item: data as Item };
}

export async function decide(id: string, decision: "approve" | "reject", note?: string) {
  const who = actor();
  if (!canDecide(who.role)) throw new CrmError("Only the owner can approve or reject.", 403);
  const status = decision === "approve" ? "approved" : "rejected";
  const { data, error } = await client().from("cc_items")
    .update({ status, decided_by: who.name, decided_at: now(), decision_note: note?.trim() || null, updated_at: now() })
    .eq("id", id).eq("kind", "approval").eq("status", "pending").select("*").maybeSingle();
  if (error) throw new CrmError(error.message);
  if (!data) throw new CrmError("This approval was already decided or no longer exists.", 409);
  await logActivity({ entityType: "item", entityId: id, action: status, summary: `${who.name} ${status} "${data.title}"${note?.trim() ? `: ${note.trim()}` : ""}` });
  return data as Item;
}

export async function execute(id: string) {
  const who = actor();
  const s = client();
  const { data: item, error } = await s.from("cc_items").select("*").eq("id", id).maybeSingle();
  if (error) throw new CrmError(error.message);
  if (!item || item.kind !== "approval") throw new CrmError("Approval not found.", 404);
  if (item.status === "pending") throw new CrmError("This needs approval before it can run.", 409);
  if (item.status !== "approved") throw new CrmError(`This can't run: it is ${item.status}.`, 409);
  if (!canExecute(who.role, item.tier)) throw new CrmError("Red actions can only be run by the owner.", 403);
  const def = item.action ? ACTIONS[item.action] : undefined;
  if (!def) throw new CrmError(`This action (${item.action}) is no longer available.`, 400);
  // Claim it first so a double click or a second tab can't run it twice.
  const { data: claimed, error: cErr } = await s.from("cc_items").update({ status: "executing", updated_at: now() })
    .eq("id", id).eq("status", "approved").select("id").maybeSingle();
  if (cErr) throw new CrmError(cErr.message);
  if (!claimed) throw new CrmError("This is already running or has run.", 409);
  let status = "executed";
  let result: string;
  try {
    result = await def.run(item.payload ?? {});
  } catch (e) {
    status = "failed";
    result = e instanceof Error ? e.message : String(e);
  }
  const { data: done, error: dErr } = await s.from("cc_items")
    .update({ status, result, executed_by: who.name, executed_at: now(), updated_at: now() }).eq("id", id).select("*").single();
  if (dErr) throw new CrmError(dErr.message);
  await logActivity({ entityType: "item", entityId: id, action: status, summary: `${who.name} ran "${item.title}": ${status === "executed" ? result : `failed (${result})`}` });
  return done as Item;
}

// ─── Items (tasks and reports) ─────────────────────────────────────────────

export async function listItems(f: { kind?: string | null; status?: string | null; offset?: number; limit?: number }) {
  let q = client().from("cc_items").select("*", { count: "exact" });
  if (f.kind) q = q.eq("kind", f.kind);
  if (f.status === "active") q = q.in("status", ["open", "pending", "approved", "executing"]);
  else if (f.status === "closed") q = q.in("status", ["done", "dismissed", "rejected", "executed", "failed"]);
  else if (f.status) q = q.eq("status", f.status);
  const off = f.offset ?? 0;
  const { data, count, error } = await q.order("created_at", { ascending: false }).range(off, off + (f.limit ?? 50) - 1);
  if (error) throw new CrmError(error.message);
  return { rows: (data ?? []) as Item[], total: count ?? 0 };
}

export async function createItem(input: { kind?: string; title?: string; body?: string; due_at?: string | null; assignee?: string; entityType?: string; entityId?: string }) {
  const who = actor();
  const title = input.title?.trim();
  if (!title) throw new CrmError("Give the item a title.", 400);
  const kind = input.kind === "report" ? "report" : "task";
  const assignee = input.assignee === "owner" ? "owner" : input.assignee === "operator" ? "operator" : who.role;
  let due: string | null = null;
  if (input.due_at) {
    const d = new Date(input.due_at);
    if (Number.isNaN(d.getTime())) throw new CrmError("That due date isn't valid.", 400);
    due = d.toISOString();
  }
  const { data, error } = await client().from("cc_items").insert({
    kind, title, body: input.body?.trim() || null, tier: "green", status: "open", assignee, due_at: due,
    entity_type: input.entityType ?? null, entity_id: input.entityId ?? null, created_by: who.name,
  }).select("*").single();
  if (error) throw new CrmError(error.message);
  await logActivity({ entityType: "item", entityId: data.id, action: "created", summary: `${who.name} added ${kind === "report" ? "a report" : "a task"}: ${title}` });
  return data as Item;
}

export async function updateItem(id: string, patch: { status?: string; title?: string; body?: string; due_at?: string | null; assignee?: string }) {
  const who = actor();
  const s = client();
  const { data: item, error } = await s.from("cc_items").select("*").eq("id", id).maybeSingle();
  if (error) throw new CrmError(error.message);
  if (!item) throw new CrmError("Item not found.", 404);
  if (item.kind === "approval") throw new CrmError("Approvals change only by approving, rejecting or running them.", 400);
  const upd: Record<string, unknown> = { updated_at: now() };
  if (patch.status !== undefined) {
    if (!["open", "done", "dismissed"].includes(patch.status)) throw new CrmError("Status must be open, done or dismissed.", 400);
    upd.status = patch.status;
  }
  if (patch.title !== undefined) {
    if (!patch.title.trim()) throw new CrmError("Title can't be empty.", 400);
    upd.title = patch.title.trim();
  }
  if (patch.body !== undefined) upd.body = patch.body.trim() || null;
  if (patch.assignee !== undefined) {
    if (!["owner", "operator"].includes(patch.assignee)) throw new CrmError("Assignee must be owner or operator.", 400);
    upd.assignee = patch.assignee;
  }
  if (patch.due_at !== undefined) {
    if (patch.due_at === null || patch.due_at === "") upd.due_at = null;
    else {
      const d = new Date(patch.due_at);
      if (Number.isNaN(d.getTime())) throw new CrmError("That due date isn't valid.", 400);
      upd.due_at = d.toISOString();
    }
  }
  const { data, error: uErr } = await s.from("cc_items").update(upd).eq("id", id).select("*").single();
  if (uErr) throw new CrmError(uErr.message);
  const what = upd.status === "done" ? "completed" : upd.status === "dismissed" ? "dismissed" : upd.status === "open" ? "reopened" : "edited";
  await logActivity({ entityType: "item", entityId: id, action: what, summary: `${who.name} ${what} "${data.title}"` });
  return data as Item;
}

// ─── Activity ───────────────────────────────────────────────────────────────

export async function activity(f: { entityType?: string | null; offset?: number; limit?: number }) {
  let q = client().from("crm_activity").select("id, entity_type, entity_id, action, summary, actor, created_at", { count: "exact" });
  if (f.entityType) q = q.eq("entity_type", f.entityType);
  const off = f.offset ?? 0;
  const { data, count, error } = await q.order("created_at", { ascending: false }).range(off, off + (f.limit ?? 50) - 1);
  if (error) throw new CrmError(error.message);
  return { rows: data ?? [], total: count ?? 0 };
}

// ─── Today ──────────────────────────────────────────────────────────────────

// `until` is the end of the signed-in person's day (sent by the browser, so
// "today" means their day, not the server's UTC day).
export async function today(until: string) {
  const who = actor();
  const s = client();
  const [approvals, tasks, undated, crm, recent] = await Promise.all([
    s.from("cc_items").select("*").eq("kind", "approval").in("status", ["pending", "approved", "executing"]).order("created_at"),
    s.from("cc_items").select("*").in("kind", ["task", "report"]).eq("status", "open").not("due_at", "is", null).lte("due_at", until).order("due_at"),
    s.from("cc_items").select("*").in("kind", ["task", "report"]).eq("status", "open").is("due_at", null).order("created_at", { ascending: false }).limit(10),
    hitList(until),
    s.from("crm_activity").select("id, entity_type, action, summary, actor, created_at").order("created_at", { ascending: false }).limit(15),
  ]);
  for (const r of [approvals, tasks, undated, recent]) if (r.error) throw new CrmError(r.error.message);
  return {
    me: { role: who.role, name: who.name, canDecide: canDecide(who.role) },
    approvals: (approvals.data ?? []) as Item[],
    due: (tasks.data ?? []) as Item[],
    undated: (undated.data ?? []) as Item[],
    followUps: crm.followUps,
    replies: crm.replies.length,
    activity: recent.data ?? [],
  };
}
