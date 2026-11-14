"use client";
import { useCallback, useEffect, useState } from "react";
import { T, alpha, BODY, DISP } from "./theme";

// ─────────────────────────────────────────────────────────────────────────────
// Command Center Phase 0: Today, Approvals, Tasks and Activity.
// Today is the home screen: what is waiting on a decision, what is due, the
// CRM follow-ups due, and what just happened. Approvals are the gate every
// outside-world action will pass through in later phases (campaigns, sends):
// the owner approves or rejects; Red actions can only be run by the owner, so
// the operator never sees a Run button for them. Mobile-first: every list is a
// stack of cards, no wide tables.
// ─────────────────────────────────────────────────────────────────────────────

export interface Me { role: "owner" | "operator"; name: string; ownerName: string; operatorName: string }

type Tier = "green" | "yellow" | "red";
interface Item {
  id: string; kind: "task" | "approval" | "report"; title: string; body: string | null; tier: Tier; status: string;
  assignee: "owner" | "operator"; due_at: string | null; action: string | null; payload: Record<string, unknown> | null;
  created_by: string; decided_by: string | null; decided_at: string | null; decision_note: string | null;
  executed_by: string | null; executed_at: string | null; result: string | null; created_at: string;
}
interface ActivityRow { id: string; entity_type: string; action: string; summary: string; actor: string | null; created_at: string }
interface FollowUp { id: string; content: string | null; scheduled_at: string; prospect: { company: string; contact_name: string | null; phone: string | null } | null }
interface TodayData {
  approvals: Item[]; due: Item[]; undated: Item[]; followUps: FollowUp[]; replies: number; activity: ActivityRow[];
}

const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, ...extra });
const btn = (primary?: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 36, padding: "0 14px", borderRadius: 6, cursor: "pointer", fontFamily: BODY, fontWeight: 500, fontSize: 14, whiteSpace: "nowrap",
  border: `1px solid ${primary ? T.brand : T.border}`, background: primary ? T.brand : "transparent", color: primary ? T.onBrand : T.text, ...extra,
});
const inputStyle: React.CSSProperties = { background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 14, padding: "8px 12px", borderRadius: 6, outline: "none", width: "100%" };
const muted: React.CSSProperties = { color: T.muted, fontFamily: BODY, fontSize: 13 };
const h2: React.CSSProperties = { fontFamily: BODY, fontSize: 15, fontWeight: 600, color: T.text, margin: "0 0 10px" };
const pill = (on: boolean): React.CSSProperties => ({
  fontFamily: BODY, fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap",
  border: `1px solid ${on ? T.brand : T.border}`, background: on ? T.brand : "transparent", color: on ? T.onBrand : T.textSub,
});

const TIER_HUE: Record<Tier, string> = { green: "#16a34a", yellow: "#d97706", red: "#dc2626" };
const TIER_HELP: Record<Tier, string> = {
  green: "Runs straight away and is logged.",
  yellow: "Needs the owner's approval, then either of you can run it.",
  red: "Needs the owner's approval, and only the owner can run it.",
};
function TierBadge({ tier }: { tier: Tier }) {
  const hue = TIER_HUE[tier];
  return <span className="dash-pill" style={{ fontSize: 12, padding: "2px 9px", borderRadius: 999, background: alpha(hue, 12), color: hue, border: `1px solid ${alpha(hue, 30)}`, whiteSpace: "nowrap" }}>{tier[0].toUpperCase() + tier.slice(1)}</span>;
}

async function api<X>(url: string, init?: RequestInit): Promise<X> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d as X;
}

function ErrorLine({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div style={card({ borderColor: alpha(T.danger, 40), color: T.danger, fontSize: 13, marginBottom: 12 })}>{msg}</div>;
}

const endOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.toISOString(); };
const fmtWhen = (s: string) => new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const fmtDay = (s: string) => new Date(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const isOverdue = (s: string | null) => !!s && new Date(s).getTime() < new Date(new Date().setHours(0, 0, 0, 0)).getTime();

export default function TodayTab({ me }: { me: Me }) {
  const [view, setView] = useState<"today" | "approvals" | "tasks" | "activity">("today");
  return (
    <div>
      <div role="tablist" aria-label="Command Center sections" style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {([["today", "Today"], ["approvals", "Approvals"], ["tasks", "Tasks"], ["activity", "Activity"]] as const).map(([id, l]) => (
          <button key={id} role="tab" aria-selected={view === id} className="dash-pill" style={pill(view === id)} onClick={() => setView(id)}>{l}</button>
        ))}
      </div>
      {view === "today" && <TodayView me={me} onOpen={setView} />}
      {view === "approvals" && <ApprovalsView me={me} />}
      {view === "tasks" && <TasksView me={me} />}
      {view === "activity" && <ActivityView />}
    </div>
  );
}

// ─── Today ───────────────────────────────────────────────────────────────────

function TodayView({ me, onOpen }: { me: Me; onOpen: (v: "approvals" | "tasks" | "activity") => void }) {
  const [data, setData] = useState<TodayData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    setErr(null);
    try { setData(await api<TodayData>(`/api/dashboard/cc/today?until=${encodeURIComponent(endOfToday())}`)); }
    catch (e) { setErr(`Couldn't load Today: ${(e as Error).message}`); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const pending = data?.approvals.filter((a) => a.status === "pending") ?? [];
  const overdue = data?.due.filter((t) => isOverdue(t.due_at)).length ?? 0;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: DISP, fontSize: 22, fontWeight: 600, color: T.text }}>{greet}, {me.name}</div>
        <div style={muted}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
      </div>
      <ErrorLine msg={err} />
      {!data && !err && <div style={muted}>Loading…</div>}
      {data && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
            <Stat label={me.role === "owner" ? "Waiting on your approval" : `Waiting on ${me.ownerName}`} value={pending.length} onClick={() => onOpen("approvals")} hot={pending.length > 0} />
            <Stat label="Tasks due today" value={data.due.length} note={overdue ? `${overdue} overdue` : undefined} onClick={() => onOpen("tasks")} hot={overdue > 0} />
            <Stat label="CRM follow-ups due" value={data.followUps.length} note={data.replies ? `${data.replies} replies to work` : undefined} />
          </div>

          <Section title="Approvals">
            {data.approvals.length === 0 ? <div style={muted}>Nothing waiting for approval.</div>
              : data.approvals.map((a) => <ApprovalCard key={a.id} item={a} me={me} onChanged={load} />)}
          </Section>

          <Section title="Due today and overdue">
            {data.due.length === 0 ? <div style={muted}>No tasks due today.</div>
              : data.due.map((t) => <TaskRow key={t.id} item={t} me={me} onChanged={load} />)}
          </Section>

          {data.undated.length > 0 && (
            <Section title="Open, no due date">
              {data.undated.map((t) => <TaskRow key={t.id} item={t} me={me} onChanged={load} />)}
            </Section>
          )}

          <Section title="CRM follow-ups due">
            {data.followUps.length === 0 ? <div style={muted}>No follow-ups due. Set one from any prospect's details in the CRM.</div>
              : data.followUps.map((f) => (
                <div key={f.id} style={card({ marginBottom: 8 })}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{f.prospect?.company ?? "Prospect"}</div>
                  <div style={muted}>{[f.content, f.prospect?.contact_name, f.prospect?.phone].filter(Boolean).join(" · ")}</div>
                  {isOverdue(f.scheduled_at) && <div style={{ ...muted, color: T.danger, marginTop: 4 }}>Was due {fmtDay(f.scheduled_at)}</div>}
                </div>
              ))}
            {data.followUps.length > 0 && <div style={{ ...muted, marginTop: 4 }}>Mark them done in CRM → Hit List.</div>}
          </Section>

          <Section title="Recent activity" action={<button style={btn(false, { height: 30, fontSize: 13 })} onClick={() => onOpen("activity")}>See all</button>}>
            <ActivityList rows={data.activity} />
          </Section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, note, onClick, hot }: { label: string; value: number; note?: string; onClick?: () => void; hot?: boolean }) {
  return (
    <button onClick={onClick} disabled={!onClick} style={{ ...card({ textAlign: "left", cursor: onClick ? "pointer" : "default", fontFamily: BODY }), background: hot ? T.brand : T.panel, color: hot ? T.onBrand : T.text, borderColor: hot ? T.brand : T.border }}>
      <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {note && <div style={{ fontSize: 12, opacity: 0.8 }}>{note}</div>}
    </button>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h2 style={h2}>{title}</h2>{action}
      </div>
      {children}
    </section>
  );
}

// ─── Approvals ───────────────────────────────────────────────────────────────

function ApprovalCard({ item, me, onChanged }: { item: Item; me: Me; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const isOwner = me.role === "owner";
  const act = async (op: "approve" | "reject" | "run") => {
    setBusy(true); setErr(null);
    try { await api("/api/dashboard/cc/approvals", { method: "POST", body: JSON.stringify({ op, id: item.id, note: note || undefined }) }); onChanged(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  const payload = item.payload && Object.keys(item.payload).length ? item.payload : null;
  const statusLine: Record<string, string> = {
    pending: "Waiting for approval", approved: "Approved, ready to run", rejected: "Rejected", executing: "Running…", executed: "Done", failed: "Failed",
  };
  return (
    <div style={card({ marginBottom: 10 })}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
        <TierBadge tier={item.tier} />
        <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{item.title}</span>
      </div>
      {item.body && <div style={{ fontSize: 14, color: T.textSub, margin: "4px 0" }}>{item.body}</div>}
      {payload && <pre style={{ fontSize: 12, color: T.textSub, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 8, overflowX: "auto", margin: "6px 0", whiteSpace: "pre-wrap" }}>{JSON.stringify(payload, null, 2)}</pre>}
      <div style={muted}>
        {statusLine[item.status] ?? item.status} · asked by {item.created_by}, {fmtWhen(item.created_at)}
        {item.decided_by && item.decided_at && <> · {item.status === "rejected" ? "rejected" : "approved"} by {item.decided_by}, {fmtWhen(item.decided_at)}</>}
      </div>
      {item.decision_note && <div style={{ ...muted, marginTop: 4 }}>Note: {item.decision_note}</div>}
      {item.result && <div style={{ fontSize: 13, marginTop: 6, color: item.status === "failed" ? T.danger : T.text }}>{item.result}</div>}
      <ErrorLine msg={err} />

      {item.status === "pending" && (isOwner ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <input aria-label="Note (optional)" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, flex: "1 1 180px", width: "auto" }} />
          <button style={btn(true)} disabled={busy} onClick={() => act("approve")}>Approve</button>
          <button style={btn(false)} disabled={busy} onClick={() => act("reject")}>Reject</button>
        </div>
      ) : <div style={{ ...muted, marginTop: 8 }}>Only {me.ownerName} can approve this.</div>)}

      {item.status === "approved" && (item.tier === "red" && !isOwner
        ? <div style={{ ...muted, marginTop: 8 }}>Red action: only {me.ownerName} can run it.</div>
        : <div style={{ marginTop: 10 }}><button style={btn(true)} disabled={busy} onClick={() => act("run")}>{busy ? "Running…" : "Run it"}</button></div>)}
    </div>
  );
}

function ApprovalsView({ me }: { me: Me }) {
  const [status, setStatus] = useState<"active" | "closed">("active");
  const [rows, setRows] = useState<Item[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const load = useCallback(async () => {
    setErr(null);
    try { setRows((await api<{ rows: Item[] }>(`/api/dashboard/cc/approvals?status=${status}`)).rows); }
    catch (e) { setErr(`Couldn't load approvals: ${(e as Error).message}`); }
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const check = async (tier: Tier) => {
    setMsg(null); setErr(null);
    try {
      const r = await api<{ ran: boolean; result?: string }>("/api/dashboard/cc/approvals", { method: "POST", body: JSON.stringify({ op: "check", tier }) });
      setMsg(r.ran ? `Green check ran straight away: ${r.result}` : `${tier === "yellow" ? "Yellow" : "Red"} check is waiting for approval below.`);
      if (status !== "active") setStatus("active"); else load();
    } catch (e) { setErr((e as Error).message); }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button className="dash-pill" style={pill(status === "active")} onClick={() => setStatus("active")}>Open</button>
        <button className="dash-pill" style={pill(status === "closed")} onClick={() => setStatus("closed")}>History</button>
      </div>
      <ErrorLine msg={err} />
      {!rows && !err && <div style={muted}>Loading…</div>}
      {rows && rows.length === 0 && <div style={{ ...muted, marginBottom: 16 }}>{status === "active" ? "Nothing waiting for approval." : "No decided approvals yet."}</div>}
      {rows?.map((a) => <ApprovalCard key={a.id} item={a} me={me} onChanged={load} />)}

      <div style={card({ marginTop: 24 })}>
        <h2 style={h2}>Tier check</h2>
        <div style={{ ...muted, marginBottom: 10 }}>Tests the approval gate with a harmless action that only writes an activity entry.</div>
        {(["green", "yellow", "red"] as const).map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
            <button style={btn(false, { minWidth: 170 })} onClick={() => check(t)}>Request {t[0].toUpperCase() + t.slice(1)} check</button>
            <span style={muted}>{TIER_HELP[t]}</span>
          </div>
        ))}
        {msg && <div style={{ fontSize: 13, color: T.text, marginTop: 6 }}>{msg}</div>}
      </div>
    </div>
  );
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

function TaskRow({ item, me, onChanged }: { item: Item; me: Me; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = async (status: "open" | "done" | "dismissed") => {
    setBusy(true); setErr(null);
    try { await api("/api/dashboard/cc/items", { method: "PATCH", body: JSON.stringify({ id: item.id, status }) }); onChanged(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  const who = item.assignee === "owner" ? me.ownerName : me.operatorName;
  const done = item.status !== "open";
  return (
    <div style={card({ marginBottom: 8, opacity: done ? 0.7 : 1 })}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: T.text, textDecoration: item.status === "done" ? "line-through" : "none" }}>{item.title}</div>
          {item.body && <div style={{ fontSize: 13, color: T.textSub, marginTop: 2 }}>{item.body}</div>}
          <div style={{ ...muted, marginTop: 4 }}>
            {item.kind === "report" ? "Report" : "Task"} for {who}
            {item.due_at && <span style={{ color: !done && isOverdue(item.due_at) ? T.danger : undefined }}> · due {fmtDay(item.due_at)}</span>}
            {item.status === "done" && " · done"}{item.status === "dismissed" && " · dismissed"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {!done && <button style={btn(true, { height: 32 })} disabled={busy} onClick={() => set("done")}>Done</button>}
          {!done && <button style={btn(false, { height: 32 })} disabled={busy} onClick={() => set("dismissed")}>Dismiss</button>}
          {done && <button style={btn(false, { height: 32 })} disabled={busy} onClick={() => set("open")}>Reopen</button>}
        </div>
      </div>
      <ErrorLine msg={err} />
    </div>
  );
}

function TasksView({ me }: { me: Me }) {
  const [status, setStatus] = useState<"open" | "closed">("open");
  const [rows, setRows] = useState<Item[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", body: "", due: "", assignee: me.role as string });
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    setErr(null);
    try {
      const st = status === "open" ? "open" : "closed";
      const [tasks, reports] = await Promise.all([
        api<{ rows: Item[] }>(`/api/dashboard/cc/items?kind=task&status=${st}`),
        api<{ rows: Item[] }>(`/api/dashboard/cc/items?kind=report&status=${st}`),
      ]);
      setRows([...tasks.rows, ...reports.rows].sort((a, b) => (a.due_at ?? "9") < (b.due_at ?? "9") ? -1 : 1));
    } catch (e) { setErr(`Couldn't load tasks: ${(e as Error).message}`); }
  }, [status]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!form.title.trim()) { setErr("Give the task a title."); return; }
    setSaving(true); setErr(null);
    try {
      // A date-only due date means the end of that day, in this browser's time zone.
      const due = form.due ? new Date(`${form.due}T23:59:00`).toISOString() : null;
      await api("/api/dashboard/cc/items", { method: "POST", body: JSON.stringify({ title: form.title, body: form.body, due_at: due, assignee: form.assignee }) });
      setForm({ title: "", body: "", due: "", assignee: form.assignee });
      setStatus("open"); load();
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={card({ marginBottom: 20 })}>
        <h2 style={h2}>Add a task</h2>
        <div style={{ display: "grid", gap: 8 }}>
          <input aria-label="Task title" placeholder="What needs doing" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          <textarea aria-label="Details" placeholder="Details (optional)" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label style={{ ...muted, display: "flex", alignItems: "center", gap: 6 }}>Due
              <input type="date" aria-label="Due date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} style={{ ...inputStyle, width: "auto" }} />
            </label>
            <label style={{ ...muted, display: "flex", alignItems: "center", gap: 6 }}>For
              <select aria-label="Assigned to" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} style={{ ...inputStyle, width: "auto" }}>
                <option value="owner">{me.ownerName}</option>
                <option value="operator">{me.operatorName}</option>
              </select>
            </label>
            <button style={btn(true)} disabled={saving} onClick={add}>{saving ? "Adding…" : "Add task"}</button>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <button className="dash-pill" style={pill(status === "open")} onClick={() => setStatus("open")}>Open</button>
        <button className="dash-pill" style={pill(status === "closed")} onClick={() => setStatus("closed")}>Done and dismissed</button>
      </div>
      <ErrorLine msg={err} />
      {!rows && !err && <div style={muted}>Loading…</div>}
      {rows && rows.length === 0 && <div style={muted}>{status === "open" ? "No open tasks." : "Nothing finished yet."}</div>}
      {rows?.map((t) => <TaskRow key={t.id} item={t} me={me} onChanged={load} />)}
    </div>
  );
}

// ─── Activity ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = { prospect: "Prospect", item: "Approval or task", import: "Import", action: "Action", merge: "Merge" };

function ActivityList({ rows }: { rows: ActivityRow[] }) {
  if (rows.length === 0) return <div style={muted}>No activity yet.</div>;
  return (
    <div style={card({ padding: 0 })}>
      {rows.map((r, i) => (
        <div key={r.id} style={{ padding: "10px 14px", borderTop: i ? `1px solid ${T.border}` : "none" }}>
          <div style={{ fontSize: 14, color: T.text }}>{r.summary}</div>
          <div style={muted}>{TYPE_LABEL[r.entity_type] ?? r.entity_type} · {r.actor && r.actor !== "dashboard" ? `${r.actor} · ` : ""}{fmtWhen(r.created_at)}</div>
        </div>
      ))}
    </div>
  );
}

function ActivityView() {
  const [type, setType] = useState<string>("");
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const load = useCallback(async (offset = 0) => {
    setErr(null);
    try {
      const r = await api<{ rows: ActivityRow[]; total: number }>(`/api/dashboard/cc/activity?offset=${offset}${type ? `&type=${type}` : ""}`);
      setRows((prev) => (offset ? [...(prev ?? []), ...r.rows] : r.rows));
      setTotal(r.total);
    } catch (e) { setErr(`Couldn't load activity: ${(e as Error).message}`); }
  }, [type]);
  useEffect(() => { setRows(null); load(0); }, [load]);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {([["", "All"], ["prospect", "Prospects"], ["item", "Approvals and tasks"], ["import", "Imports"], ["action", "Actions"]] as const).map(([id, l]) => (
          <button key={id} className="dash-pill" style={pill(type === id)} onClick={() => setType(id)}>{l}</button>
        ))}
      </div>
      <ErrorLine msg={err} />
      {!rows && !err && <div style={muted}>Loading…</div>}
      {rows && <ActivityList rows={rows} />}
      {rows && rows.length < total && (
        <div style={{ marginTop: 12 }}>
          <button style={btn()} disabled={more} onClick={async () => { setMore(true); await load(rows.length); setMore(false); }}>{more ? "Loading…" : `Show more (${(total - rows.length).toLocaleString()} left)`}</button>
        </div>
      )}
    </div>
  );
}
