"use client";
import { useCallback, useEffect, useState } from "react";
import { T, alpha, BODY } from "./theme";
import { SkeletonLines } from "./Skeleton";

// ─────────────────────────────────────────────────────────────────────────────
// The top of Revenue: what needs attention on money right now. Unpaid and
// overdue Stripe invoices, failed payments in the last 30 days, subscriptions
// renewing in the next 14 days, and (owner only) Matt's own bill reminders.
// Read-only against Stripe: no payment buttons.
// ─────────────────────────────────────────────────────────────────────────────

interface Unpaid { id: string; customer: string; email: string | null; amount: number; due: string | null; overdue: boolean; number: string | null }
interface Failed { id: string; customer: string; amount: number; when: string; reason: string | null }
interface Renewal { id: string; customer: string; amount: number; renews: string | null; cancel: boolean }
interface Bill { name: string; due_day: number; amount: number | null; note: string | null; next_due?: string; days?: number }
interface Data { configured: boolean; unpaid: Unpaid[]; failed: Failed[]; renewals: Renewal[]; bills: Bill[] | null; problems: string[] }

const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, ...extra });
const btn = (primary?: boolean): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", height: 32, padding: "0 12px", borderRadius: 6, cursor: "pointer", fontFamily: BODY, fontWeight: 500, fontSize: 13, whiteSpace: "nowrap",
  border: `1px solid ${primary ? T.brand : T.border}`, background: primary ? T.brand : "transparent", color: primary ? T.onBrand : T.text,
});
const input: React.CSSProperties = { background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 13, padding: "6px 10px", borderRadius: 6, outline: "none", width: "100%" };
const h3: React.CSSProperties = { fontFamily: BODY, fontSize: 13, fontWeight: 600, color: T.textSub, margin: 0 };
const muted: React.CSSProperties = { color: T.muted, fontFamily: BODY, fontSize: 13 };
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 ? 2 : 0 });
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "no due date");
const ymd = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

function Row({ left, sub, right, tone }: { left: string; sub?: string; right: string; tone?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{left}</div>
        {sub && <div style={{ fontSize: 12, color: tone ?? T.muted }}>{sub}</div>}
      </div>
      <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{right}</span>
    </div>
  );
}

function Panel({ title, count, tone, empty, children }: { title: string; count: number; tone: string; empty: string; children: React.ReactNode }) {
  return (
    <div style={card({ borderColor: count ? alpha(tone, 45) : T.border })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={h3}>{title}</h3>
        <span style={{ fontSize: 12, fontWeight: 600, color: count ? tone : T.muted }}>{count}</span>
      </div>
      <div style={{ marginTop: 6 }}>{count ? children : <div style={{ ...muted, padding: "8px 0" }}>{empty}</div>}</div>
    </div>
  );
}

export default function MoneyAlerts() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/dashboard/revenue/alerts", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `Couldn't load (${r.status})`);
      setD(j); setErr(null);
    } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't load money alerts."); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (err) return <div style={card({ borderColor: alpha(T.danger, 40) })}><span style={{ color: T.danger, fontSize: 13 }}>{err}</span></div>;
  if (!d) return <div style={card()}><SkeletonLines rows={3} /></div>;

  const overdue = d.unpaid.filter((u) => u.overdue);
  const unpaidTotal = d.unpaid.reduce((n, u) => n + u.amount, 0);
  const headline = !d.configured ? "Stripe isn't connected, so there's nothing to check yet."
    : overdue.length || d.failed.length ? `${overdue.length + d.failed.length} money item${overdue.length + d.failed.length === 1 ? "" : "s"} need${overdue.length + d.failed.length === 1 ? "s" : ""} you.`
    : d.unpaid.length || d.renewals.length ? "Nothing overdue. A few things are coming up." : "Nothing needs you on money right now.";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontFamily: BODY, fontSize: 15, fontWeight: 600, color: T.text }}>{headline}</span>
        <span style={muted}>Live from Stripe, read-only</span>
      </div>
      {d.problems.length > 0 && <div style={card({ borderColor: alpha(T.warn, 40) })}><span style={{ color: T.warn, fontSize: 13 }}>{d.problems.join(" ")}</span></div>}
      {d.configured && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, alignItems: "start" }}>
          <Panel title={`Unpaid invoices${d.unpaid.length ? ` · ${usd(unpaidTotal)}` : ""}`} count={d.unpaid.length} tone={overdue.length ? T.danger : T.warn} empty="No open invoices.">
            {d.unpaid.slice(0, 8).map((u) => (
              <Row key={u.id} left={u.customer} sub={u.overdue ? `Overdue since ${day(u.due)}` : `Due ${day(u.due)}`} tone={u.overdue ? T.danger : undefined} right={usd(u.amount)} />
            ))}
            {d.unpaid.length > 8 && <div style={{ ...muted, paddingTop: 6 }}>And {d.unpaid.length - 8} more.</div>}
          </Panel>
          <Panel title="Failed payments · 30 days" count={d.failed.length} tone={T.danger} empty="No failed payments.">
            {d.failed.slice(0, 8).map((f) => (
              <Row key={f.id} left={f.customer} sub={`${day(f.when)}${f.reason ? ` · ${f.reason}` : ""}`} tone={T.danger} right={usd(f.amount)} />
            ))}
          </Panel>
          <Panel title="Renewals · next 14 days" count={d.renewals.length} tone={T.accent} empty="No renewals in the next two weeks.">
            {d.renewals.slice(0, 8).map((s) => (
              <Row key={s.id} left={s.customer} sub={s.cancel ? `Ends ${day(s.renews)} (set to cancel)` : `Renews ${day(s.renews)}`} tone={s.cancel ? T.warn : undefined} right={usd(s.amount)} />
            ))}
          </Panel>
        </div>
      )}
      {d.bills && <BillStrip bills={d.bills} onSaved={load} />}
    </div>
  );
}

// Matt's own due dates (owner only; the server never sends these to Casey).
function BillStrip({ bills, onSaved }: { bills: Bill[]; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<Bill[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const soon = bills.filter((b) => (b.days ?? 99) <= 14);
  const start = () => { setRows(bills.map(({ name, due_day, amount, note }) => ({ name, due_day, amount, note }))); setErr(null); setEditing(true); };
  const save = async () => {
    setBusy(true); setErr(null);
    try {
      const clean = rows.filter((r) => r.name.trim());
      const r = await fetch("/api/dashboard/revenue/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bills: clean }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Couldn't save.");
      setEditing(false); onSaved();
    } catch (e) { setErr(e instanceof Error ? e.message : "Couldn't save."); } finally { setBusy(false); }
  };
  const set = (i: number, patch: Partial<Bill>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div style={card()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h3 style={h3}>Your bills · next 14 days <span style={{ fontWeight: 400, color: T.muted }}>(only you see this)</span></h3>
        {!editing && <button style={btn()} onClick={start}>{bills.length ? "Edit" : "Add bills"}</button>}
      </div>
      {!editing && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {!bills.length && <span style={muted}>Add the bills you want a heads-up on, with the day of the month each is due.</span>}
          {bills.length > 0 && !soon.length && <span style={muted}>Nothing due in the next two weeks. Next: {bills[0].name}, {ymd(bills[0].next_due!)}.</span>}
          {soon.map((b) => (
            <span key={b.name} title={b.note ?? undefined} style={{ display: "inline-flex", gap: 6, alignItems: "baseline", padding: "6px 10px", borderRadius: 999, border: `1px solid ${b.days! <= 3 ? alpha(T.danger, 50) : T.border}`, background: b.days! <= 3 ? alpha(T.danger, 8) : T.surface, fontSize: 13 }}>
              <strong style={{ fontWeight: 600 }}>{b.name}</strong>
              <span style={{ color: b.days! <= 3 ? T.danger : T.muted }}>{b.days === 0 ? "today" : b.days === 1 ? "tomorrow" : ymd(b.next_due!)}</span>
              {b.amount != null && <span style={{ fontVariantNumeric: "tabular-nums" }}>{usd(b.amount)}</span>}
            </span>
          ))}
        </div>
      )}
      {editing && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 110px 2fr 32px", gap: 8, fontSize: 12, color: T.muted }}>
            <span>Bill</span><span>Due day</span><span>Amount</span><span>Note</span><span />
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 90px 110px 2fr 32px", gap: 8 }}>
              <input style={input} value={r.name} placeholder="Mortgage" onChange={(e) => set(i, { name: e.target.value })} />
              <input style={input} type="number" min={1} max={31} value={r.due_day || ""} placeholder="1" onChange={(e) => set(i, { due_day: Number(e.target.value) })} />
              <input style={input} type="number" min={0} step="0.01" value={r.amount ?? ""} placeholder="optional" onChange={(e) => set(i, { amount: e.target.value === "" ? null : Number(e.target.value) })} />
              <input style={input} value={r.note ?? ""} placeholder="optional" onChange={(e) => set(i, { note: e.target.value })} />
              <button style={{ ...btn(), padding: 0 }} aria-label="Remove" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button style={btn()} onClick={() => setRows((rs) => [...rs, { name: "", due_day: 1, amount: null, note: null }])}>Add a bill</button>
            <span style={{ flex: 1 }} />
            {err && <span style={{ color: T.danger, fontSize: 13 }}>{err}</span>}
            <button style={btn()} onClick={() => setEditing(false)} disabled={busy}>Cancel</button>
            <button style={btn(true)} onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
