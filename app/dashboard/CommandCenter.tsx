"use client";
import { useCallback, useEffect, useState } from "react";
import { T, alpha, BODY, DISP } from "./theme";

// ─────────────────────────────────────────────────────────────────────────────
// Command Center Phase 0 panels (Casey's Command Center Spec): Today (the home
// screen), Approvals, Connections, the Activity log, and the "coming in Phase
// N" state for panels not built yet. Every list is a filtered view of Items.
// Mobile-first: stacked cards, no wide tables, every button has words on it.
// ─────────────────────────────────────────────────────────────────────────────

export interface Me { role: "owner" | "operator"; name: string; ownerName: string; operatorName: string }

type Tier = "green" | "yellow" | "red";
interface Approval { summary: string; recommendation: string | null; options: { label: string; effect: string }[]; expires_at: string | null; decision: string | null; decision_note: string | null; decided_by: string | null; decided_at: string | null }
interface Item {
  id: string; type: string; title: string; detail: string | null; source: string; source_url: string | null; owner: string; tier: Tier;
  status: string; due_at: string | null; payload: Record<string, unknown>; created_at: string; updated_at: string; approval?: Approval | null;
}
interface ActivityRow { id: string; actor: string; action: string; target_type: string | null; summary: string; created_at: string }
interface TodayData {
  updatedAt: string; decide: Item[]; exceptions: Item[]; happening: Item[]; watching: Item[]; done: Item[];
  crm: { followUps: number; replies: number } | null;
}
interface Connection { name: string; label: string; status: string; note: string | null; last_sync_at: string | null; last_error: string | null; updated_by: string | null; updated_at: string }

const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, ...extra });
const btn = (primary?: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 36, padding: "0 14px", borderRadius: 6, cursor: "pointer", fontFamily: BODY, fontWeight: 500, fontSize: 14, whiteSpace: "nowrap",
  border: `1px solid ${primary ? T.brand : T.border}`, background: primary ? T.brand : "transparent", color: primary ? T.onBrand : T.text, ...extra,
});
const inputStyle: React.CSSProperties = { background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 14, padding: "8px 12px", borderRadius: 6, outline: "none", width: "100%" };
const muted: React.CSSProperties = { color: T.muted, fontFamily: BODY, fontSize: 13 };
const h2: React.CSSProperties = { fontFamily: BODY, fontSize: 15, fontWeight: 600, color: T.text, margin: 0 };
const pill = (on: boolean): React.CSSProperties => ({
  fontFamily: BODY, fontSize: 13, fontWeight: 500, padding: "6px 14px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap",
  border: `1px solid ${on ? T.brand : T.border}`, background: on ? T.brand : "transparent", color: on ? T.onBrand : T.textSub,
});
function Badge({ text, hue }: { text: string; hue: string }) {
  return <span className="dash-pill" style={{ fontSize: 12, padding: "2px 9px", borderRadius: 999, background: alpha(hue, 12), color: hue, border: `1px solid ${alpha(hue, 30)}`, whiteSpace: "nowrap" }}>{text}</span>;
}
const TIER_HUE: Record<Tier, string> = { green: "#16a34a", yellow: "#d97706", red: "#dc2626" };
const SEV_HUE: Record<string, string> = { high: "#dc2626", medium: "#d97706", low: "#64748b" };
const TYPE_LABEL: Record<string, string> = { approval: "Approval", task: "Task", exception: "Exception", job: "Agent job", booking: "Booking", invoice: "Invoice", reply: "Reply", check: "Check" };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

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
const fmtWhen = (s: string) => new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const fmtTime = (s: string) => new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const ago = (s: string) => {
  const h = (Date.now() - new Date(s).getTime()) / 3600000;
  return h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 48 ? `${Math.round(h)}h` : `${Math.round(h / 24)} days`;
};
const ownerLabel = (o: string, me: Me) => (o === "matt" ? me.ownerName : o === "casey" ? me.operatorName : o.startsWith("agent:") ? cap(o.slice(6)) : "Unassigned");
function Updated({ at, onRefresh }: { at: string | null; onRefresh: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, ...muted, fontSize: 12 }}>
      {at ? `Updated ${fmtTime(at)}` : "Not loaded"}
      <button style={btn(false, { height: 28, fontSize: 12, padding: "0 10px" })} onClick={onRefresh}>Refresh</button>
    </div>
  );
}

// ─── Today ───────────────────────────────────────────────────────────────────

export function TodayPanel({ me, onOpenTab }: { me: Me; onOpenTab: (tab: string) => void }) {
  const [view, setView] = useState<"today" | "activity">("today");
  if (view === "activity") return (
    <div>
      <button style={btn(false, { marginBottom: 14 })} onClick={() => setView("today")}>Back to Today</button>
      <ActivityView />
    </div>
  );
  return <TodayView me={me} onOpenTab={onOpenTab} onActivity={() => setView("activity")} />;
}

function TodayView({ me, onOpenTab, onActivity }: { me: Me; onOpenTab: (tab: string) => void; onActivity: () => void }) {
  const [data, setData] = useState<TodayData | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    setErr(null);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const start = new Date(); start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0);
    try { setData(await api<TodayData>(`/api/dashboard/cc/today?until=${encodeURIComponent(end.toISOString())}&since=${encodeURIComponent(start.toISOString())}`)); }
    catch (e) { setErr(`Couldn't load Today: ${(e as Error).message}. What's shown below may be out of date.`); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const oldest = data?.decide[0];
  const hasSamples = !!data && [data.decide, data.exceptions, data.happening, data.watching, data.done].some((l) => l.some((i) => i.payload?.sample));
  const deleteSamples = async () => {
    if (!confirm("Delete the 5 sample items? This can't be undone.")) return;
    try { await api("/api/dashboard/cc/items?samples=1", { method: "DELETE" }); load(); } catch (e) { setErr((e as Error).message); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: DISP, fontSize: 22, fontWeight: 600, color: T.text }}>{greet}, {me.name}</div>
          <div style={muted}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>
        <Updated at={data?.updatedAt ?? null} onRefresh={load} />
      </div>
      <ErrorLine msg={err} />
      {!data && !err && <div style={muted}>Loading…</div>}
      {data && (
        <>
          <Section title="Decide" count={data.decide.length} note={oldest ? `Oldest waiting ${ago(oldest.created_at)}` : undefined}>
            {data.decide.length === 0 ? <Empty text="Nothing waiting on a decision." />
              : data.decide.map((i) => <ApprovalCard key={i.id} item={i} me={me} onChanged={load} />)}
          </Section>
          <Section title="Exceptions" count={data.exceptions.length}>
            {data.exceptions.length === 0 ? <Empty text="Nothing on fire." />
              : data.exceptions.map((i) => <ItemCard key={i.id} item={i} me={me} onChanged={load} />)}
          </Section>
          <Section title="Happening today" count={data.happening.length}>
            {data.happening.map((i) => <ItemCard key={i.id} item={i} me={me} onChanged={load} />)}
            {data.crm && (data.crm.followUps > 0 || data.crm.replies > 0) && (
              <div style={card({ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" })}>
                <div style={{ fontSize: 14, color: T.text }}>
                  CRM: {data.crm.followUps} follow-up{data.crm.followUps === 1 ? "" : "s"} due{data.crm.replies ? `, ${data.crm.replies} repl${data.crm.replies === 1 ? "y" : "ies"} to work` : ""}
                </div>
                <button style={btn(false, { height: 32 })} onClick={() => onOpenTab("crm")}>Open CRM</button>
              </div>
            )}
            {data.happening.length === 0 && !(data.crm && (data.crm.followUps || data.crm.replies)) && <Empty text="Nothing due today." />}
          </Section>
          <Section title="Watching" count={data.watching.length}>
            {data.watching.length === 0 ? <Empty text="Nothing running or waiting on someone." />
              : data.watching.map((i) => <ItemCard key={i.id} item={i} me={me} onChanged={load} />)}
          </Section>
          <Section title="Done since yesterday" count={data.done.length} action={<button style={btn(false, { height: 30, fontSize: 13 })} onClick={onActivity}>See all activity</button>}>
            {data.done.length === 0 ? <Empty text="Nothing finished since yesterday." /> : (
              <div style={card({ padding: 0 })}>
                {data.done.map((i, n) => (
                  <div key={i.id} style={{ padding: "10px 14px", borderTop: n ? `1px solid ${T.border}` : "none", fontSize: 14, color: T.text }}>
                    {i.payload?.outcome === "killed" ? "Killed: " : i.type === "approval" ? "Approved: " : "Done: "}{i.title}
                    <span style={muted}> · {fmtWhen(i.updated_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
          {hasSamples && <button style={btn(false)} onClick={deleteSamples}>Delete sample items</button>}
        </>
      )}
    </div>
  );
}

function Section({ title, count, note, action, children }: { title: string; count?: number; note?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <h2 style={h2}>{title}{count ? ` (${count})` : ""}</h2>
          {note && <span style={muted}>{note}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
const Empty = ({ text }: { text: string }) => <div style={muted}>{text}</div>;

function ItemCard({ item, me, onChanged }: { item: Item; me: Me; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = async (status: string) => {
    setBusy(true); setErr(null);
    try { await api("/api/dashboard/cc/items", { method: "PATCH", body: JSON.stringify({ id: item.id, status }) }); onChanged(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  const sev = typeof item.payload?.severity === "string" ? item.payload.severity : null;
  const overdue = item.due_at && new Date(item.due_at) < new Date(new Date().setHours(0, 0, 0, 0));
  return (
    <div style={card({ marginBottom: 8 })}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
        {sev ? <Badge text={`${cap(sev)} severity`} hue={SEV_HUE[sev] ?? "#64748b"} /> : <Badge text={cap(item.tier)} hue={TIER_HUE[item.tier]} />}
        <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{item.title}</span>
      </div>
      {item.detail && <div style={{ fontSize: 14, color: T.textSub, margin: "4px 0" }}>{item.detail}</div>}
      <div style={muted}>
        {TYPE_LABEL[item.type] ?? item.type} · {ownerLabel(item.owner, me)}
        {item.status === "blocked" && " · blocked"}{item.status === "waiting" && " · waiting"}{item.status === "failed" && " · failed"}
        {item.due_at && <span style={{ color: overdue ? T.danger : undefined }}> · due {fmtWhen(item.due_at)}</span>}
        {item.source_url && <> · <a href={item.source_url} target="_blank" rel="noreferrer" style={{ color: T.text }}>Open source</a></>}
      </div>
      <ErrorLine msg={err} />
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        <button style={btn(true, { height: 32 })} disabled={busy} onClick={() => set("done")}>Mark done</button>
        {item.status !== "blocked" && <button style={btn(false, { height: 32 })} disabled={busy} onClick={() => set("blocked")}>Mark blocked</button>}
        {(item.status === "blocked" || item.status === "failed") && <button style={btn(false, { height: 32 })} disabled={busy} onClick={() => set("new")}>Reopen</button>}
      </div>
    </div>
  );
}

function ApprovalCard({ item, me, onChanged }: { item: Item; me: Me; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [killing, setKilling] = useState(false);
  const [note, setNote] = useState("");
  const a = item.approval ?? null;
  const decided = !!a?.decision;
  const aging = !decided && Date.now() - new Date(item.created_at).getTime() > 24 * 3600000;
  const go = async (op: "approve" | "kill") => {
    if (op === "kill" && !note.trim()) { setErr("Say why you're killing it."); return; }
    setBusy(true); setErr(null);
    try { await api("/api/dashboard/cc/approvals", { method: "POST", body: JSON.stringify({ op, id: item.id, note: note || undefined }) }); onChanged(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <div style={card({ marginBottom: 10, borderColor: aging ? alpha(T.danger, 50) : undefined })}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
        <Badge text={cap(item.tier)} hue={TIER_HUE[item.tier]} />
        {aging && <Badge text={`Aging · ${ago(item.created_at)}`} hue="#dc2626" />}
        <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{item.title}</span>
      </div>
      {a?.recommendation && <div style={{ fontSize: 14, color: T.text, margin: "6px 0" }}>{a.recommendation}</div>}
      {a?.summary && <div style={{ fontSize: 14, color: T.textSub }}>{a.summary}</div>}
      <button style={{ ...muted, background: "none", border: "none", padding: "6px 0", cursor: "pointer", textDecoration: "underline" }} onClick={() => setOpen((o) => !o)}>{open ? "Hide details" : "Show full details"}</button>
      {open && (
        <div style={{ fontSize: 13, color: T.textSub, marginBottom: 6 }}>
          {item.detail && <div style={{ marginBottom: 6 }}>{item.detail}</div>}
          {(a?.options ?? []).map((o) => <div key={o.label}><b>{o.label}:</b> {o.effect}</div>)}
          {item.source_url && <div style={{ marginTop: 6 }}><a href={item.source_url} target="_blank" rel="noreferrer" style={{ color: T.text }}>Open source</a></div>}
        </div>
      )}
      <div style={muted}>
        Asked {ago(item.created_at)} ago{typeof item.payload?.requested_by === "string" ? ` by ${item.payload.requested_by}` : ""}
        {a?.decided_by && a.decided_at && <> · {a.decision === "killed" ? "killed" : "approved"} by {a.decided_by}, {fmtWhen(a.decided_at)}</>}
      </div>
      {a?.decision_note && <div style={{ ...muted, marginTop: 4 }}>Reason: {a.decision_note}</div>}
      {typeof item.payload?.result === "string" && <div style={{ fontSize: 13, marginTop: 6, color: item.status === "failed" ? T.danger : T.text }}>{item.payload.result}</div>}
      <ErrorLine msg={err} />
      {!decided && (me.role === "owner" ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {killing && <input aria-label="Reason for killing" placeholder="Why kill it? (required)" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, flex: "1 1 200px", width: "auto" }} />}
          {!killing && <button style={btn(true)} disabled={busy} onClick={() => go("approve")}>{busy ? "Working…" : "Approve"}</button>}
          {!killing && <button style={btn(false)} disabled={busy} onClick={() => setKilling(true)}>Kill</button>}
          {killing && <button style={btn(false, { borderColor: T.danger, color: T.danger })} disabled={busy} onClick={() => go("kill")}>Kill it</button>}
          {killing && <button style={btn(false)} disabled={busy} onClick={() => { setKilling(false); setNote(""); }}>Cancel</button>}
        </div>
      ) : <div style={{ ...muted, marginTop: 8 }}>Waiting on {me.ownerName}. Only {me.ownerName} can approve or kill this.</div>)}
    </div>
  );
}

// ─── Approvals ───────────────────────────────────────────────────────────────

export function ApprovalsPanel({ me }: { me: Me }) {
  const [openList, setOpenList] = useState(true);
  const [rows, setRows] = useState<Item[] | null>(null);
  const [at, setAt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const load = useCallback(async () => {
    setErr(null);
    try { setRows((await api<{ rows: Item[] }>(`/api/dashboard/cc/approvals?open=${openList ? 1 : 0}`)).rows); setAt(new Date().toISOString()); }
    catch (e) { setErr(`Couldn't load approvals: ${(e as Error).message}`); }
  }, [openList]);
  useEffect(() => { load(); }, [load]);
  const check = async (tier: Tier) => {
    setMsg(null); setErr(null);
    try {
      const r = await api<{ ran: boolean; result?: string }>("/api/dashboard/cc/approvals", { method: "POST", body: JSON.stringify({ op: "check", tier }) });
      setMsg(r.ran ? `Green check ran straight away: ${r.result}` : `${cap(tier)} check is now waiting for approval above.`);
      if (!openList) setOpenList(true); else load();
    } catch (e) { setErr((e as Error).message); }
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="dash-pill" style={pill(openList)} onClick={() => setOpenList(true)}>Waiting</button>
          <button className="dash-pill" style={pill(!openList)} onClick={() => setOpenList(false)}>Decided</button>
        </div>
        <Updated at={at} onRefresh={load} />
      </div>
      <ErrorLine msg={err} />
      {!rows && !err && <div style={muted}>Loading…</div>}
      {rows && rows.length === 0 && <div style={{ ...muted, marginBottom: 16 }}>{openList ? "Nothing waiting for approval." : "Nothing decided yet."}</div>}
      {rows?.map((i) => <ApprovalCard key={i.id} item={i} me={me} onChanged={load} />)}
      <div style={{ ...muted, margin: "8px 0 20px" }}>Batch approve, Edit and the webhook to Casey's automation arrive in Phase 1.</div>
      <div style={card()}>
        <h2 style={{ ...h2, marginBottom: 6 }}>Tier check</h2>
        <div style={{ ...muted, marginBottom: 10 }}>Tests the gate with a harmless action. Its only effect is an Activity entry.</div>
        {(["green", "yellow", "red"] as const).map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
            <button style={btn(false, { minWidth: 170 })} onClick={() => check(t)}>Request {cap(t)} check</button>
            <span style={muted}>{t === "green" ? "Runs straight away and is logged." : t === "yellow" ? `Waits for ${me.ownerName}'s approval; approving runs it.` : `Waits for ${me.ownerName}; nobody else can approve or run it.`}</span>
          </div>
        ))}
        {msg && <div style={{ fontSize: 13, color: T.text, marginTop: 6 }}>{msg}</div>}
      </div>
    </div>
  );
}

// ─── Connections ─────────────────────────────────────────────────────────────

const CONN_HUE: Record<string, string> = { connected: "#16a34a", degraded: "#d97706", down: "#dc2626", not_configured: "#64748b" };
const CONN_LABEL: Record<string, string> = { connected: "Connected", degraded: "Degraded", down: "Down", not_configured: "Not set up" };

export function ConnectionsPanel() {
  const [rows, setRows] = useState<Connection[] | null>(null);
  const [at, setAt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    setErr(null);
    try { const r = await api<{ rows: Connection[]; updatedAt: string }>("/api/dashboard/cc/connections"); setRows(r.rows); setAt(r.updatedAt); }
    catch (e) { setErr(`Couldn't load connections: ${(e as Error).message}`); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={muted}>Set by hand for now. Live status and last sync arrive in Phase 1. Marking one Down raises an exception on Today.</div>
        <Updated at={at} onRefresh={load} />
      </div>
      <ErrorLine msg={err} />
      {!rows && !err && <div style={muted}>Loading…</div>}
      {rows?.map((c) => <ConnectionRow key={c.name} c={c} onSaved={load} />)}
    </div>
  );
}

function ConnectionRow({ c, onSaved }: { c: Connection; onSaved: () => void }) {
  const [status, setStatus] = useState(c.status);
  const [note, setNote] = useState(c.note ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dirty = status !== c.status || note !== (c.note ?? "");
  const save = async () => {
    setBusy(true); setErr(null);
    try { await api("/api/dashboard/cc/connections", { method: "PATCH", body: JSON.stringify({ name: c.name, status, note }) }); onSaved(); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <div style={card({ marginBottom: 8 })}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: CONN_HUE[c.status] ?? "#64748b" }} />
        <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>{c.label}</span>
        <Badge text={CONN_LABEL[c.status] ?? c.status} hue={CONN_HUE[c.status] ?? "#64748b"} />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select aria-label={`${c.label} status`} value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          {Object.entries(CONN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input aria-label={`${c.label} note`} placeholder="Note (what's wrong, who's fixing it)" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, flex: "1 1 220px", width: "auto" }} />
        {dirty && <button style={btn(true)} disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</button>}
      </div>
      <div style={{ ...muted, marginTop: 6 }}>
        {c.last_sync_at ? `Last sync ${fmtWhen(c.last_sync_at)}` : "No live sync yet"}
        {c.updated_by && ` · set by ${c.updated_by}, ${fmtWhen(c.updated_at)}`}
      </div>
      <ErrorLine msg={err} />
    </div>
  );
}

// ─── Activity ────────────────────────────────────────────────────────────────

const TARGET_LABEL: Record<string, string> = { prospect: "Prospect", item: "Item", connection: "Connection", session: "Sign-in", import: "Import", merge: "Merge", action: "Action" };

export function ActivityView() {
  const [type, setType] = useState("");
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
      <h2 style={{ ...h2, marginBottom: 10 }}>Activity</h2>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {([["", "All"], ["item", "Items"], ["prospect", "Prospects"], ["connection", "Connections"], ["session", "Sign-ins"], ["import", "Imports"]] as const).map(([id, l]) => (
          <button key={id} className="dash-pill" style={pill(type === id)} onClick={() => setType(id)}>{l}</button>
        ))}
      </div>
      <ErrorLine msg={err} />
      {!rows && !err && <div style={muted}>Loading…</div>}
      {rows && rows.length === 0 && <div style={muted}>No activity yet.</div>}
      {rows && rows.length > 0 && (
        <div style={card({ padding: 0 })}>
          {rows.map((r, i) => (
            <div key={r.id} style={{ padding: "10px 14px", borderTop: i ? `1px solid ${T.border}` : "none" }}>
              <div style={{ fontSize: 14, color: T.text }}>{r.summary}</div>
              <div style={muted}>{r.actor} · {TARGET_LABEL[r.target_type ?? ""] ?? r.target_type ?? "General"} · {fmtWhen(r.created_at)}</div>
            </div>
          ))}
        </div>
      )}
      {rows && rows.length < total && (
        <button style={btn(false, { marginTop: 12 })} disabled={more} onClick={async () => { setMore(true); await load(rows.length); setMore(false); }}>
          {more ? "Loading…" : `Show more (${(total - rows.length).toLocaleString()} left)`}
        </button>
      )}
    </div>
  );
}

// ─── Not built yet ───────────────────────────────────────────────────────────

export function ComingSoon({ phase, what, links, onOpenTab }: { phase: number; what: string; links?: { tab: string; label: string }[]; onOpenTab: (tab: string) => void }) {
  return (
    <div style={card({ maxWidth: 640 })}>
      <Badge text={`Coming in Phase ${phase}`} hue="#64748b" />
      <p style={{ fontSize: 14, color: T.text, margin: "12px 0" }}>{what}</p>
      {links && links.length > 0 && (
        <>
          <div style={{ ...muted, marginBottom: 8 }}>Until then, use:</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {links.map((l) => <button key={l.tab} style={btn(false)} onClick={() => onOpenTab(l.tab)}>{l.label}</button>)}
          </div>
        </>
      )}
    </div>
  );
}
