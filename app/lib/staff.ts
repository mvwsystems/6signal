import { db } from "./db";
import { currentActor } from "./actor";
import { CrmError, logActivity } from "./crm";
import { raiseException } from "./commandCenter";

// ─────────────────────────────────────────────────────────────────────────────
// AI staff shared base (AI staff blueprint, "Shared base: build this first"):
// the roster (agents), the run log (agent_runs) and versioned playbooks
// (agent_playbooks). Tasks, approvals and the activity log are the existing
// Command Center tables; nothing here copies them.
//
// Rules enforced here, not in the UI:
//   - A scheduled or event run only starts while its agent is switched on,
//     and never once its monthly spend cap is used up.
//   - A failed run raises an "Agent job failed" exception on Today (deduped
//     per agent while one is open).
//   - Switching an agent on, auto-send and spend caps are Matt's (owner) only.
//     Anyone signed in can switch one off; stopping is always safe.
//   - Anyone can draft a playbook version; only Matt can approve one, and only
//     an approved version can be active (the table enforces it too).
// ─────────────────────────────────────────────────────────────────────────────

export const DEPARTMENTS = ["command", "growth", "revenue_risk", "delivery"] as const;
export const AGENT_STATUSES = ["not_started", "building", "active", "paused", "retired"] as const;
export const RUN_STATUSES = ["running", "succeeded", "failed", "cancelled"] as const;
const TRIGGERS = ["schedule", "manual", "event"] as const;

export interface Agent {
  key: string; name: string; role: string; department: (typeof DEPARTMENTS)[number]; job: string | null; runs_on: string | null;
  schedule: string | null; gate: string | null; phase: string | null; status: (typeof AGENT_STATUSES)[number]; enabled: boolean;
  auto_send: boolean; monthly_cap_usd: number | null; owner: string; playbook_url: string | null; sort: number; created_at: string; updated_at: string;
}
export interface AgentRun {
  id: string; agent_key: string; job: string | null; trigger: string; status: (typeof RUN_STATUSES)[number]; started_at: string; ended_at: string | null;
  result: string | null; items_created: number; rows_written: number; cost_usd: number; error: string | null; playbook_version: number | null;
}
export interface Playbook {
  id: string; agent_key: string; version: number; title: string | null; content: string; change_note: string | null;
  created_by: string; approved_by: string | null; approved_at: string | null; active: boolean; created_at: string;
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
function ownerOnly(what: string) {
  if (actor().role !== "owner") throw new CrmError(`Only Matt can ${what}.`, 403);
}
const now = () => new Date().toISOString();

// Until the staff migration is applied the tables don't exist; say that
// plainly instead of a raw database error.
const MISSING = /does not exist|could not find the table|schema cache/i;
function check(error: { message: string; code?: string } | null) {
  if (!error) return;
  if (error.code === "42P01" || error.code === "PGRST205" || MISSING.test(error.message)) {
    throw new CrmError("The staff tables aren't set up yet. Apply supabase/migrations/20261128_staff_base.sql first.", 503);
  }
  throw new CrmError(error.message);
}

async function getAgent(key: string): Promise<Agent> {
  const { data, error } = await client().from("agents").select("*").eq("key", key).maybeSingle();
  check(error);
  if (!data) throw new CrmError(`No agent called ${key}.`, 404);
  return data as Agent;
}

// Start of the current week (Monday) and month, in Matt's time zone.
function periodStarts(at = new Date()) {
  const ct = new Date(at.toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const offset = at.getTime() - ct.getTime();
  const dayStart = new Date(ct.getFullYear(), ct.getMonth(), ct.getDate());
  const week = new Date(dayStart.getTime() - ((dayStart.getDay() + 6) % 7) * 86400000);
  const month = new Date(ct.getFullYear(), ct.getMonth(), 1);
  return { week: new Date(week.getTime() + offset).toISOString(), month: new Date(month.getTime() + offset).toISOString() };
}

async function spendSince(key: string, since: string): Promise<number> {
  const { data, error } = await client().from("agent_runs").select("cost_usd").eq("agent_key", key).gte("started_at", since).limit(5000);
  check(error);
  return (data ?? []).reduce((sum, r) => sum + Number(r.cost_usd || 0), 0);
}

// ─── The board ──────────────────────────────────────────────────────────────

export async function staffBoard() {
  const s = client();
  const { week, month } = periodStarts();
  const [agents, runs, monthRuns, playbooks] = await Promise.all([
    s.from("agents").select("*").order("sort"),
    s.from("agent_runs").select("*").order("started_at", { ascending: false }).limit(50),
    s.from("agent_runs").select("agent_key, status, cost_usd, started_at").gte("started_at", month).limit(5000),
    s.from("agent_playbooks").select("*").order("agent_key").order("version", { ascending: false }).limit(500),
  ]);
  check(agents.error); check(runs.error); check(monthRuns.error); check(playbooks.error);
  const recent = (runs.data ?? []) as AgentRun[];
  const stats: Record<string, { weekRuns: number; weekFailed: number; weekSpend: number; monthSpend: number }> = {};
  for (const r of (monthRuns.data ?? []) as Pick<AgentRun, "agent_key" | "status" | "cost_usd" | "started_at">[]) {
    const st = (stats[r.agent_key] ??= { weekRuns: 0, weekFailed: 0, weekSpend: 0, monthSpend: 0 });
    st.monthSpend += Number(r.cost_usd || 0);
    if (r.started_at >= week) {
      st.weekRuns += 1;
      st.weekSpend += Number(r.cost_usd || 0);
      if (r.status === "failed") st.weekFailed += 1;
    }
  }
  // Last run per agent comes from its own query, so an agent that ran long ago
  // still shows when, not just agents in the latest 50.
  const lastRuns = await Promise.all(((agents.data ?? []) as Agent[]).map(async (a) => {
    const { data } = await s.from("agent_runs").select("*").eq("agent_key", a.key).order("started_at", { ascending: false }).limit(1);
    return [a.key, (data?.[0] as AgentRun | undefined) ?? null] as const;
  }));
  const last = Object.fromEntries(lastRuns);
  const books = (playbooks.data ?? []) as Playbook[];
  return {
    updatedAt: now(),
    me: { role: actor().role, canApprove: actor().role === "owner" },
    agents: ((agents.data ?? []) as Agent[]).map((a) => ({
      ...a,
      lastRun: last[a.key] ?? null,
      activePlaybook: books.find((b) => b.agent_key === a.key && b.active)?.version ?? null,
      draftPlaybooks: books.filter((b) => b.agent_key === a.key && !b.approved_by).length,
      ...(stats[a.key] ?? { weekRuns: 0, weekFailed: 0, weekSpend: 0, monthSpend: 0 }),
    })),
    runs: recent,
    playbooks: books,
  };
}

// ─── Roster switches ────────────────────────────────────────────────────────

export async function updateAgent(key: string, patch: { enabled?: boolean; status?: string; auto_send?: boolean; monthly_cap_usd?: number | null; schedule?: string | null; playbook_url?: string | null }) {
  const who = actor();
  const a = await getAgent(key);
  const next: Partial<Agent> = {};
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const set = <K extends keyof Agent>(k: K, v: Agent[K]) => { if (a[k] !== v) { next[k] = v; changes[k] = { from: a[k], to: v }; } };

  if (patch.enabled !== undefined) {
    if (patch.enabled) {
      ownerOnly("switch an agent on");
      if (a.status === "retired") throw new CrmError(`${a.name} is retired. Change its status first.`, 400);
    }
    set("enabled", !!patch.enabled);
  }
  if (patch.auto_send !== undefined) { ownerOnly("change auto-send"); set("auto_send", !!patch.auto_send); }
  if (patch.monthly_cap_usd !== undefined) {
    ownerOnly("change a spend cap");
    const cap = patch.monthly_cap_usd === null ? null : Number(patch.monthly_cap_usd);
    if (cap !== null && (!Number.isFinite(cap) || cap < 0)) throw new CrmError("The cap must be a dollar amount of 0 or more.", 400);
    set("monthly_cap_usd", cap);
  }
  if (patch.status !== undefined) {
    if (!(AGENT_STATUSES as readonly string[]).includes(patch.status)) throw new CrmError(`Status must be one of ${AGENT_STATUSES.join(", ")}.`, 400);
    if (patch.status === "active" || patch.status === "retired") ownerOnly(`mark an agent ${patch.status}`);
    set("status", patch.status as Agent["status"]);
    // Pausing or retiring also switches it off, so nothing scheduled starts.
    if ((patch.status === "paused" || patch.status === "retired") && a.enabled) set("enabled", false);
  }
  if (patch.schedule !== undefined) set("schedule", patch.schedule?.trim() || null);
  if (patch.playbook_url !== undefined) set("playbook_url", patch.playbook_url?.trim() || null);

  if (!Object.keys(next).length) return a;
  const { data, error } = await client().from("agents").update({ ...next, updated_at: now() }).eq("key", key).select("*").single();
  check(error);
  const said = Object.entries(changes).map(([k, c]) => `${k.replace(/_/g, " ")} ${String(c.from)} → ${String(c.to)}`).join(", ");
  await logActivity({ entityType: "agent", action: "updated", summary: `${who.name} changed ${a.name}: ${said}`, changes, service: "AI staff" });
  return data as Agent;
}

// ─── Run log ────────────────────────────────────────────────────────────────

export async function startRun(input: { agent_key?: string; job?: string; trigger?: string; playbook_version?: number | null; meta?: Record<string, unknown> }) {
  const who = actor();
  if (!input.agent_key) throw new CrmError("agent_key is required", 400);
  const a = await getAgent(input.agent_key);
  const trigger = (TRIGGERS as readonly string[]).includes(input.trigger ?? "") ? input.trigger! : "schedule";
  if (a.status === "retired") throw new CrmError(`${a.name} is retired.`, 409);
  if (!a.enabled && trigger !== "manual") throw new CrmError(`${a.name} is switched off, so nothing scheduled runs.`, 409);
  if (a.monthly_cap_usd !== null) {
    const spent = await spendSince(a.key, periodStarts().month);
    if (spent >= Number(a.monthly_cap_usd)) {
      await raiseException({ title: `${a.name} hit its monthly spend cap`, detail: `$${spent.toFixed(2)} of $${Number(a.monthly_cap_usd).toFixed(2)} used this month. Runs are refused until the cap is raised or the month turns.`, sourceId: `${a.key}/cap`, severity: "medium", tier: "red" });
      throw new CrmError(`${a.name} has used its $${Number(a.monthly_cap_usd).toFixed(2)} cap for this month.`, 409);
    }
  }
  let version = input.playbook_version ?? null;
  if (version === null) {
    const { data } = await client().from("agent_playbooks").select("version").eq("agent_key", a.key).eq("active", true).maybeSingle();
    version = (data?.version as number | undefined) ?? null;
  }
  const { data, error } = await client().from("agent_runs")
    .insert({ agent_key: a.key, job: input.job?.trim() || null, trigger, playbook_version: version, meta: { ...(input.meta ?? {}), started_by: who.name } })
    .select("*").single();
  check(error);
  return data as AgentRun;
}

export async function finishRun(id: string | undefined, input: { status?: string; result?: string; items_created?: number; rows_written?: number; cost_usd?: number; error?: string }) {
  actor();
  if (!id) throw new CrmError("id is required", 400);
  const status = input.status ?? "succeeded";
  if (!["succeeded", "failed", "cancelled"].includes(status)) throw new CrmError("status must be succeeded, failed or cancelled.", 400);
  const count = (v: unknown, what: string) => {
    if (v === undefined) return 0;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) throw new CrmError(`${what} must be 0 or more.`, 400);
    return n;
  };
  const s = client();
  const { data: run, error: rErr } = await s.from("agent_runs").select("*").eq("id", id).maybeSingle();
  check(rErr);
  if (!run) throw new CrmError("Run not found.", 404);
  // Only a running run can be finished, so a retry can't overwrite the result.
  const { data, error } = await s.from("agent_runs").update({
    status, ended_at: now(), result: input.result?.trim() || null, error: input.error?.trim() || null,
    items_created: Math.round(count(input.items_created, "items_created")), rows_written: Math.round(count(input.rows_written, "rows_written")),
    cost_usd: count(input.cost_usd, "cost_usd"),
  }).eq("id", id).eq("status", "running").select("*").maybeSingle();
  check(error);
  if (!data) throw new CrmError("This run was already finished.", 409);
  const r = data as AgentRun;
  const a = await getAgent(r.agent_key);
  const what = r.job ? `${a.name} · ${r.job}` : a.name;
  if (status === "failed") {
    await raiseException({ title: `Agent job failed: ${what}`, detail: r.error ?? r.result ?? "No error message was given.", sourceId: `${a.key}/failed`, severity: "medium", tier: "yellow" });
  }
  await logActivity({
    entityType: "agent_run", entityId: r.id, runId: r.id, action: `run_${status}`, service: "AI staff",
    summary: `${what} ${status === "succeeded" ? "finished" : status}${r.result ? `: ${r.result}` : ""}${r.items_created ? ` (${r.items_created} items)` : ""}`,
  });
  return r;
}

// ─── Playbooks ──────────────────────────────────────────────────────────────

export async function addPlaybook(input: { agent_key?: string; title?: string; content?: string; change_note?: string }) {
  const who = actor();
  if (!input.agent_key) throw new CrmError("agent_key is required", 400);
  const content = input.content?.trim();
  if (!content) throw new CrmError("The playbook needs some content.", 400);
  const a = await getAgent(input.agent_key);
  const s = client();
  const { data: top } = await s.from("agent_playbooks").select("version").eq("agent_key", a.key).order("version", { ascending: false }).limit(1);
  const version = ((top?.[0]?.version as number | undefined) ?? 0) + 1;
  const { data, error } = await s.from("agent_playbooks")
    .insert({ agent_key: a.key, version, title: input.title?.trim() || null, content, change_note: input.change_note?.trim() || null, created_by: who.name })
    .select("*").single();
  check(error);
  await logActivity({ entityType: "playbook", entityId: data.id, action: "drafted", service: "AI staff", summary: `${who.name} drafted ${a.name}'s playbook v${version}${input.change_note?.trim() ? `: ${input.change_note.trim()}` : ""}` });
  return data as Playbook;
}

export async function approvePlaybook(id: string | undefined) {
  const who = actor();
  ownerOnly("approve a playbook");
  if (!id) throw new CrmError("id is required", 400);
  const s = client();
  const { data: pb, error } = await s.from("agent_playbooks").select("*").eq("id", id).maybeSingle();
  check(error);
  if (!pb) throw new CrmError("Playbook not found.", 404);
  if (pb.active) return pb as Playbook;
  // Turn the old version off first: the one-active index refuses two at once.
  const off = await s.from("agent_playbooks").update({ active: false }).eq("agent_key", pb.agent_key).eq("active", true);
  check(off.error);
  const { data, error: uErr } = await s.from("agent_playbooks")
    .update({ approved_by: pb.approved_by ?? who.name, approved_at: pb.approved_at ?? now(), active: true })
    .eq("id", id).select("*").single();
  check(uErr);
  const a = await getAgent(pb.agent_key);
  await logActivity({ entityType: "playbook", entityId: id, action: "approved", service: "AI staff", summary: `${who.name} approved ${a.name}'s playbook v${pb.version}; it is now the active one` });
  return data as Playbook;
}
