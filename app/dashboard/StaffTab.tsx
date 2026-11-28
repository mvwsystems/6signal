"use client";
import { useCallback, useEffect, useState } from "react";
import { T, alpha, BODY } from "./theme";
import { SkeletonCards } from "./Skeleton";

// ─────────────────────────────────────────────────────────────────────────────
// Staff: the AI staff board (AI staff blueprint, shared base). Three views of
// the same data: Roster (every role by department, its switch, last run and
// this week's spend), Runs (the run log, newest first) and Playbooks (every
// version per agent; Matt approves one to make it active).
// Mobile-first like the other Command Center panels: stacked cards, every
// button has words on it.
// ─────────────────────────────────────────────────────────────────────────────

interface Run {
  id: string; agent_key: string; job: string | null; trigger: string; status: "running" | "succeeded" | "failed" | "cancelled";
  started_at: string; ended_at: string | null; result: string | null; items_created: number; rows_written: number; cost_usd: number; error: string | null; playbook_version: number | null;
}
interface Playbook {
  id: string; agent_key: string; version: number; title: string | null; content: string; change_note: string | null;
  created_by: string; approved_by: string | null; approved_at: string | null; active: boolean; created_at: string;
}
interface Agent {
  key: string; name: string; role: string; department: string; job: string | null; runs_on: string | null; schedule: string | null; gate: string | null;
  phase: string | null; status: string; enabled: boolean; auto_send: boolean; monthly_cap_usd: number | null; owner: string; playbook_url: string | null;
  lastRun: Run | null; activePlaybook: number | null; draftPlaybooks: number; weekRuns: number; weekFailed: number; weekSpend: number; monthSpend: number;
}
interface Board { updatedAt: string; me: { role: string; canApprove: boolean }; agents: Agent[]; runs: Run[]; playbooks: Playbook[] }

const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, ...extra });
const btn = (primary?: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 34, padding: "0 12px", borderRadius: 6, cursor: "pointer", fontFamily: BODY, fontWeight: 500, fontSize: 13, whiteSpace: "nowrap",
  border: `1px solid ${primary ? T.brand : T.border}`, background: primary ? T.brand : "transparent", color: primary ? T.onBrand : T.text, ...extra,
});
const inputStyle: React.CSSProperties = { background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 14, padding: "8px 12px", borderRadius: 6, outline: "none", width: "100%" };
const muted: React.CSSProperties = { color: T.muted, fontFamily: BODY, fontSize: 13 };
const h2: React.CSSProperties = { fontFamily: BODY, fontSize: 15, fontWeight: 600, color: T.text, margin: "0 0 10px" };
const pill = (on: boolean): React.CSSProperties => ({
  fontFamily: BODY, fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap",
  border: `1px solid ${on ? T.brand : T.border}`, background: on ? T.brand : "transparent", color: on ? T.onBrand : T.textSub,
});
function Badge({ text, hue }: { text: string; hue: string }) {
  return <span className="dash-pill" style={{ fontSize: 12, padding: "2px 9px", borderRadius: 999, background: alpha(hue, 12), color: hue, border: `1px solid ${alpha(hue, 30)}`, whiteSpace: "nowrap" }}>{text}</span>;
}

const DEPT_LABEL: Record<string, string> = { command: "Command", growth: "Growth", revenue_risk: "Revenue and risk", delivery: "Delivery" };
const STATUS_LABEL: Record<string, string> = { not_started: "Not started", building: "Building", active: "Active", paused: "Paused", retired: "Retired" };
const STATUS_HUE: Record<string, string> = { not_started: "#64748b", building: "#2563eb", active: "#16a34a", paused: "#d97706", retired: "#64748b" };
const RUN_LABEL: Record<string, string> = { running: "Running", succeeded: "Done", failed: "Failed", cancelled: "Cancelled" };
const RUN_HUE: Record<string, string> = { running: "#2563eb", succeeded: "#16a34a", failed: "#dc2626", cancelled: "#64748b" };

const money = (n: number) => `$${n.toFixed(n > 0 && n < 1 ? 2 : 0)}`;
const fmtWhen = (s: string) => new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const fmtTime = (s: string) => new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const took = (r: Run) => {
  if (!r.ended_at) return null;
  const s = Math.round((new Date(r.ended_at).getTime() - new Date(r.started_at).getTime()) / 1000);
  return s < 90 ? `${s}s` : `${Math.round(s / 60)} min`;
};

async function api<X>(url: string, init?: RequestInit): Promise<X> {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d as X;
}
function ErrorLine({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div style={card({ borderColor: alpha(T.danger, 40), color: T.danger, fontSize: 13, margin: "8px 0" })}>{msg}</div>;
}

export default function StaffTab() {
  const [board, setBoard] = useState<Board | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [view, setView] = useState<"roster" | "runs" | "playbooks">("roster");
  const load = useCallback(async () => {
    setErr(null);
    try { setBoard(await api<Board>("/api/dashboard/staff")); }
    catch (e) { setErr((e as Error).message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const names = Object.fromEntries((board?.agents ?? []).map((a) => [a.key, a.name]));
  const active = board?.agents.filter((a) => a.status === "active").length ?? 0;
  const weekRuns = board?.agents.reduce((n, a) => n + a.weekRuns, 0) ?? 0;
  const weekSpend = board?.agents.reduce((n, a) => n + a.weekSpend, 0) ?? 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button style={pill(view === "roster")} onClick={() => setView("roster")}>Roster</button>
          <button style={pill(view === "runs")} onClick={() => setView("runs")}>Runs</button>
          <button style={pill(view === "playbooks")} onClick={() => setView("playbooks")}>Playbooks</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, ...muted, fontSize: 12 }}>
          {board ? `Updated ${fmtTime(board.updatedAt)}` : "Not loaded"}
          <button style={btn(false, { height: 28, fontSize: 12, padding: "0 10px" })} onClick={load}>Refresh</button>
        </div>
      </div>
      <ErrorLine msg={err} />
      {!board && !err && <SkeletonCards count={4} label="Loading the staff board" />}
      {board && (
        <div className="dash-in">
          <div style={{ ...muted, marginBottom: 14 }}>
            {active} of {board.agents.length} roles active · {weekRuns} {weekRuns === 1 ? "run" : "runs"} this week · {money(weekSpend)} spent this week
          </div>
          {view === "roster" && <Roster board={board} onChanged={load} />}
          {view === "runs" && <Runs runs={board.runs} names={names} />}
          {view === "playbooks" && <Playbooks board={board} onChanged={load} />}
        </div>
      )}
    </div>
  );
}

// ─── Roster ──────────────────────────────────────────────────────────────────

function Roster({ board, onChanged }: { board: Board; onChanged: () => void }) {
  const depts = Object.keys(DEPT_LABEL).filter((d) => board.agents.some((a) => a.department === d));
  return (
    <>
      {depts.map((d) => (
        <section key={d} style={{ marginBottom: 20 }}>
          <h2 style={h2}>{DEPT_LABEL[d]}</h2>
          {board.agents.filter((a) => a.department === d).map((a) => <AgentCard key={a.key} a={a} owner={board.me.canApprove} onChanged={onChanged} />)}
        </section>
      ))}
    </>
  );
}

function AgentCard({ a, owner, onChanged }: { a: Agent; owner: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cap, setCap] = useState(a.monthly_cap_usd === null ? "" : String(a.monthly_cap_usd));
  const patch = async (body: Record<string, unknown>) => {
    setBusy(true); setErr(null);
    try { await api("/api/dashboard/staff", { method: "PATCH", body: JSON.stringify({ key: a.key, ...body }) }); onChanged(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  const last = a.lastRun;
  return (
    <div style={card({ marginBottom: 8 })}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: a.enabled ? "#16a34a" : "#94a3b8" }} title={a.enabled ? "On" : "Off"} />
        <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{a.name}</span>
        <span style={{ fontSize: 14, color: T.textSub }}>{a.role}</span>
        <Badge text={STATUS_LABEL[a.status] ?? a.status} hue={STATUS_HUE[a.status] ?? "#64748b"} />
        {a.phase && <Badge text={a.phase} hue="#64748b" />}
        {a.weekFailed > 0 && <Badge text={`${a.weekFailed} failed this week`} hue="#dc2626" />}
      </div>
      {a.job && <div style={{ fontSize: 13, color: T.text, margin: "8px 0 4px" }}>{a.job}</div>}
      <div style={{ ...muted }}>
        {last ? <>Last run {fmtWhen(last.started_at)} · {RUN_LABEL[last.status]}{last.job ? ` · ${last.job}` : ""}</> : "No runs yet"}
        {" · "}{a.weekRuns} this week · {money(a.weekSpend)} this week
        {a.monthly_cap_usd !== null && ` · ${money(a.monthSpend)} of ${money(Number(a.monthly_cap_usd))} cap this month`}
        {" · "}{a.activePlaybook ? `Playbook v${a.activePlaybook}` : "No approved playbook"}
        {a.draftPlaybooks > 0 && ` (${a.draftPlaybooks} waiting for approval)`}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {a.enabled
          ? <button style={btn(false)} disabled={busy} onClick={() => patch({ enabled: false })}>{busy ? "Saving…" : "Switch off"}</button>
          : owner && a.status !== "retired" && <button style={btn(true)} disabled={busy} onClick={() => patch({ enabled: true })}>{busy ? "Saving…" : "Switch on"}</button>}
        <button style={btn(false)} onClick={() => setOpen((o) => !o)}>{open ? "Hide details" : "Details"}</button>
      </div>
      {open && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}`, display: "grid", gap: 10 }}>
          <Fact label="Runs on" value={a.runs_on} />
          <Fact label="Schedule" value={a.schedule ?? "Not set yet"} />
          <Fact label="Gate" value={a.gate} />
          <Fact label="Owner key" value={a.key} />
          <Fact label="Auto-send" value={a.auto_send ? "On" : "Off (drafts wait in Approvals)"} />
          {a.playbook_url && <Fact label="Playbook doc" value={<a href={a.playbook_url} target="_blank" rel="noreferrer" style={{ color: T.text }}>Open</a>} />}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ ...muted, minWidth: 90 }} htmlFor={`status-${a.key}`}>Status</label>
            <select id={`status-${a.key}`} value={a.status} disabled={busy} onChange={(e) => patch({ status: e.target.value })} style={{ ...inputStyle, width: "auto" }}>
              {Object.entries(STATUS_LABEL)
                .filter(([v]) => owner || v === a.status || (v !== "active" && v !== "retired"))
                .map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          {owner && (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <label style={{ ...muted, minWidth: 90 }} htmlFor={`cap-${a.key}`}>Monthly cap $</label>
                <input id={`cap-${a.key}`} inputMode="decimal" placeholder="No cap set" value={cap} onChange={(e) => setCap(e.target.value)} style={{ ...inputStyle, width: 120 }} />
                {cap !== (a.monthly_cap_usd === null ? "" : String(a.monthly_cap_usd)) && (
                  <button style={btn(true)} disabled={busy} onClick={() => patch({ monthly_cap_usd: cap.trim() === "" ? null : Number(cap) })}>Save cap</button>
                )}
              </div>
              <div>
                <button style={btn(false)} disabled={busy} onClick={() => patch({ auto_send: !a.auto_send })}>{a.auto_send ? "Turn auto-send off" : "Turn auto-send on"}</button>
              </div>
            </>
          )}
        </div>
      )}
      <ErrorLine msg={err} />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <span style={{ ...muted, minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: 13, color: T.text, flex: "1 1 220px" }}>{value}</span>
    </div>
  );
}

// ─── Runs ────────────────────────────────────────────────────────────────────

function Runs({ runs, names }: { runs: Run[]; names: Record<string, string> }) {
  if (!runs.length) return <div style={card({ ...muted })}>No runs logged yet. Each agent writes a row here every time it runs, with what it made, what it cost and any error.</div>;
  return (
    <>
      {runs.map((r) => (
        <div key={r.id} style={card({ marginBottom: 8 })}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{names[r.agent_key] ?? r.agent_key}</span>
            {r.job && <span style={{ fontSize: 14, color: T.textSub }}>{r.job}</span>}
            <Badge text={RUN_LABEL[r.status] ?? r.status} hue={RUN_HUE[r.status] ?? "#64748b"} />
          </div>
          {(r.result || r.error) && <div style={{ fontSize: 13, color: r.error ? T.danger : T.text, margin: "6px 0 2px" }}>{r.error ?? r.result}</div>}
          <div style={muted}>
            {fmtWhen(r.started_at)}{took(r) ? ` · took ${took(r)}` : ""} · {r.trigger}
            {" · "}{r.items_created} items · {r.rows_written} rows · {money(Number(r.cost_usd))}
            {r.playbook_version ? ` · playbook v${r.playbook_version}` : ""}
          </div>
        </div>
      ))}
      {runs.length >= 50 && <div style={{ ...muted, marginTop: 8 }}>Showing the latest 50 runs.</div>}
    </>
  );
}

// ─── Playbooks ───────────────────────────────────────────────────────────────

function Playbooks({ board, onChanged }: { board: Board; onChanged: () => void }) {
  const [agent, setAgent] = useState(board.agents[0]?.key ?? "");
  const a = board.agents.find((x) => x.key === agent);
  const versions = board.playbooks.filter((p) => p.agent_key === agent);
  return (
    <div>
      <div style={{ ...muted, marginBottom: 10 }}>
        Each agent runs on its active playbook. Anyone can draft a new version; it only takes effect once Matt approves it.
      </div>
      <select aria-label="Agent" value={agent} onChange={(e) => setAgent(e.target.value)} style={{ ...inputStyle, width: "auto", marginBottom: 12 }}>
        {board.agents.map((x) => (
          <option key={x.key} value={x.key}>{x.name} · {x.role}{x.activePlaybook ? ` (v${x.activePlaybook})` : ""}</option>
        ))}
      </select>
      {a && <NewVersion agent={a} latest={versions[0] ?? null} onSaved={onChanged} />}
      {!versions.length && <div style={card({ ...muted })}>No playbook for {a?.name ?? "this agent"} yet.</div>}
      {versions.map((p) => <VersionCard key={p.id} p={p} canApprove={board.me.canApprove} onChanged={onChanged} />)}
    </div>
  );
}

function VersionCard({ p, canApprove, onChanged }: { p: Playbook; canApprove: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(p.active);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const approve = async () => {
    setBusy(true); setErr(null);
    try { await api("/api/dashboard/staff/playbooks", { method: "PATCH", body: JSON.stringify({ id: p.id, action: "approve" }) }); onChanged(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <div style={card({ marginBottom: 8 })}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>v{p.version}{p.title ? ` · ${p.title}` : ""}</span>
        {p.active ? <Badge text="Active" hue="#16a34a" /> : p.approved_by ? <Badge text="Approved earlier" hue="#64748b" /> : <Badge text="Waiting for approval" hue="#d97706" />}
      </div>
      <div style={{ ...muted, marginTop: 4 }}>
        Drafted by {p.created_by}, {fmtWhen(p.created_at)}
        {p.approved_by && ` · approved by ${p.approved_by}${p.approved_at ? `, ${fmtWhen(p.approved_at)}` : ""}`}
      </div>
      {p.change_note && <div style={{ fontSize: 13, color: T.text, marginTop: 6 }}>{p.change_note}</div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        <button style={btn(false)} onClick={() => setOpen((o) => !o)}>{open ? "Hide playbook" : "Read playbook"}</button>
        {canApprove && !p.active && <button style={btn(true)} disabled={busy} onClick={approve}>{busy ? "Saving…" : p.approved_by ? "Make active again" : "Approve and make active"}</button>}
      </div>
      {open && <pre style={{ whiteSpace: "pre-wrap", fontFamily: BODY, fontSize: 13, color: T.text, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 12, marginTop: 10, maxHeight: 420, overflow: "auto" }}>{p.content}</pre>}
      <ErrorLine msg={err} />
    </div>
  );
}

function NewVersion({ agent, latest, onSaved }: { agent: Agent; latest: Playbook | null; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const start = () => { setContent(latest?.content ?? ""); setNote(""); setErr(null); setOpen(true); };
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      await api("/api/dashboard/staff/playbooks", { method: "POST", body: JSON.stringify({ agent_key: agent.key, content, change_note: note }) });
      setOpen(false); onSaved();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  if (!open) return <button style={btn(false, { marginBottom: 12 })} onClick={start}>{latest ? `Draft v${latest.version + 1} for ${agent.name}` : `Write ${agent.name}'s first playbook`}</button>;
  return (
    <div style={card({ marginBottom: 12, display: "grid", gap: 8 })}>
      <textarea aria-label="Playbook" rows={12} value={content} onChange={(e) => setContent(e.target.value)} placeholder="The prompt, the steps, what it may and may not do, and what it hands back." style={{ ...inputStyle, resize: "vertical" }} />
      <input aria-label="What changed" placeholder="What changed (one line)" value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={btn(true)} disabled={busy || !content.trim()} onClick={save}>{busy ? "Saving…" : "Save draft"}</button>
        <button style={btn(false)} onClick={() => setOpen(false)}>Cancel</button>
      </div>
      <ErrorLine msg={err} />
    </div>
  );
}
