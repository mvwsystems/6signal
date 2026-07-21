"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Radar, Ring, SignalBars, LineChart, Donut, Sparkline, MapHeatGrid } from "../components/charts";

// ─────────────────────────────────────────────────────────────────────────────
// 6 Signal — internal AI Visibility Command Center (/dashboard)
// Shared-password gated. Self-contained inline styling in the 6 Signal palette
// (no globals.css changes). Reuses the live server-side audit engine for scans.
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  bg: "#060606",
  surface: "#0e0e0c",
  panel: "#0e0e0c",
  panel2: "#141412",
  border: "rgba(255,255,255,0.07)",
  borderH: "rgba(255,255,255,0.16)",
  accent: "#E6FF00",
  text: "#f5f5f3",
  textSub: "#a8a8a3",
  muted: "#6a6a64",
  danger: "#ef4444",
  warn: "#f97316",
  ok: "#22c55e",
};

const MONO = "'JetBrains Mono', ui-monospace, monospace";
const DISP = "'Chakra Petch', sans-serif";
const BODY = "'Inter', sans-serif";

const SIGNALS = [
  { key: "geo", label: "GEO", full: "Generative Engine Optimization" },
  { key: "aeo", label: "AEO", full: "Answer Engine Optimization" },
  { key: "leo", label: "LEO", full: "Local Entity Optimization" },
  { key: "veo", label: "VEO", full: "Voice Engine Optimization" },
  { key: "peo", label: "PEO", full: "Prompt Engine Optimization" },
  { key: "ieo", label: "IEO", full: "Index Engine Optimization" },
];

// 0–100 thresholds — same language as the customer-facing brief.
const scoreColor = (s: number) => (s < 45 ? T.danger : s < 60 ? T.warn : s < 75 ? "#eab308" : T.ok);
const tierOf = (s: number) =>
  s < 45 ? { label: "Invisible", color: T.danger }
  : s < 60 ? { label: "Emerging", color: T.warn }
  : s < 75 ? { label: "Visible", color: "#eab308" }
  : { label: "Dominant", color: T.ok };
const effortColor = (e: string) => (e === "LOW" ? T.ok : e === "MEDIUM" ? "#eab308" : T.warn);

const fmtMoney = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const fmtDate = (s?: string) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
  } catch {
    return "—";
  }
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface Biz { id: string; name: string; url: string | null; trade: string; city: string; contact_email?: string | null; created_at: string }
interface AuditRow { id: string; business_id: string | null; tier: string; overall_score: number | null; status: string; created_at: string }
interface ScoreRow { audit_id: string; signal: string; score: number }
interface LeadRow { id: string; business_id: string | null; email: string; source: string; created_at: string }
interface PurchaseRow { amount_total: number | null; product: string; email: string | null; created_at: string }
interface Overview { businesses: Biz[]; audits: AuditRow[]; signalScores: ScoreRow[]; leads: LeadRow[]; purchases: PurchaseRow[] }

// Chart primitives (Radar, Ring, SignalBars, LineChart, Donut, Sparkline) live
// in app/components/charts.tsx — imported at the top of this file.

// ─── Shared bits ───────────────────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 2, padding: 20, ...extra });
const btn = (primary?: boolean): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 18px", borderRadius: 2, cursor: "pointer",
  fontFamily: DISP, fontSize: 13, fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase",
  border: `1px solid ${primary ? T.accent : T.border}`, background: primary ? T.accent : "transparent", color: primary ? "#060606" : T.text,
});
const inputStyle: React.CSSProperties = { background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontFamily: BODY, fontSize: 14, padding: "11px 14px", borderRadius: 2, outline: "none", width: "100%" };
const eyebrow: React.CSSProperties = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: T.muted };

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={card({ display: "flex", flexDirection: "column", gap: 8 })}>
      <span style={eyebrow}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, color: accent ? T.accent : T.text }}>{value}</span>
    </div>
  );
}

// ─── Login gate ────────────────────────────────────────────────────────────────
function Login({ onAuthed, configured }: { onAuthed: () => void; configured: boolean }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/dashboard/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
      if (r.ok) { onAuthed(); return; }
      const d = await r.json().catch(() => ({}));
      setErr(d.error || "Incorrect password.");
    } catch { setErr("Something went wrong."); }
    finally { setBusy(false); }
  };
  return (
    <div className="dash-root" style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={card({ width: 380, maxWidth: "100%" })}>
        <img src="/6SIGDashboardLogo.png" alt="6 Signal" style={{ height: 34, width: "auto", display: "block", marginBottom: 14 }} />
        <h1 style={{ fontFamily: DISP, fontSize: 22, fontWeight: 700, color: T.text, margin: "0 0 4px" }}>Command Center</h1>
        <p style={{ fontFamily: BODY, fontSize: 13, color: T.muted, margin: "0 0 20px" }}>Internal access only.</p>
        {!configured && <p style={{ fontSize: 12, color: T.warn, marginBottom: 12 }}>No dashboard password is set on the server (DASHBOARD_PASSWORD).</p>}
        <input type="password" value={pw} placeholder="Password" style={inputStyle}
          onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !busy && submit()} />
        {err && <div style={{ fontSize: 12, color: T.danger, marginTop: 10 }}>{err}</div>}
        <button style={{ ...btn(true), width: "100%", marginTop: 16, opacity: busy ? 0.5 : 1 }} onClick={submit} disabled={busy}>
          {busy ? "Checking…" : "Enter"}
        </button>
      </div>
    </div>
  );
}

// ─── Shared report runner (scan / battle plan / 90-day plan) ─────────────────────
function signalView(data: any) {
  const scores: Record<string, number> = {};
  const findings: Record<string, { finding?: string; gap?: string }> = {};
  if (data?.signals) for (const k of Object.keys(data.signals)) { scores[k] = Number(data.signals[k]?.score) || 0; findings[k] = { finding: data.signals[k]?.finding, gap: data.signals[k]?.gap }; }
  const overall = Number(data?.overall?.score) || 0;
  return { scores, findings, overall, tier: tierOf(overall) };
}

function ReportRunner({ cta, subtitle, longNote, endpoint, render, businesses = [], historyPrefix }: {
  cta: string; subtitle: string; longNote: string; endpoint: string;
  render: (data: any, form: Record<string, string>) => React.ReactNode;
  businesses?: Biz[];
  historyPrefix?: string; // prompt_version prefix, e.g. "battleplan"
}) {
  const [form, setForm] = useState({ name: "", url: "", trade: "", city: "" });
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<{ id: string; created_at: string; overall_score: number | null }[]>([]);

  // Every report is stored permanently — when the typed name matches a known
  // business, list its past reports of this kind so any of them reopens.
  const matchedBiz = businesses.find((b) => b.name.toLowerCase() === form.name.toLowerCase()) || null;
  useEffect(() => {
    if (!matchedBiz || !historyPrefix) { setHistory([]); return; }
    fetch(`/api/dashboard/reports?businessId=${matchedBiz.id}`)
      .then((r) => r.json())
      .then((d) => setHistory((d.reports ?? []).filter((r: any) => String(r.prompt_version ?? "").startsWith(historyPrefix)).map((r: any) => ({ id: r.id, created_at: r.created_at, overall_score: r.overall_score }))))
      .catch(() => setHistory([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedBiz?.id, historyPrefix, data]);

  const openPast = async (id: string) => {
    setErr(null); setRunning(true); setData(null);
    try {
      const r = await fetch(`/api/audit/${id}`);
      const saved = await r.json().catch(() => null);
      if (!saved?.payload) throw new Error("Could not load that report.");
      setData({ id, ...saved.payload });
    } catch (e: any) { setErr(e?.message || "Could not load that report."); }
    finally { setRunning(false); }
  };
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  // Picking an existing business autofills its exact url/trade/city — the #1
  // source of duplicate business rows was retyping "TX" as "Texas" etc.
  const setName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const match = businesses.find((b) => b.name.toLowerCase() === v.toLowerCase());
    // Keep an already-typed URL if the matched record has none on file.
    if (match) setForm((f) => ({ name: match.name, url: match.url || f.url, trade: match.trade, city: match.city }));
    else setForm((f) => ({ ...f, name: v }));
  };
  const ready = form.name && form.url && form.trade && form.city;

  const run = async () => {
    if (!ready) return;
    setRunning(true); setErr(null); setData(null);
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Server error ${r.status}`);
      }
      // The route only ENQUEUES (the heavy work runs in a background function
      // with a 15-min runtime — request lambdas get killed ~60s in on this
      // host). We get { pending: auditId } instantly, then poll the permalink
      // API until the finished report lands (typically 1.5–4 minutes).
      const d0 = await r.json();
      const pendingId = d0.pending;
      if (!pendingId) {
        if (d0.error) throw new Error(d0.error);
        setData(d0);
        return;
      }
      for (let i = 0; i < 60; i++) {
        await new Promise((res) => setTimeout(res, 8000));
        const pr = await fetch(`/api/audit/${pendingId}`);
        if (!pr.ok) continue;
        const saved = await pr.json().catch(() => null);
        if (saved?.payload) { setData({ id: pendingId, ...saved.payload }); return; }
        if (saved?.status === "failed") throw new Error("The report run failed server-side — hit the button again to retry.");
      }
      throw new Error("Timed out after 8 minutes — check Overview shortly; the report may still land.");
    } catch (e: any) { setErr(e?.message || "Request failed."); }
    finally { setRunning(false); }
  };

  return (
    <div className="m1col" style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>
      <div style={card()}>
        <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{cta}</div>
        <div style={{ ...eyebrow, marginBottom: 16 }}>{subtitle}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={inputStyle} placeholder="Business name" value={form.name} onChange={setName} list="rr-biz-list" />
          <datalist id="rr-biz-list">
            {businesses.map((b) => <option key={b.id} value={b.name} />)}
          </datalist>
          <input style={inputStyle} placeholder="Website (e.g. acme.com)" value={form.url} onChange={set("url")} />
          <input style={inputStyle} placeholder="Trade (e.g. Plumbing)" value={form.trade} onChange={set("trade")} />
          <input style={inputStyle} placeholder="City / market" value={form.city} onChange={set("city")} />
          <button style={{ ...btn(true), width: "100%", opacity: running || !ready ? 0.5 : 1 }} onClick={run} disabled={running || !ready}>
            {running ? "Working…" : cta}
          </button>
        </div>
        {running && <p style={{ fontSize: 12, color: T.muted, marginTop: 12, lineHeight: 1.5 }}>{longNote}</p>}
        {history.length > 0 && (
          <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
            <div style={{ ...eyebrow, marginBottom: 8 }}>Past reports — click to reopen</div>
            {history.map((h) => (
              <button key={h.id} onClick={() => openPast(h.id)}
                style={{ display: "flex", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "5px 0", fontFamily: MONO, fontSize: 12, color: T.textSub }}>
                <span>{String(h.created_at).slice(0, 10)}</span>
                <span style={{ color: h.overall_score != null ? scoreColor(Number(h.overall_score)) : T.muted }}>{h.overall_score ?? "—"}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        {err && <div style={card({ borderColor: `${T.danger}66`, marginBottom: 16 })}><span style={{ color: T.danger, fontSize: 13 }}>{err}</span></div>}
        {!data && !running && !err && (
          <div style={card({ padding: 56, textAlign: "center", border: `1px dashed ${T.border}` })}>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{cta}</div>
            <p style={{ fontSize: 14, color: T.muted, maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>{subtitle}. Enter a business and run it — saved automatically and fed into Overview + trend.</p>
          </div>
        )}
        {running && !data && (
          <div style={card({ padding: 56, textAlign: "center" })}>
            <div style={{ fontFamily: MONO, color: T.accent, fontSize: 13 }}>Working on {form.name}…</div>
            <p style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>{longNote}</p>
          </div>
        )}
        {data && (
          <div className="dash-print-area">
            <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}><PrintBtn /></div>
            {render(data, form)}
          </div>
        )}
      </div>
    </div>
  );
}

const ownerColor = (o?: string) => (String(o).toLowerCase().includes("client") ? T.textSub : T.accent);

function PrintBtn() {
  return <button className="no-print" onClick={() => window.print()} style={{ ...btn(), padding: "6px 12px" }}>Download PDF</button>;
}

// ─── Client report render (baseline + monthly editions) ───
function renderClientReport(data: any) {
  const m = data?.metrics;
  const n = data?.narrative;
  const bar = (label: string, rate: number | null, prev: number | null) => rate == null ? null : (
    <div key={label} style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: T.text }}>{label}</span>
        <span style={{ fontFamily: MONO, fontSize: 13, color: scoreColor(rate) }}>{rate}%{prev != null ? <span style={{ color: T.muted }}> · was {prev}%</span> : null}</span>
      </div>
      <div style={{ height: 6, background: T.border }}><div data-keep style={{ height: "100%", width: `${rate}%`, background: scoreColor(rate) }} /></div>
    </div>
  );
  return (
    <div>
      <div style={card({ marginBottom: 16, borderColor: `${T.accent}44` })}>
        <div style={{ ...eyebrow, marginBottom: 6 }}>{data?.period_label}{data?.is_baseline ? " · starting line" : ""}</div>
        <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 22, marginBottom: 6 }}>{data?.business?.name}</div>
        {n?.headline && <p style={{ fontFamily: DISP, fontWeight: 700, fontSize: 16, color: T.text, margin: "0 0 8px", lineHeight: 1.4 }}>{n.headline}</p>}
        {n?.summary && <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.7, margin: "0 0 8px" }}>{n.summary}</p>}
        {n?.what_this_means && <p style={{ fontSize: 14, color: T.textSub, lineHeight: 1.7, margin: 0 }}>{n.what_this_means}</p>}
      </div>
      {m && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
          <div style={card()}><div style={eyebrow}>Named by AI</div><div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, color: m.mention_rate != null ? scoreColor(m.mention_rate) : T.muted, marginTop: 6 }}>{m.mention_rate ?? "—"}%</div><div style={{ fontSize: 11, color: T.muted }}>{m.mention_rate_prev != null ? `was ${m.mention_rate_prev}%` : "of tracked buyer questions"}</div></div>
          <div style={card()}><div style={eyebrow}>Share of voice</div><div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, color: T.accent, marginTop: 6 }}>{m.share_of_voice ?? "—"}%</div><div style={{ fontSize: 11, color: T.muted }}>vs competitors in AI answers</div></div>
          <div style={card()}><div style={eyebrow}>Plan progress</div><div style={{ fontFamily: MONO, fontSize: 26, fontWeight: 700, color: T.text, marginTop: 6 }}>{m.tasks_done}/{m.tasks_total}</div><div style={{ fontSize: 11, color: T.muted }}>work items done</div></div>
        </div>
      )}
      {m?.engines && (
        <div style={card({ marginBottom: 16 })}>
          <div style={{ ...eyebrow, marginBottom: 14 }}>Engine by engine</div>
          {ENGINE_KEYS.map((e) => bar(ENGINE_LABELS[e] ?? e, m.engines[e]?.rate ?? null, m.engines[e]?.prev ?? null))}
        </div>
      )}
      {data?.wins?.length > 0 && (
        <div style={card({ marginBottom: 16, borderColor: `${T.ok}44` })}>
          <div style={{ ...eyebrow, color: T.ok, marginBottom: 10 }}>New wins</div>
          {data.wins.map((w: string, i: number) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ color: T.ok }}>✓</span><span style={{ fontSize: 13, color: T.text }}>{w}</span></div>)}
        </div>
      )}
      <div className="m1col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {n?.focus_next?.length > 0 && <div style={card()}><div style={{ ...eyebrow, marginBottom: 10 }}>What we&rsquo;re doing next</div>{n.focus_next.map((f: string, i: number) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ color: T.accent }}>•</span><span style={{ fontSize: 13, color: T.textSub }}>{f}</span></div>)}</div>}
        {n?.client_actions?.length > 0 && <div style={card({ borderColor: `${T.accent}44` })}><div style={{ ...eyebrow, color: T.accent, marginBottom: 10 }}>What we need from the client</div>{n.client_actions.map((a: string, i: number) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ color: T.accent }}>→</span><span style={{ fontSize: 13, color: T.text }}>{a}</span></div>)}</div>}
      </div>
    </div>
  );
}

// ─── Scan render ───
function renderScan(data: any, form: Record<string, string>) {
  const { scores, findings, overall, tier } = signalView(data);
  const trade = data?.business?.trade || form.trade;
  const city = data?.business?.city || form.city;
  return (
    <div>
      <div style={card({ display: "flex", gap: 24, alignItems: "center", marginBottom: 16, borderColor: `${tier.color}55` })}>
        <Ring score={overall} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 20 }}>{data?.business?.name || form.name}</span>
            <span style={{ background: `${tier.color}1f`, color: tier.color, fontWeight: 700, fontSize: 11, padding: "3px 10px", borderRadius: 20, border: `1px solid ${tier.color}55`, fontFamily: MONO }}>{tier.label}</span>
            <span style={{ background: data?.business?.found ? `${T.ok}1f` : `${T.danger}1f`, color: data?.business?.found ? T.ok : T.danger, fontWeight: 700, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontFamily: MONO }}>{data?.business?.found ? "NAMED BY AI" : "NOT NAMED"}</span>
          </div>
          <div style={{ fontSize: 13, color: T.muted }}>{[trade, city, form.url].filter(Boolean).join(" · ")}</div>
        </div>
        <Radar scores={scores} size={180} />
      </div>
      {data?.ai_answer && (
        <div style={card({ marginBottom: 16, borderColor: `${T.accent}33` })}>
          <div style={{ ...eyebrow, marginBottom: 8 }}>What AI says — &ldquo;best {trade} in {city}&rdquo;</div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: T.text, margin: 0 }}>{data.ai_answer}</p>
          {Array.isArray(data?.competitors) && data.competitors.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {data.competitors.map((c: string, i: number) => <span key={i} style={{ fontFamily: MONO, fontSize: 11, color: T.textSub, border: `1px solid ${T.border}`, padding: "3px 10px" }}>{c}</span>)}
            </div>
          )}
        </div>
      )}
      {(data?.top_opportunity || data?.immediate_win) && (
        <div className="m1col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {data?.top_opportunity && <div style={card()}><div style={{ ...eyebrow, color: T.ok, marginBottom: 6 }}>Top opportunity</div><p style={{ fontSize: 13, lineHeight: 1.5, color: T.text, margin: 0 }}>{data.top_opportunity}</p></div>}
          {data?.immediate_win && <div style={card()}><div style={{ ...eyebrow, color: T.accent, marginBottom: 6 }}>Immediate win</div><p style={{ fontSize: 13, lineHeight: 1.5, color: T.text, margin: 0 }}>{data.immediate_win}</p></div>}
        </div>
      )}
      <div style={card()}><div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Signal breakdown</div><SignalBars scores={scores} findings={findings} /></div>
    </div>
  );
}

// ─── Battle plan render ───
function renderBattlePlan(data: any, form: Record<string, string>) {
  const { scores, findings, overall, tier } = signalView(data);
  const b = data?.business ?? {};
  const trade = b.trade || form.trade, city = b.city || form.city;
  const badge = (text: string, color: string) => <span style={{ background: `${color}1f`, color, fontWeight: 700, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontFamily: MONO }}>{text}</span>;
  return (
    <div>
      <div style={card({ display: "flex", gap: 24, alignItems: "center", marginBottom: 16, borderColor: `${tier.color}55` })}>
        <Ring score={overall} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 20 }}>{b.name || form.name}</span>
            {badge(tier.label, tier.color)}
            {badge(b.found ? "NAMED BY AI" : "NOT NAMED", b.found ? T.ok : T.danger)}
            {b.ai_status && badge(b.ai_status, T.textSub)}
            {b.risk && badge(`${b.risk} RISK`, b.risk === "CRITICAL" ? T.danger : b.risk === "HIGH" ? T.warn : T.textSub)}
          </div>
          <div style={{ fontSize: 13, color: T.muted }}>{[trade, city, form.url].filter(Boolean).join(" · ")}</div>
          {data?.headline && <p style={{ fontSize: 15, color: T.text, lineHeight: 1.5, marginTop: 10, marginBottom: 0 }}>{data.headline}</p>}
        </div>
        <Radar scores={scores} size={180} />
      </div>

      {data?.ai_answer && <div style={card({ marginBottom: 16, borderColor: `${T.accent}33` })}><div style={{ ...eyebrow, marginBottom: 8 }}>What AI says — &ldquo;best {trade} in {city}&rdquo;</div><p style={{ fontSize: 14, lineHeight: 1.6, color: T.text, margin: 0 }}>{data.ai_answer}</p></div>}

      {data?.local_audit && (
        <div style={card({ marginBottom: 16 })}>
          <div style={{ ...eyebrow, marginBottom: 10 }}>Local / GBP audit</div>
          <div style={{ display: "flex", gap: 24, marginBottom: 10, flexWrap: "wrap" }}>
            <div><span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: T.text }}>{String(data.local_audit.rating ?? "—")}</span><span style={{ fontSize: 12, color: T.muted, marginLeft: 6 }}>rating</span></div>
            <div><span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: T.text }}>{String(data.local_audit.reviews ?? "—")}</span><span style={{ fontSize: 12, color: T.muted, marginLeft: 6 }}>reviews</span></div>
          </div>
          {data.local_audit.gbp_finding && <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5, margin: "0 0 6px" }}>{data.local_audit.gbp_finding}</p>}
          {data.local_audit.review_velocity_gap && <p style={{ fontSize: 13, color: T.warn, lineHeight: 1.5, margin: 0 }}>↳ {data.local_audit.review_velocity_gap}</p>}
        </div>
      )}

      {Array.isArray(data?.competitor_teardown) && data.competitor_teardown.length > 0 && (
        <div style={card({ marginBottom: 16 })}>
          <div style={{ ...eyebrow, marginBottom: 12 }}>Competitor teardown</div>
          {data.competitor_teardown.map((c: any, i: number) => (
            <div key={i} style={{ borderTop: i ? `1px solid ${T.border}` : "none", paddingTop: i ? 12 : 0, marginTop: i ? 12 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{c.name}</span>
                {c.threat && <span style={{ fontFamily: MONO, fontSize: 10, color: c.threat === "HIGH" ? T.danger : T.warn }}>{c.threat} THREAT</span>}
              </div>
              <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5, margin: "0 0 4px" }}>{c.why_winning}</p>
              {c.what_they_have && <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5, margin: 0 }}>Has: {c.what_they_have}</p>}
            </div>
          ))}
        </div>
      )}

      {data?.buyer_journey && (
        <div style={card({ marginBottom: 16 })}>
          <div style={{ ...eyebrow, marginBottom: 8 }}>Buyer journey</div>
          {data.buyer_journey.persona && <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.5, marginTop: 0, marginBottom: 14 }}>{data.buyer_journey.persona}</p>}
          {Array.isArray(data.buyer_journey.stages) && data.buyer_journey.stages.map((s: any, i: number) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: T.accent }}>{s.label || `Stage ${s.stage}`}</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: s.is_business_present ? T.ok : T.danger }}>{s.is_business_present ? "PRESENT" : "ABSENT"}</span>
              </div>
              {s.buyer_question && <p style={{ fontSize: 13, color: T.text, margin: "4px 0 2px", fontStyle: "italic" }}>&ldquo;{s.buyer_question}&rdquo;</p>}
              {s.who_answers_now && <p style={{ fontSize: 12, color: T.muted, margin: "0 0 2px" }}>Answered by: {s.who_answers_now}</p>}
              {s.gap && <p style={{ fontSize: 12, color: T.warn, margin: 0 }}>↳ {s.gap}</p>}
            </div>
          ))}
        </div>
      )}

      <div style={card({ marginBottom: 16 })}><div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Signal breakdown</div><SignalBars scores={scores} findings={findings} /></div>

      {Array.isArray(data?.content_gaps) && data.content_gaps.length > 0 && (
        <div style={card({ marginBottom: 16 })}>
          <div style={{ ...eyebrow, marginBottom: 12 }}>Content gaps</div>
          {data.content_gaps.map((c: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: c.priority === "HIGH" ? T.danger : T.warn, minWidth: 56 }}>{c.priority}</span>
              <div><span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.content_type}</span>{c.why_it_matters && <span style={{ fontSize: 13, color: T.textSub }}> — {c.why_it_matters}</span>}</div>
            </div>
          ))}
        </div>
      )}

      {Array.isArray(data?.priority_roadmap) && data.priority_roadmap.length > 0 && (
        <div style={card({ marginBottom: 16 })}>
          <div style={{ ...eyebrow, marginBottom: 12 }}>Priority roadmap</div>
          {data.priority_roadmap.map((r: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 14, color: T.accent, minWidth: 18 }}>{r.rank ?? i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 2 }}>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: T.muted }}>{r.timeframe}</span>
                  {r.effort && <span style={{ fontFamily: MONO, fontSize: 11, color: effortColor(r.effort) }}>{r.effort}</span>}
                </div>
                <p style={{ fontSize: 13, color: T.text, margin: "0 0 2px" }}>{r.action}</p>
                {r.expected_impact && <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>→ {r.expected_impact}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {Array.isArray(data?.pitch_angles) && data.pitch_angles.length > 0 && (
        <div style={card({ marginBottom: 16, borderColor: `${T.accent}55`, background: `${T.accent}0a` })}>
          <div style={{ ...eyebrow, color: T.accent, marginBottom: 12 }}>Pitch angles — use these on the call</div>
          {data.pitch_angles.map((p: string, i: number) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: MONO, fontWeight: 700, color: T.accent }}>{i + 1}.</span>
              <span style={{ fontSize: 14, color: T.text, lineHeight: 1.5 }}>{p}</span>
            </div>
          ))}
        </div>
      )}

      {data?.cost_of_inaction && <div style={card({ borderColor: `${T.danger}55` })}><div style={{ ...eyebrow, color: T.danger, marginBottom: 6 }}>Cost of inaction</div><p style={{ fontSize: 13, color: T.text, lineHeight: 1.5, margin: 0 }}>{data.cost_of_inaction}</p></div>}
    </div>
  );
}

// ─── 90-day execution plan render ───
function renderExecPlan(data: any, form: Record<string, string>) {
  const b = data?.business ?? {};
  return (
    <div>
      <div style={card({ marginBottom: 16, borderColor: `${T.accent}55` })}>
        <div style={{ ...eyebrow, marginBottom: 6 }}>90-Day Execution Plan — {b.name || form.name}</div>
        {data?.north_star && <p style={{ fontFamily: DISP, fontWeight: 700, fontSize: 18, color: T.text, margin: "0 0 12px", lineHeight: 1.35 }}>{data.north_star}</p>}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Ring score={Number(data?.current_overall) || 0} size={84} />
          <span style={{ fontFamily: MONO, fontSize: 22, color: T.muted }}>→</span>
          <Ring score={Number(data?.target_overall_90d) || 0} size={84} />
          <span style={{ fontSize: 12, color: T.muted }}>current → day 90 target</span>
        </div>
      </div>

      {Array.isArray(data?.signal_targets) && data.signal_targets.length > 0 && (
        <div style={card({ marginBottom: 16 })}>
          <div style={{ ...eyebrow, marginBottom: 12 }}>Signal targets</div>
          {data.signal_targets.map((s: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: T.text, minWidth: 44 }}>{s.signal}</span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: scoreColor(Number(s.current) || 0) }}>{s.current}</span>
              <span style={{ color: T.muted }}>→</span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: scoreColor(Number(s.target_90d) || 0) }}>{s.target_90d}</span>
            </div>
          ))}
        </div>
      )}

      {Array.isArray(data?.phases) && data.phases.map((p: any, i: number) => (
        <div key={i} style={card({ marginBottom: 16 })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, color: T.accent }}>{p.phase}</span>
            {p.milestone && <span style={{ fontSize: 12, color: T.muted }}>Milestone: {p.milestone}</span>}
          </div>
          {p.focus && <p style={{ fontSize: 13, color: T.textSub, margin: "0 0 12px", lineHeight: 1.5 }}>{p.focus}</p>}
          {Array.isArray(p.deliverables) && p.deliverables.map((d: any, j: number) => (
            <div key={j} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "baseline" }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: ownerColor(d.owner), minWidth: 56 }}>{d.owner}</span>
              {d.signal && <span style={{ fontFamily: MONO, fontSize: 10, color: T.muted, minWidth: 34 }}>{d.signal}</span>}
              <div><span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{d.task}</span>{d.detail && <span style={{ fontSize: 13, color: T.textSub }}> — {d.detail}</span>}</div>
            </div>
          ))}
        </div>
      ))}

      {Array.isArray(data?.content_plan) && data.content_plan.length > 0 && (
        <div style={card({ marginBottom: 16 })}>
          <div style={{ ...eyebrow, marginBottom: 12 }}>Content to build</div>
          {data.content_plan.map((c: any, i: number) => (
            <div key={i} style={{ borderTop: i ? `1px solid ${T.border}` : "none", paddingTop: i ? 12 : 0, marginTop: i ? 12 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{c.page_title}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, color: T.muted }}>{c.url_slug}</span>
              </div>
              {c.h1 && <p style={{ fontSize: 13, color: T.textSub, margin: "4px 0 2px" }}>H1: {c.h1}</p>}
              {c.purpose && <p style={{ fontSize: 12, color: T.muted, margin: "0 0 4px" }}>{c.purpose}</p>}
              {Array.isArray(c.faqs) && c.faqs.length > 0 && <ul style={{ margin: "4px 0 0", paddingLeft: 18, color: T.textSub, fontSize: 12 }}>{c.faqs.map((q: string, k: number) => <li key={k}>{q}</li>)}</ul>}
            </div>
          ))}
        </div>
      )}

      {Array.isArray(data?.schema_plan) && data.schema_plan.length > 0 && (
        <div style={card({ marginBottom: 16 })}>
          <div style={{ ...eyebrow, marginBottom: 12 }}>Schema</div>
          {data.schema_plan.map((s: any, i: number) => (
            <div key={i} style={{ borderTop: i ? `1px solid ${T.border}` : "none", paddingTop: i ? 12 : 0, marginTop: i ? 12 : 0 }}>
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: T.accent }}>{s.type}</span>
              {s.why && <p style={{ fontSize: 12, color: T.textSub, margin: "4px 0" }}>{s.why}</p>}
              {Array.isArray(s.required_fields) && <div style={{ fontFamily: MONO, fontSize: 11, color: T.muted }}>{s.required_fields.join(" · ")}</div>}
            </div>
          ))}
        </div>
      )}

      {data?.gbp_plan && (
        <div style={card({ marginBottom: 16 })}>
          <div style={{ ...eyebrow, marginBottom: 12 }}>Google Business Profile</div>
          {Array.isArray(data.gbp_plan.actions) && data.gbp_plan.actions.map((a: string, i: number) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ color: T.accent }}>•</span><span style={{ fontSize: 13, color: T.text }}>{a}</span></div>
          ))}
          {data.gbp_plan.review_script && (
            <div style={{ marginTop: 10, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 2, padding: 12 }}>
              <div style={{ ...eyebrow, marginBottom: 6 }}>Review request script</div>
              <p style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{data.gbp_plan.review_script}</p>
            </div>
          )}
        </div>
      )}

      {Array.isArray(data?.quick_wins) && data.quick_wins.length > 0 && (
        <div style={card({ marginBottom: 16 })}>
          <div style={{ ...eyebrow, marginBottom: 12 }}>Quick wins</div>
          {data.quick_wins.map((w: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: MONO, fontWeight: 700, color: T.accent }}>{i + 1}.</span>
              <div><span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{w.win}</span>{w.impact && <span style={{ fontSize: 13, color: T.textSub }}> — {w.impact}</span>}{w.effort && <span style={{ fontFamily: MONO, fontSize: 11, color: T.muted }}> · {w.effort}</span>}</div>
            </div>
          ))}
        </div>
      )}

      {data?.measurement && <div style={card()}><div style={{ ...eyebrow, marginBottom: 6 }}>How we prove day-90 results</div><p style={{ fontSize: 13, color: T.text, lineHeight: 1.5, margin: 0 }}>{data.measurement}</p></div>}
    </div>
  );
}

// ─── Prospects batch scanner ───
function ProspectsTab() {
  const [text, setText] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const queue = async () => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setBusy(true); setLog([]);
    for (const line of lines) {
      const parts = line.split(/\s*[|,]\s*/);
      if (parts.length < 4) { setLog((L) => [...L, `✗ "${line}" — format: Name | website | Trade | City`]); continue; }
      const [name, url, trade, ...cityParts] = parts;
      const city = cityParts.join(", ");
      try {
        const r = await fetch("/api/dashboard/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, url, trade, city }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `error ${r.status}`);
        setLog((L) => [...L, `✓ ${name} — scan queued`]);
      } catch (e: any) { setLog((L) => [...L, `✗ ${name} — ${e?.message}`]); }
    }
    setLog((L) => [...L, "Scans run in the background (~2–4 min each). Results land in Overview — open a prospect there and hit “Draft outreach email”."]);
    setBusy(false);
  };
  return (
    <div style={{ maxWidth: 760 }}>
      <div style={card()}>
        <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Prospect batch scanner</div>
        <div style={{ ...eyebrow, marginBottom: 14 }}>One prospect per line: Name | website | Trade | City</div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={8}
          placeholder={"Combat Plumbing | combatplumbing.com | Plumbing | Red Oak, TX\nAcme HVAC | acmehvac.com | HVAC | Waxahachie, TX"}
          style={{ ...inputStyle, fontFamily: MONO, fontSize: 12, resize: "vertical" }} />
        <button style={{ ...btn(true), marginTop: 12, opacity: busy ? 0.5 : 1 }} onClick={queue} disabled={busy}>
          {busy ? "Queueing…" : "Queue scans"}
        </button>
        {log.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {log.map((l, i) => <div key={i} style={{ fontFamily: MONO, fontSize: 12, color: l.startsWith("✗") ? T.danger : T.textSub, marginBottom: 4 }}>{l}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

function ScanTab({ businesses }: { businesses: Biz[] }) {
  return <ReportRunner businesses={businesses} historyPrefix="scan" cta="Run scan" subtitle="Fast live triage" endpoint="/api/dashboard/scan" longNote="Runs in the background — crawl + live web search. Result appears here in ~1–3 min." render={renderScan} />;
}
function BattlePlanTab({ businesses }: { businesses: Biz[] }) {
  return <ReportRunner businesses={businesses} historyPrefix="battleplan" cta="Build battle plan" subtitle="Deep pre-meeting intel" endpoint="/api/dashboard/battle-plan" longNote="Runs in the background — deep research + competitor teardown. Result appears here in ~2–4 min." render={renderBattlePlan} />;
}
function ExecPlanTab({ businesses }: { businesses: Biz[] }) {
  return <ReportRunner businesses={businesses} historyPrefix="execplan" cta="Build 90-day plan" subtitle="Post-signing execution plan" endpoint="/api/dashboard/execution-plan" longNote="Runs in the background — market research + phased plan. Result appears here in ~2–4 min." render={renderExecPlan} />;
}

// ─── Tracking tab (continuous multi-engine visibility) ───────────────────────────
const ENGINE_LABELS: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude", perplexity: "Perplexity", gemini: "Gemini", "google-ai": "AI Overviews", maps: "Maps" };
const ENGINE_KEYS = ["chatgpt", "claude", "perplexity", "gemini", "google-ai", "maps"];
const ENGINE_COLORS: Record<string, string> = { chatgpt: "#5ad1ff", claude: "#e8825a", perplexity: "#b48aff", gemini: "#ffd166", "google-ai": "#6ee7b7", maps: "#f472b6" };
const COMP_COLORS = ["#74746e", "#8e8e86", "#a8a8a0", "#c2c2b8", "#dcdcd2"];

// LineChart, Donut, and Sparkline are imported from app/components/charts.tsx.

// ─── Map coverage radar (geo-grid Maps ranking) ──────────────────────────────────
interface GridScan {
  id: string; keyword: string; grid_size: number; spacing_miles: number;
  center: { lat?: number; lng?: number; label?: string }; points: { lat?: number; lng?: number; rank: number | null; top: string[] }[];
  stats: { present: number; top3: number; top10: number; total: number; avg_rank: number | null; coverage: number };
  created_at: string;
}

function MapGridCard({ bizId, trade }: { bizId: string; trade: string }) {
  const [scans, setScans] = useState<GridScan[]>([]);
  const [viewing, setViewing] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [chartW, setChartW] = useState(440);

  useEffect(() => {
    const fit = () => setChartW(Math.min(440, window.innerWidth - 60));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const load = useCallback(async () => {
    const d = await fetch(`/api/dashboard/maps-grid?businessId=${bizId}`).then((r) => r.json()).catch(() => null);
    if (d?.scans) setScans(d.scans);
    return d?.scans ?? [];
  }, [bizId]);

  useEffect(() => { setScans([]); setViewing(0); setMsg(null); setErr(null); load(); }, [bizId, load]);

  const run = async () => {
    setBusy(true); setErr(null); setMsg(null);
    const prevNewest = scans[0]?.id ?? null;
    try {
      const r = await fetch("/api/dashboard/maps-grid", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: bizId, keyword: keyword.trim() || undefined }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `error ${r.status}`);
      setMsg("Scanning 25 points across the market — takes about a minute…");
      for (let i = 0; i < 30; i++) {
        await new Promise((res) => setTimeout(res, 8000));
        const fresh = await load();
        if (fresh[0] && fresh[0].id !== prevNewest) { setViewing(0); setMsg(null); break; }
        if (i === 29) setMsg("Still running — refresh this tab in a minute.");
      }
    } catch (e: any) { setErr(e?.message || "Scan failed"); setMsg(null); } finally { setBusy(false); }
  };

  const scan = scans[viewing] ?? null;
  const prior = scans[viewing + 1] ?? null;
  const delta = scan && prior ? scan.stats.coverage - prior.stats.coverage : null;
  const LEGEND = [
    { c: T.ok, l: "Top 3" }, { c: "#eab308", l: "4–10" }, { c: T.warn, l: "11–20" }, { c: T.danger, l: "Not found" },
  ];

  return (
    <div style={card({ marginBottom: 20 })}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={eyebrow}>Map coverage radar</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {scans.length > 1 && (
            <select style={{ ...inputStyle, width: "auto", padding: "7px 10px", fontFamily: MONO, fontSize: 11 }} value={viewing} onChange={(e) => setViewing(Number(e.target.value))}>
              {scans.map((s, i) => <option key={s.id} value={i}>{s.created_at.slice(0, 10)} · “{s.keyword}”</option>)}
            </select>
          )}
          <input style={{ ...inputStyle, width: 180, padding: "7px 10px", fontSize: 13 }} placeholder={`Keyword (${trade.toLowerCase() || "trade"})`} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          <button style={{ ...btn(true), opacity: busy ? 0.5 : 1 }} onClick={run} disabled={busy}>{busy ? "Scanning…" : "Run grid scan"}</button>
        </div>
      </div>
      {err && <div style={{ color: T.danger, fontSize: 13, marginBottom: 8 }}>{err}</div>}
      {msg && <div style={{ fontFamily: MONO, fontSize: 12, color: T.accent, marginBottom: 8 }}>{msg}</div>}
      {!scan && !busy && <p style={{ fontSize: 13, color: T.muted, margin: "8px 0 0" }}>No grid scans yet. One scan checks the map-pack ranking from 25 points across the service area — where the business actually wins on Google Maps, block by block.</p>}
      {scan && (
        <div className="m1col" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "center" }}>
          <MapHeatGrid points={scan.points} center={scan.center?.lat != null && scan.center?.lng != null ? { lat: scan.center.lat, lng: scan.center.lng } : null} gridSize={scan.grid_size} spacingMiles={Number(scan.spacing_miles)} size={chartW} />
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div><div style={eyebrow}>Coverage</div><div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: scoreColor(scan.stats.coverage) }}>{scan.stats.coverage}%</div>{delta != null && delta !== 0 && <div style={{ fontFamily: MONO, fontSize: 11, color: delta > 0 ? T.ok : T.danger }}>{delta > 0 ? "▲" : "▼"} {Math.abs(delta)} pts vs prior</div>}</div>
              <div><div style={eyebrow}>Avg position</div><div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: T.text }}>{scan.stats.avg_rank ?? "—"}</div></div>
              <div><div style={eyebrow}>Top-3 zones</div><div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: T.ok }}>{scan.stats.top3}<span style={{ fontSize: 14, color: T.muted }}>/{scan.stats.total}</span></div></div>
              <div><div style={eyebrow}>Visible</div><div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: T.text }}>{scan.stats.present}<span style={{ fontSize: 14, color: T.muted }}>/{scan.stats.total}</span></div></div>
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
              {LEGEND.map((x) => <span key={x.l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.textSub }}><span data-keep style={{ width: 10, height: 10, borderRadius: 999, background: x.c, display: "inline-block" }} />{x.l}</span>)}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: T.muted, lineHeight: 1.8 }}>
              “{scan.keyword}” · {scan.grid_size}×{scan.grid_size} grid · {Number(scan.spacing_miles)} mi spacing · {scan.created_at.slice(0, 10)}
              {scan.center?.label ? <> · centered on {scan.center.label}</> : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Citation intelligence (which sources AI trusts) ─────────────────────────────
interface CiteRow { domain: string; count: number; engines: string[]; prompts: string[]; owned: boolean }

function CitationCard({ bizId }: { bizId: string }) {
  const [data, setData] = useState<{ rows: CiteRow[]; siteDomain: string | null; ownedInTop: number; topN: number } | null>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/dashboard/citations?businessId=${bizId}`).then((r) => r.json()).then((d) => { if (d?.rows) setData(d); }).catch(() => {});
  }, [bizId]);

  if (!data || !data.rows.length) return null;
  const max = data.rows[0]?.count || 1;
  return (
    <div style={card({ marginBottom: 20 })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
        <span style={eyebrow}>Citation intelligence — the sources AI trusts</span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: data.ownedInTop === 0 ? T.danger : T.ok }}>
          you own {data.ownedInTop} of the top {data.topN}
        </span>
      </div>
      <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
        Domains cited by AI engines when answering this client&rsquo;s tracked buyer questions (latest answers). Getting the client onto — or above — these sources is the citation work order.
      </div>
      {data.rows.map((r) => (
        <div key={r.domain} className="mcite" style={{ display: "grid", gridTemplateColumns: "220px 1fr auto", gap: 12, alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontFamily: MONO, fontSize: 12, color: r.owned ? T.accent : T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {r.domain}{r.owned && <span style={{ marginLeft: 8, fontSize: 9, letterSpacing: "0.15em", color: T.accent }}>YOU</span>}
          </span>
          <div className="mhide" style={{ height: 5, background: T.border, overflow: "hidden" }}>
            <div data-keep style={{ height: "100%", width: `${(100 * r.count) / max}%`, background: r.owned ? T.accent : "#8e8e86" }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: 11, color: T.muted, whiteSpace: "nowrap" }}>
            {r.count}× · {r.engines.map((e) => ENGINE_LABELS[e] ?? e).join(", ")}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Town-level AI visibility (place-name scan across the service area) ──────────
interface TownScanRow {
  id: string; created_at: string;
  towns: { town: string; prompt: string; engines: Partial<Record<string, { ok: boolean; mentioned: boolean; position: number | null }>>; score: number }[];
  stats: { avg_score: number; best_town: string | null; worst_town: string | null; engines_used: string[] };
}

function TownScanCard({ bizId, city }: { bizId: string; city: string }) {
  const [scans, setScans] = useState<TownScanRow[]>([]);
  const [towns, setTowns] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await fetch(`/api/dashboard/ai-towns?businessId=${bizId}`).then((r) => r.json()).catch(() => null);
    if (d?.scans) setScans(d.scans);
    return d?.scans ?? [];
  }, [bizId]);

  useEffect(() => { setScans([]); setMsg(null); setErr(null); setTowns(city.split(",")[0] ?? ""); load(); }, [bizId, city, load]);

  const run = async () => {
    const list = towns.split(",").map((t) => t.trim()).filter(Boolean);
    if (!list.length) return;
    setBusy(true); setErr(null); setMsg(null);
    const prevNewest = scans[0]?.id ?? null;
    try {
      const r = await fetch("/api/dashboard/ai-towns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: bizId, towns: list }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `error ${r.status}`);
      setMsg(`Asking every AI engine about ${list.length} town(s) — ${Math.max(2, list.length)} min or so…`);
      for (let i = 0; i < 45; i++) {
        await new Promise((res) => setTimeout(res, 10000));
        const fresh = await load();
        if (fresh[0] && fresh[0].id !== prevNewest) { setMsg(null); break; }
        if (i === 44) setMsg("Still running — refresh in a couple of minutes.");
      }
    } catch (e: any) { setErr(e?.message || "Scan failed"); setMsg(null); } finally { setBusy(false); }
  };

  const scan = scans[0] ?? null;
  return (
    <div style={card({ marginBottom: 20 })}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
        <span style={eyebrow}>AI visibility by town</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input style={{ ...inputStyle, width: 320, padding: "7px 10px", fontSize: 13 }} placeholder="Towns, comma-separated (Red Oak, Waxahachie, Ferris…)" value={towns} onChange={(e) => setTowns(e.target.value)} />
          <button style={{ ...btn(true), opacity: busy ? 0.5 : 1 }} onClick={run} disabled={busy}>{busy ? "Scanning…" : "Scan towns"}</button>
        </div>
      </div>
      {err && <div style={{ color: T.danger, fontSize: 13, marginBottom: 8 }}>{err}</div>}
      {msg && <div style={{ fontFamily: MONO, fontSize: 12, color: T.accent, marginBottom: 8 }}>{msg}</div>}
      {!scan && !busy && <p style={{ fontSize: 13, color: T.muted, margin: "8px 0 0" }}>AI answers change town by town (&ldquo;best plumber in Waxahachie&rdquo; ≠ &ldquo;…in Red Oak&rdquo;). Scan the whole service area to see where the client is recommended and where they don&rsquo;t exist.</p>}
      {scan && (
        <div className="xscroll">
          <div style={{ fontFamily: MONO, fontSize: 11, color: T.muted, marginBottom: 12 }}>
            {scan.created_at.slice(0, 10)} · avg {scan.stats.avg_score}%{scan.stats.best_town ? ` · strongest: ${scan.stats.best_town}` : ""}{scan.stats.worst_town ? ` · weakest: ${scan.stats.worst_town}` : ""}
          </div>
          <div className="trow" style={{ display: "grid", gridTemplateColumns: `160px 70px repeat(${ENGINE_KEYS.length}, 1fr)`, gap: 0, ...eyebrow, fontSize: 10, padding: "0 0 8px", borderBottom: `1px solid ${T.border}` }}>
            <span>Town</span><span>Score</span>
            {ENGINE_KEYS.map((e) => <span key={e} style={{ textAlign: "center" }}>{ENGINE_LABELS[e]}</span>)}
          </div>
          {scan.towns.map((t) => (
            <div key={t.town} className="trow" style={{ display: "grid", gridTemplateColumns: `160px 70px repeat(${ENGINE_KEYS.length}, 1fr)`, alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, color: T.text }}>{t.town}</span>
              <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: scoreColor(t.score) }}>{t.score}%</span>
              {ENGINE_KEYS.map((e) => {
                const v = t.engines[e];
                return (
                  <span key={e} style={{ textAlign: "center", fontFamily: MONO, fontSize: 13, color: !v || !v.ok ? T.muted : v.mentioned ? T.ok : T.danger }}>
                    {!v || !v.ok ? "—" : v.mentioned ? (v.position ? `#${v.position}` : "✓") : "✗"}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrackingTab({ businesses }: { businesses: Biz[] }) {
  const [bizId, setBizId] = useState("");
  const [prompts, setPrompts] = useState<{ id: string; prompt: string }[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<{ prompt: string; source?: string; volume?: number | null }[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [diag, setDiag] = useState<{ engine: string; ok: boolean; error: string | null; note?: string | null; ms: number }[] | null>(null);

  const biz = businesses.find((b) => b.id === bizId) || null;

  const loadFor = useCallback(async (id: string) => {
    if (!id) return;
    setErr(null);
    try {
      const [pr, rr] = await Promise.all([
        fetch(`/api/dashboard/track/prompts?businessId=${id}`).then((r) => r.json()),
        fetch(`/api/dashboard/track/results?businessId=${id}`).then((r) => r.json()),
      ]);
      setPrompts(pr.prompts ?? []);
      setResults(rr.results ?? []);
    } catch { setErr("Could not load tracking data."); }
  }, []);

  useEffect(() => { if (bizId) loadFor(bizId); else { setPrompts([]); setResults([]); setSuggestions([]); setRunMsg(null); } }, [bizId, loadFor]);

  const addPrompts = async (list: string[]) => {
    const clean = list.map((s) => s.trim()).filter(Boolean);
    if (!clean.length || !bizId) return;
    setBusy("add"); setErr(null);
    try {
      const r = await fetch("/api/dashboard/track/prompts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: bizId, prompts: clean }) });
      const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Add failed");
      setNewPrompt(""); setSuggestions((s) => s.filter((x) => !clean.includes(x.prompt))); await loadFor(bizId);
    } catch (e: any) { setErr(e?.message || "Add failed"); } finally { setBusy(null); }
  };

  const suggest = async () => {
    if (!biz) return;
    setBusy("suggest"); setErr(null);
    try {
      const r = await fetch("/api/dashboard/track/prompts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suggest: true, name: biz.name, trade: biz.trade, city: biz.city }) });
      const d = await r.json().catch(() => ({})); setSuggestions(d.suggestions ?? []);
    } catch { setErr("Suggest failed"); } finally { setBusy(null); }
  };

  const remove = async (id: string) => {
    setBusy("rm" + id);
    try { await fetch(`/api/dashboard/track/prompts?id=${id}`, { method: "DELETE" }); await loadFor(bizId); } finally { setBusy(null); }
  };

  const runNow = async () => {
    if (!bizId) return;
    setBusy("run"); setErr(null); setRunMsg(null);
    try {
      // The run executes in the background worker; verdicts land incrementally.
      const sinceMs = Date.now() - 30_000; // small buffer for clock skew
      const r = await fetch("/api/dashboard/track/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: bizId }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Run failed");
      setRunMsg(`Probing ${d.prompts} prompts across ${(d.engines || []).length} engine(s) in the background — verdicts appear as they land…`);
      let lastNew = 0, stable = 0;
      for (let i = 0; i < 36; i++) {
        await new Promise((res) => setTimeout(res, 10_000));
        const rr = await fetch(`/api/dashboard/track/results?businessId=${bizId}`).then((x) => x.json()).catch(() => null);
        if (!rr) continue;
        setResults(rr.results ?? []);
        const fresh = (rr.results ?? []).filter((x: any) => new Date(String(x.run_at)).getTime() > sinceMs).length;
        setRunMsg(`${fresh} fresh verdicts so far…`);
        if (fresh > 0 && fresh === lastNew) { stable++; if (stable >= 2) break; } else { stable = 0; }
        lastNew = fresh;
      }
      setRunMsg(lastNew > 0 ? `Done — ${lastNew} fresh verdicts recorded.` : "No fresh verdicts landed — check Test Engines.");
    } catch (e: any) { setErr(e?.message || "Run failed"); } finally { setBusy(null); }
  };

  // summary from latest probe per (prompt, engine)
  const latest: Record<string, any> = {};
  for (const r of results) latest[`${r.prompt_id}|${r.engine}`] = r;
  const latestRows = Object.values(latest) as any[];
  const eng: Record<string, { answered: number; mentioned: number }> = {};
  for (const e of ENGINE_KEYS) eng[e] = { answered: 0, mentioned: 0 };
  let bizMentions = 0;
  for (const r of latestRows) { if (eng[r.engine]) { eng[r.engine].answered++; if (r.mentioned) eng[r.engine].mentioned++; } if (r.mentioned) bizMentions++; }
  const totMen = latestRows.filter((r) => r.mentioned).length;
  const overall = latestRows.length ? Math.round((100 * totMen) / latestRows.length) : 0;
  const byDay: Record<string, { a: number; m: number }> = {};
  for (const r of results) { const d = String(r.run_at).slice(0, 10); (byDay[d] ||= { a: 0, m: 0 }); byDay[d].a++; if (r.mentioned) byDay[d].m++; }
  const days = Object.keys(byDay).sort();

  const engDay: Record<string, Record<string, { a: number; m: number }>> = {};
  for (const e of ENGINE_KEYS) engDay[e] = {};
  for (const r of results) { if (!engDay[r.engine]) continue; const d = String(r.run_at).slice(0, 10); (engDay[r.engine][d] ||= { a: 0, m: 0 }); engDay[r.engine][d].a++; if (r.mentioned) engDay[r.engine][d].m++; }
  const rateSeries = (pd: Record<string, { a: number; m: number }>) => days.map((d) => (pd[d] ? Math.round((100 * pd[d].m) / pd[d].a) : null));
  const trendSeries = [
    ...ENGINE_KEYS.map((e) => ({ label: ENGINE_LABELS[e], color: ENGINE_COLORS[e], values: rateSeries(engDay[e]) })),
    { label: "Overall", color: T.accent, values: days.map((d) => (byDay[d] ? Math.round((100 * byDay[d].m) / byDay[d].a) : null)) },
  ];
  const overallSeries = trendSeries[trendSeries.length - 1];
  const compCounts: Record<string, number> = {};
  for (const r of latestRows) if (Array.isArray(r.competitors)) for (const c of r.competitors) { const k = String(c).trim(); if (k) compCounts[k] = (compCounts[k] || 0) + 1; }
  const topComps = Object.entries(compCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const donutSegments = [{ label: biz?.name || "You", value: bizMentions, color: T.accent }, ...topComps.map(([name, count], i) => ({ label: name, value: count, color: COMP_COLORS[i % COMP_COLORS.length] }))];

  const selectStyle: React.CSSProperties = { ...inputStyle, width: "auto", minWidth: 260 };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select style={selectStyle} value={bizId} onChange={(e) => setBizId(e.target.value)}>
          <option value="">Select a business…</option>
          {businesses.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
        </select>
        {bizId && <button style={{ ...btn(true), opacity: busy === "run" ? 0.5 : 1 }} onClick={runNow} disabled={busy === "run"}>{busy === "run" ? "Probing…" : "Run probes now"}</button>}
        <button style={{ ...btn(), opacity: busy === "diag" ? 0.5 : 1 }} disabled={busy === "diag"} onClick={async () => {
          setBusy("diag"); setDiag(null); setErr(null);
          try {
            const r = await fetch("/api/dashboard/track/diag", { method: "POST" });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d.error || "Test failed");
            setDiag(d.results ?? []);
          } catch (e: any) { setErr(e?.message || "Test failed"); } finally { setBusy(null); }
        }}>{busy === "diag" ? "Testing…" : "Test engines"}</button>
        {bizId && <PrintBtn />}
        {runMsg && <span style={{ fontSize: 12, color: T.textSub }}>{runMsg}</span>}
      </div>

      {diag && (
        <div style={card({ marginBottom: 16 })}>
          <div style={{ ...eyebrow, marginBottom: 10 }}>Engine self-test</div>
          {diag.map((d) => (
            <div key={d.engine} style={{ display: "flex", gap: 12, alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontFamily: MONO, fontSize: 12, minWidth: 100, color: T.text }}>{ENGINE_LABELS[d.engine] ?? d.engine}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: d.ok ? T.ok : T.danger }}>{d.ok ? `OK · ${(d.ms / 1000).toFixed(1)}s` : "FAILED"}</span>
              {!d.ok && <span style={{ fontSize: 12, color: T.textSub, wordBreak: "break-all" }}>{d.error}</span>}
              {d.ok && d.note && <span style={{ fontSize: 12, color: T.warn, wordBreak: "break-all" }}>△ {d.note}</span>}
            </div>
          ))}
        </div>
      )}

      {!businesses.length && <div style={card({ padding: 48, textAlign: "center" })}><p style={{ fontSize: 14, color: T.muted, margin: 0 }}>No businesses yet. Run a scan or wait for a lead, then track them here.</p></div>}
      {err && <div style={card({ borderColor: `${T.danger}66`, marginBottom: 16 })}><span style={{ color: T.danger, fontSize: 13 }}>{err}</span></div>}

      {bizId && (
        <div className="dash-print-area">
          {latestRows.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 12 }}>
              {ENGINE_KEYS.map((e) => {
                const rate = eng[e].answered ? Math.round((100 * eng[e].mentioned) / eng[e].answered) : null;
                return <div key={e} style={card({ display: "flex", flexDirection: "column", gap: 6 })}>
                  <span style={eyebrow}>{ENGINE_LABELS[e]}</span>
                  <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: rate === null ? T.muted : scoreColor(rate) }}>{rate === null ? "—" : `${rate}%`}</span>
                  <span style={{ fontSize: 11, color: T.muted }}>named in answers</span>
                  <Sparkline values={rateSeries(engDay[e])} color={ENGINE_COLORS[e]} />
                </div>;
              })}
              <div style={card({ display: "flex", flexDirection: "column", gap: 6 })}><span style={eyebrow}>Overall</span><span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: scoreColor(overall) }}>{overall}%</span><span style={{ fontSize: 11, color: T.muted }}>mention rate</span><Sparkline values={overallSeries.values} color={T.accent} /></div>
            </div>
          )}

          {latestRows.length > 0 && (
            <div className="m1col" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 20 }}>
              <div style={card()}>
                <div style={{ ...eyebrow, marginBottom: 10 }}>Mention-rate trend</div>
                {days.length > 1 ? (
                  <>
                    <LineChart days={days} series={trendSeries} />
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
                      {trendSeries.map((s) => <span key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.textSub }}><span style={{ width: 12, height: 2, background: s.color, display: "inline-block" }} />{s.label}</span>)}
                    </div>
                  </>
                ) : <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Run probes on at least two different days to see the trend build — the weekly schedule does this for you automatically.</p>}
              </div>
              <div style={card({ display: "flex", flexDirection: "column", alignItems: "center" })}>
                <div style={{ ...eyebrow, marginBottom: 10, alignSelf: "flex-start" }}>Share of voice</div>
                {donutSegments.some((s) => s.value > 0) ? (
                  <>
                    <Donut segments={donutSegments} />
                    <div style={{ marginTop: 12, width: "100%" }}>
                      {donutSegments.slice(0, 6).map((s, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.textSub, marginBottom: 3 }}><span style={{ width: 8, height: 8, background: s.color, display: "inline-block", flexShrink: 0 }} /><span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</span><span style={{ fontFamily: MONO, color: T.muted }}>{s.value}</span></div>)}
                    </div>
                  </>
                ) : <p style={{ fontSize: 13, color: T.muted }}>No mentions recorded yet.</p>}
              </div>
            </div>
          )}

          <MapGridCard bizId={bizId} trade={biz?.trade ?? ""} />
          <TownScanCard bizId={bizId} city={biz?.city ?? ""} />
          <CitationCard bizId={bizId} />

          {/* Prompt management */}
          <div className="no-print" style={card({ marginBottom: 20 })}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={eyebrow}>Tracked prompts ({prompts.length})</span>
              <button style={{ ...btn(), padding: "6px 12px", opacity: busy === "suggest" ? 0.5 : 1 }} onClick={suggest} disabled={busy === "suggest" || !biz}>{busy === "suggest" ? "…" : "Suggest prompts"}</button>
            </div>
            {prompts.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ flex: 1, fontSize: 13, color: T.text }}>{p.prompt}</span>
                <button onClick={() => remove(p.id)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 16 }} disabled={busy === "rm" + p.id}>×</button>
              </div>
            ))}
            {!prompts.length && <p style={{ fontSize: 13, color: T.muted, margin: "0 0 12px" }}>No prompts yet — add buyer questions to track, or hit “Suggest prompts”.</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input style={inputStyle} placeholder="Add a buyer question (e.g. best plumber in Fort Worth)" value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPrompts([newPrompt])} />
              <button style={{ ...btn(true), opacity: busy === "add" || !newPrompt.trim() ? 0.5 : 1 }} onClick={() => addPrompts([newPrompt])} disabled={busy === "add" || !newPrompt.trim()}>Add</button>
            </div>
            {suggestions.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={eyebrow}>Suggestions — grounded in real demand · click to add</span>
                  <button style={{ ...btn(), padding: "4px 10px" }} onClick={() => addPrompts(suggestions.map((s) => s.prompt))}>Add all</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => addPrompts([s.prompt])} style={{ textAlign: "left", background: T.bg, border: `1px solid ${T.border}`, color: T.text, fontSize: 13, padding: "8px 10px", cursor: "pointer", fontFamily: BODY, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                      <span>+ {s.prompt}</span>
                      <span style={{ fontFamily: MONO, fontSize: 10, color: T.muted, whiteSpace: "nowrap" }}>
                        {s.source === "paa" ? "PAA" : "autocomplete"}{typeof s.volume === "number" ? ` · ~${s.volume.toLocaleString()}/mo` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Per-prompt latest verdicts */}
          {latestRows.length > 0 && (
            <div className="xscroll" style={card({ padding: 0 })}>
              <div className="trow" style={{ display: "grid", gridTemplateColumns: `1fr repeat(${ENGINE_KEYS.length}, 84px)`, padding: "12px 18px", borderBottom: `1px solid ${T.border}`, ...eyebrow, fontSize: 10 }}>
                <span>Prompt</span>{ENGINE_KEYS.map((e) => <span key={e} style={{ textAlign: "center" }}>{ENGINE_LABELS[e]}</span>)}
              </div>
              {prompts.map((p) => (
                <div key={p.id} className="trow" style={{ display: "grid", gridTemplateColumns: `1fr repeat(${ENGINE_KEYS.length}, 84px)`, padding: "12px 18px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: T.text, paddingRight: 12 }}>{p.prompt}</span>
                  {ENGINE_KEYS.map((e) => { const r = latest[`${p.id}|${e}`]; return (
                    <span key={e} style={{ textAlign: "center", fontFamily: MONO, fontSize: 13, color: !r ? T.muted : r.mentioned ? T.ok : T.danger }}>
                      {!r ? "—" : r.mentioned ? (r.position ? `#${r.position}` : "✓") : "✗"}
                    </span>
                  ); })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Overview tab ────────────────────────────────────────────────────────────────
function OverviewTab({ data }: { data: Overview }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!selected) { setTasks([]); return; }
    fetch(`/api/dashboard/tasks?businessId=${selected}`)
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks ?? []))
      .catch(() => setTasks([]));
  }, [selected]);

  const markTask = async (id: string, status: string) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
    await fetch("/api/dashboard/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) }).catch(() => {});
  };

  // Client file: every stored report for the selected business, reopenable.
  const [reports, setReports] = useState<any[]>([]);
  const [clientReports, setClientReports] = useState<any[]>([]);
  const [openReport, setOpenReport] = useState<{ pv: string; data: any } | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailState, setEmailState] = useState<string | null>(null);
  const [genState, setGenState] = useState<string | null>(null);
  const [shareState, setShareState] = useState<string | null>(null);
  const [outreach, setOutreach] = useState<{ subject: string; body: string } | null>(null);
  const [outreachBusy, setOutreachBusy] = useState(false);

  useEffect(() => {
    setOpenReport(null); setEmailState(null); setGenState(null); setShareState(null); setOutreach(null);
    if (!selected) { setReports([]); setClientReports([]); setEmailTo(""); return; }
    setEmailTo(data.businesses.find((b) => b.id === selected)?.contact_email ?? "");
    fetch(`/api/dashboard/reports?businessId=${selected}`)
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []))
      .catch(() => setReports([]));
    fetch(`/api/dashboard/client-report?businessId=${selected}`)
      .then((r) => r.json())
      .then((d) => setClientReports(d.reports ?? []))
      .catch(() => setClientReports([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const generateClientReport = async () => {
    if (!selected) return;
    setGenState("working");
    try {
      const r = await fetch("/api/dashboard/client-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: selected }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Generation failed");
      setClientReports((cr) => [{ id: d.id, period_label: d.payload?.period_label, created_at: new Date().toISOString() }, ...cr]);
      setOpenReport({ pv: "client-report", data: d.payload });
      setGenState(null);
    } catch (e: any) { setGenState(e?.message || "Generation failed"); }
  };

  const openClientReport = async (id: string) => {
    try {
      const r = await fetch(`/api/dashboard/client-report?id=${id}`);
      const d = await r.json().catch(() => null);
      if (d?.payload) setOpenReport({ pv: "client-report", data: d.payload });
    } catch { /* ignore */ }
  };

  const copyShareLink = async () => {
    if (!selected) return;
    setShareState("working");
    try {
      const r = await fetch("/api/dashboard/share-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: selected }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Failed");
      await navigator.clipboard.writeText(d.url);
      setShareState(`Copied ✓ ${d.url}`);
    } catch (e: any) { setShareState(e?.message || "Failed"); }
  };

  const draftOutreach = async () => {
    if (!selected) return;
    setOutreachBusy(true); setOutreach(null);
    try {
      const r = await fetch("/api/dashboard/outreach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: selected }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Draft failed");
      setOutreach({ subject: d.subject, body: d.body });
    } catch (e: any) { setOutreach({ subject: "Draft failed", body: e?.message || "" }); }
    finally { setOutreachBusy(false); }
  };

  const reportKind = (pv: string, tier: string) => {
    const v = String(pv ?? "");
    if (v.startsWith("battleplan")) return { label: "Battle Plan", mode: "battle" as const };
    if (v.startsWith("execplan")) return { label: "90-Day Plan", mode: "exec" as const };
    if (v.startsWith("scan")) return { label: "Quick Scan", mode: "scan" as const };
    if (tier === "strategy_97") return { label: "$97 Strategy", mode: "ext-strategy" as const };
    return { label: "$27 Brief", mode: "ext-brief" as const };
  };

  const openStoredReport = async (rep: any) => {
    const kind = reportKind(rep.prompt_version, rep.tier);
    if (kind.mode === "ext-brief") { window.open(`/audit-results?id=${rep.id}`, "_blank"); return; }
    if (kind.mode === "ext-strategy") { window.open(`/strategy-brief?id=${rep.id}`, "_blank"); return; }
    try {
      const r = await fetch(`/api/audit/${rep.id}`);
      const saved = await r.json().catch(() => null);
      if (saved?.payload) setOpenReport({ pv: String(rep.prompt_version), data: { id: rep.id, ...saved.payload } });
    } catch { /* ignore */ }
  };

  const [welcomeState, setWelcomeState] = useState<string | null>(null);
  const sendWelcome = async () => {
    if (!selected || !emailTo) return;
    setWelcomeState("sending");
    try {
      const r = await fetch("/api/dashboard/welcome-client", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: selected, email: emailTo }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Send failed");
      setWelcomeState("sent");
    } catch (e: any) { setWelcomeState(e?.message || "Send failed"); }
  };

  const sendClientUpdate = async () => {
    if (!selected || !emailTo) return;
    setEmailState("sending");
    try {
      const r = await fetch("/api/dashboard/client-update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: selected, email: emailTo }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Send failed");
      setEmailState("sent");
    } catch (e: any) { setEmailState(e?.message || "Send failed"); }
  };

  // latest complete audit per business (audits come ascending → last wins)
  const latestByBiz = useMemo(() => {
    const m: Record<string, AuditRow> = {};
    for (const a of data.audits) if (a.business_id) m[a.business_id] = a;
    return m;
  }, [data.audits]);

  const scoresByAudit = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    for (const s of data.signalScores) { (m[s.audit_id] ||= {})[s.signal] = s.score; }
    return m;
  }, [data.signalScores]);

  const bizNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const b of data.businesses) m[b.id] = b.name;
    return m;
  }, [data.businesses]);

  const LEAD_SOURCE_LABELS: Record<string, string> = {
    free_check: "Free check",
    visibility_check_partial: "Partial form fill",
  };
  const leadSourceLabel = (source: string) =>
    LEAD_SOURCE_LABELS[source] ?? source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const recentLeads = useMemo(
    () => [...data.leads].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 20),
    [data.leads]
  );
  const leadsBySource = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of data.leads) m[l.source] = (m[l.source] || 0) + 1;
    return m;
  }, [data.leads]);

  const revenue = data.purchases.reduce((sum, p) => sum + (p.amount_total || 0), 0);
  const scored = data.businesses.map((b) => latestByBiz[b.id]?.overall_score).filter((s): s is number => typeof s === "number");
  const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0;

  const sel = selected ? data.businesses.find((b) => b.id === selected) : null;
  const selAudit = sel ? latestByBiz[sel.id] : null;
  const selScores = selAudit ? scoresByAudit[selAudit.id] || {} : {};
  const selTrend = sel ? data.audits.filter((a) => a.business_id === sel.id && typeof a.overall_score === "number") : [];

  return (
    <div>
      <div className="m2col" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Stat label="Businesses" value={String(data.businesses.length)} accent />
        <Stat label="Leads" value={String(data.leads.length)} />
        <Stat label="Revenue" value={fmtMoney(revenue)} />
        <Stat label="Avg score" value={scored.length ? `${avg} / 100` : "—"} />
      </div>

      <div className="m1col" style={{ display: "grid", gridTemplateColumns: sel ? "1fr 380px" : "1fr", gap: 20, alignItems: "start" }}>
        <div style={card({ padding: 0, overflow: "hidden" })}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 0.8fr 0.9fr", padding: "12px 18px", borderBottom: `1px solid ${T.border}`, ...eyebrow }}>
            <span>Business</span><span>Market</span><span style={{ textAlign: "right" }}>Score</span><span style={{ textAlign: "right" }}>Scanned</span>
          </div>
          {data.businesses.length === 0 && <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>No businesses yet. Run a scan or wait for a funnel lead.</div>}
          {data.businesses.map((b) => {
            const a = latestByBiz[b.id];
            const sc = a?.overall_score;
            const t = typeof sc === "number" ? tierOf(sc) : null;
            return (
              <div key={b.id} onClick={() => setSelected(b.id === selected ? null : b.id)}
                style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 0.8fr 0.9fr", padding: "14px 18px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", alignItems: "center", background: b.id === selected ? T.panel2 : "transparent" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{b.trade}</div>
                </div>
                <div style={{ fontSize: 13, color: T.textSub }}>{b.city}</div>
                <div style={{ textAlign: "right", fontFamily: MONO, fontWeight: 700, fontSize: 14, color: t ? t.color : T.muted }}>{typeof sc === "number" ? sc : "—"}</div>
                <div style={{ textAlign: "right", fontSize: 12, color: T.muted }}>{fmtDate(a?.created_at)}</div>
              </div>
            );
          })}
        </div>

        {sel && (
          <div style={card()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 16 }}>{sel.name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{sel.trade} · {sel.city}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            {selAudit ? (
              <>
                <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 4px" }}><Radar scores={selScores} size={190} /></div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ ...eyebrow, marginBottom: 8 }}>Overall trend</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-end", flexWrap: "wrap" }}>
                    {selTrend.map((a, i) => (
                      <div key={i} style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 14, color: tierOf(a.overall_score as number).color }}>{a.overall_score}</div>
                        <div style={{ fontSize: 10, color: T.muted }}>{fmtDate(a.created_at)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {sel.url && <a href={`/audit-results?id=${selAudit.id}`} target="_blank" rel="noreferrer" style={{ fontFamily: MONO, fontSize: 12, color: T.accent, textDecoration: "none", display: "inline-block", marginTop: 16 }}>Open latest brief →</a>}
              </>
            ) : (
              <p style={{ fontSize: 13, color: T.muted }}>No completed audit yet for this business.</p>
            )}

            {tasks.length > 0 && (
              <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                <div style={{ ...eyebrow, marginBottom: 8 }}>
                  Plan tasks · {tasks.filter((t) => t.status === "done").length}/{tasks.length} done
                </div>
                {tasks.map((t) => (
                  <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 6 }}>
                    <button
                      onClick={() => markTask(t.id, t.status === "done" ? "open" : "done")}
                      style={{ background: "none", border: `1px solid ${t.status === "done" ? T.ok : T.border}`, color: t.status === "done" ? T.ok : T.muted, width: 16, height: 16, fontSize: 10, lineHeight: 1, cursor: "pointer", flexShrink: 0 }}
                    >
                      {t.status === "done" ? "✓" : ""}
                    </button>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: t.owner === "Client" ? T.warn : T.accent, minWidth: 44 }}>{t.owner}</span>
                    <span style={{ fontSize: 12, color: t.status === "done" ? T.muted : T.text, textDecoration: t.status === "done" ? "line-through" : "none", lineHeight: 1.4 }}>
                      {t.task}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {reports.length > 0 && (
              <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                <div style={{ ...eyebrow, marginBottom: 8 }}>Reports — click to open</div>
                {reports.map((rep) => {
                  const k = reportKind(rep.prompt_version, rep.tier);
                  return (
                    <button key={rep.id} onClick={() => openStoredReport(rep)}
                      style={{ display: "flex", justifyContent: "space-between", gap: 8, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "5px 0", fontFamily: MONO, fontSize: 11, color: T.textSub }}>
                      <span>{String(rep.created_at).slice(0, 10)} · {k.label}</span>
                      <span style={{ color: rep.overall_score != null ? scoreColor(Number(rep.overall_score)) : T.muted }}>{rep.overall_score ?? "—"}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
              <div style={{ ...eyebrow, marginBottom: 8 }}>Client reports</div>
              <button style={{ ...btn(true), width: "100%", marginBottom: 8, opacity: genState === "working" ? 0.5 : 1 }} disabled={genState === "working"} onClick={generateClientReport}>
                {genState === "working" ? "Building report…" : clientReports.length ? "Generate new report" : "Generate baseline report"}
              </button>
              {genState && genState !== "working" && <p style={{ fontSize: 12, color: T.danger, margin: "0 0 8px" }}>{genState}</p>}
              {clientReports.map((cr) => (
                <button key={cr.id} onClick={() => openClientReport(cr.id)} style={{ display: "flex", justifyContent: "space-between", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: MONO, fontSize: 11, color: T.textSub }}>
                  <span>{cr.period_label ?? String(cr.created_at).slice(0, 10)}</span>
                  <span style={{ color: T.muted }}>open</span>
                </button>
              ))}
              <button style={{ ...btn(), width: "100%", marginTop: 8 }} onClick={copyShareLink}>
                {shareState === "working" ? "…" : "Copy client share link"}
              </button>
              {shareState && shareState !== "working" && <p style={{ fontSize: 11, color: shareState.startsWith("Copied") ? T.ok : T.danger, marginTop: 6, wordBreak: "break-all" }}>{shareState}</p>}
            </div>

            <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
              <div style={{ ...eyebrow, marginBottom: 8 }}>Outreach (prospects)</div>
              <button style={{ ...btn(), width: "100%", opacity: outreachBusy ? 0.5 : 1 }} disabled={outreachBusy} onClick={draftOutreach}>
                {outreachBusy ? "Drafting…" : "Draft outreach email"}
              </button>
              {outreach && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: T.accent, marginBottom: 4 }}>{outreach.subject}</div>
                  <textarea readOnly value={outreach.body} rows={7} style={{ ...inputStyle, fontSize: 12, resize: "vertical" }} onFocus={(e) => e.target.select()} />
                  <button style={{ ...btn(), width: "100%", marginTop: 6 }} onClick={() => navigator.clipboard.writeText(`Subject: ${outreach.subject}\n\n${outreach.body}`)}>Copy draft</button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
              <div style={{ ...eyebrow, marginBottom: 8 }}>Client emails</div>
              <input style={{ ...inputStyle, marginBottom: 8 }} placeholder="client@email.com" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
              <button style={{ ...btn(true), width: "100%", marginBottom: 8, opacity: welcomeState === "sending" || !emailTo ? 0.5 : 1 }} disabled={welcomeState === "sending" || !emailTo} onClick={sendWelcome}>
                {welcomeState === "sending" ? "Preparing welcome…" : "Send welcome + baseline"}
              </button>
              {welcomeState === "sent" && <p style={{ fontSize: 12, color: T.ok, margin: "0 0 8px" }}>Welcome sent ✓ — baseline + live link included, you&rsquo;re CC&rsquo;d.</p>}
              {welcomeState && welcomeState !== "sent" && welcomeState !== "sending" && <p style={{ fontSize: 12, color: T.danger, margin: "0 0 8px" }}>{welcomeState}</p>}
              <button style={{ ...btn(), width: "100%", opacity: emailState === "sending" || !emailTo ? 0.5 : 1 }} disabled={emailState === "sending" || !emailTo} onClick={sendClientUpdate}>
                {emailState === "sending" ? "Composing & sending…" : "Send client update"}
              </button>
              {emailState === "sent" && <p style={{ fontSize: 12, color: T.ok, marginTop: 8 }}>Sent ✓ — what we did, what we&rsquo;re doing, and what they need to do.</p>}
              {emailState && emailState !== "sent" && emailState !== "sending" && <p style={{ fontSize: 12, color: T.danger, marginTop: 8 }}>{emailState}</p>}
            </div>
          </div>
        )}
      </div>

      <div style={card({ padding: 0, overflow: "hidden", marginTop: 20 })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: `1px solid ${T.border}` }}>
          <span style={eyebrow}>Recent leads</span>
          <span style={{ fontSize: 11, color: T.muted }}>
            {Object.entries(leadsBySource).map(([src, n]) => `${leadSourceLabel(src)}: ${n}`).join(" · ") || "No leads yet"}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.9fr", padding: "12px 18px", borderBottom: `1px solid ${T.border}`, ...eyebrow }}>
          <span>Email</span><span>Source</span><span>Business</span><span style={{ textAlign: "right" }}>When</span>
        </div>
        {recentLeads.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>No leads yet.</div>
        )}
        {recentLeads.map((l) => (
          <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.9fr", padding: "10px 18px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.email}</span>
            <span style={{ fontSize: 12, color: l.source === "visibility_check_partial" ? T.warn : T.textSub }}>{leadSourceLabel(l.source)}</span>
            <span style={{ fontSize: 12, color: T.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.business_id ? bizNameById[l.business_id] ?? "—" : "—"}</span>
            <span style={{ fontSize: 12, color: T.muted, textAlign: "right" }}>{fmtDate(l.created_at)}</span>
          </div>
        ))}
      </div>

      {openReport && sel && (
        <div className="dash-print-area" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={eyebrow}>{openReport.pv === "client-report" ? "Client Report" : reportKind(openReport.pv, "").label} · {sel.name} · stored report</span>
            <span className="no-print" style={{ display: "flex", gap: 8 }}>
              <PrintBtn />
              <button style={{ ...btn(), padding: "6px 12px" }} onClick={() => setOpenReport(null)}>Close ×</button>
            </span>
          </div>
          {openReport.pv === "client-report" && renderClientReport(openReport.data)}
          {openReport.pv.startsWith("battleplan") && renderBattlePlan(openReport.data, { name: sel.name, trade: sel.trade, city: sel.city, url: sel.url ?? "" })}
          {openReport.pv.startsWith("execplan") && renderExecPlan(openReport.data, { name: sel.name, trade: sel.trade, city: sel.city, url: sel.url ?? "" })}
          {openReport.pv.startsWith("scan") && renderScan(openReport.data, { name: sel.name, trade: sel.trade, city: sel.city, url: sel.url ?? "" })}
        </div>
      )}
    </div>
  );
}

// ─── Ads tab (Looker embed) ──────────────────────────────────────────────────────
function AdsTab() {
  const url = process.env.NEXT_PUBLIC_LOOKER_URL;
  if (!url) {
    return (
      <div style={card({ padding: 56, textAlign: "center", border: `1px dashed ${T.border}` })}>
        <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Ads reporting</div>
        <p style={{ fontSize: 14, color: T.muted, maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
          Build a Looker Studio report with the Google Ads + Meta Ads connectors, then set <span style={{ fontFamily: MONO, color: T.textSub }}>NEXT_PUBLIC_LOOKER_URL</span> in Netlify (Share → Embed report → copy the src URL). It renders here automatically.
        </p>
      </div>
    );
  }
  return <iframe title="Ads reporting" src={url} style={{ width: "100%", height: "82vh", border: `1px solid ${T.border}`, borderRadius: 2 }} />;
}

// ─── Content tab (generate + publish articles to client sites) ───────────────────
interface ContentPost {
  id: string; status: string; title: string | null; slug: string | null;
  meta_description: string | null; target_prompt: string | null; summary: string | null;
  url: string | null; created_at: string; published_at: string | null;
  article_html?: string | null; faqs?: { q: string; a: string }[] | null;
}
interface ContentTopic { targetPrompt: string; mentionRate: number; enginesMissing: string[]; probes: number }

function ContentTab({ businesses }: { businesses: Biz[] }) {
  const [bizId, setBizId] = useState("");
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [topics, setTopics] = useState<ContentTopic[]>([]);
  const [repo, setRepo] = useState<string | null>(null);
  const [repoInput, setRepoInput] = useState("");
  const [githubReady, setGithubReady] = useState(true);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<ContentPost | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const biz = businesses.find((b) => b.id === bizId) || null;

  const loadFor = useCallback(async (id: string) => {
    if (!id) return;
    setErr(null);
    try {
      const d = await fetch(`/api/dashboard/content?businessId=${id}`).then((r) => r.json());
      setPosts(d.posts ?? []); setTopics(d.topics ?? []); setRepo(d.repo ?? null); setGithubReady(!!d.githubReady);
      setRepoInput(d.repo ?? "");
    } catch { setErr("Could not load content data."); }
  }, []);

  useEffect(() => { if (bizId) loadFor(bizId); else { setPosts([]); setTopics([]); setRepo(null); setOpen(null); } }, [bizId, loadFor]);

  // Poll while any post is generating.
  useEffect(() => {
    const generating = posts.some((p) => p.status === "generating");
    if (!generating || !bizId) { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } return; }
    if (pollRef.current) return;
    pollRef.current = setInterval(() => loadFor(bizId), 8000);
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [posts, bizId, loadFor]);

  const generate = async (targetPrompt: string) => {
    if (!bizId || !targetPrompt.trim()) return;
    setBusy("gen"); setErr(null);
    try {
      const r = await fetch("/api/dashboard/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: bizId, targetPrompt: targetPrompt.trim() }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `error ${r.status}`);
      setCustom(""); await loadFor(bizId);
    } catch (e: any) { setErr(e?.message || "Generate failed"); } finally { setBusy(null); }
  };

  const saveRepo = async () => {
    if (!bizId) return;
    setBusy("repo"); setErr(null);
    try {
      const r = await fetch("/api/dashboard/content", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: bizId, repo: repoInput || null }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "Could not save repo");
      setRepo(d.repo);
    } catch (e: any) { setErr(e?.message || "Could not save repo"); } finally { setBusy(null); }
  };

  const openPost = async (id: string) => {
    setErr(null);
    try {
      const d = await fetch(`/api/dashboard/content/${id}`).then((r) => r.json());
      if (d.post) setOpen(d.post);
    } catch { setErr("Could not load the draft."); }
  };

  const saveDraft = async () => {
    if (!open) return;
    setBusy("save"); setErr(null);
    try {
      const r = await fetch(`/api/dashboard/content/${open.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: open.title, slug: open.slug, meta_description: open.meta_description, summary: open.summary, article_html: open.article_html }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "Save failed");
      await loadFor(bizId);
    } catch (e: any) { setErr(e?.message || "Save failed"); } finally { setBusy(null); }
  };

  const publish = async () => {
    if (!open) return;
    if (!confirm(`Publish "${open.title}" live to ${repo}? This commits to the client's site and deploys.`)) return;
    setBusy("pub"); setErr(null);
    try {
      const r = await fetch(`/api/dashboard/content/${open.id}`, { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Publish failed");
      setOpen(null); await loadFor(bizId);
    } catch (e: any) { setErr(e?.message || "Publish failed"); } finally { setBusy(null); }
  };

  const removeDraft = async (id: string) => {
    if (!confirm("Delete this draft?")) return;
    setBusy("del"); setErr(null);
    try { await fetch(`/api/dashboard/content/${id}`, { method: "DELETE" }); setOpen(null); await loadFor(bizId); }
    finally { setBusy(null); }
  };

  const statusColor = (s: string) => (s === "published" ? T.ok : s === "draft" ? T.accent : s === "failed" ? T.danger : T.muted);
  const previewDoc = (p: ContentPost) => {
    const base = biz?.url ? `${biz.url.replace(/\/+$/, "")}/blog/` : "";
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${base ? `<base href="${base}">` : ""}<link rel="stylesheet" href="../styles.css"><style>body{margin:0;background:#0a0a0c;}</style></head><body><main>${p.article_html ?? ""}</main></body></html>`;
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select style={{ ...inputStyle, width: "auto", minWidth: 260 }} value={bizId} onChange={(e) => { setOpen(null); setBizId(e.target.value); }}>
          <option value="">Select a client…</option>
          {businesses.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
        </select>
        {bizId && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <input style={{ ...inputStyle, width: 280, fontFamily: MONO, fontSize: 12 }} placeholder="GitHub repo (owner/repo)" value={repoInput} onChange={(e) => setRepoInput(e.target.value)} />
            <button style={{ ...btn(), opacity: busy === "repo" ? 0.5 : 1 }} onClick={saveRepo} disabled={busy === "repo"}>{repo === (repoInput || null) ? "Repo saved" : "Save repo"}</button>
          </div>
        )}
      </div>

      {err && <div style={card({ borderColor: `${T.danger}66`, marginBottom: 16 })}><span style={{ color: T.danger, fontSize: 13 }}>{err}</span></div>}
      {bizId && !githubReady && (
        <div style={card({ borderColor: `${T.warn}66`, marginBottom: 16 })}>
          <span style={{ color: T.warn, fontSize: 13 }}>GITHUB_TOKEN is not set in Netlify — you can generate and edit drafts, but publishing is disabled. Add the fine-grained PAT (Contents: read/write on the client repos) as a normal env var (never “secret”), then redeploy.</span>
        </div>
      )}

      {!bizId && <div style={{ color: T.muted, fontFamily: MONO, fontSize: 13, padding: 40, textAlign: "center" }}>Pick a client to see topic suggestions and published guides.</div>}

      {bizId && !open && (
        <div className="m1col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
          <div style={card()}>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Write the next article</div>
            <div style={{ ...eyebrow, marginBottom: 14 }}>Topics ranked by where AI engines are NOT mentioning {biz?.name}</div>
            {topics.length === 0 && <div style={{ color: T.muted, fontSize: 13, marginBottom: 12 }}>No probe data yet — run tracking probes first, or use a custom topic below.</div>}
            {topics.map((t) => (
              <div key={t.targetPrompt} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.text }}>{t.targetPrompt}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: t.mentionRate < 40 ? T.danger : T.warn }}>
                    mentioned {t.mentionRate}% · missing on {t.enginesMissing.length ? t.enginesMissing.map((e) => ENGINE_LABELS[e] ?? e).join(", ") : "—"}
                  </div>
                </div>
                <button style={{ ...btn(true), whiteSpace: "nowrap", opacity: busy === "gen" ? 0.5 : 1 }} disabled={busy === "gen"} onClick={() => generate(t.targetPrompt)}>Write article</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <input style={inputStyle} placeholder="Custom topic / buyer question…" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") generate(custom); }} />
              <button style={{ ...btn(true), whiteSpace: "nowrap", opacity: busy === "gen" ? 0.5 : 1 }} disabled={busy === "gen" || !custom.trim()} onClick={() => generate(custom)}>Generate</button>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: T.muted, marginTop: 10 }}>Generation runs in the background (~2–3 min) — the draft appears in the list when ready.</div>
          </div>

          <div style={card()}>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Articles</div>
            <div style={{ ...eyebrow, marginBottom: 14 }}>{repo ? `Publishing to github.com/${repo}` : "No repo set — publishing disabled for this client"}</div>
            {posts.length === 0 && <div style={{ color: T.muted, fontSize: 13 }}>Nothing yet.</div>}
            {posts.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title || p.target_prompt || "(generating…)"}</div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: statusColor(p.status) }}>
                    {p.status}{p.status === "generating" ? "…" : ""} · {(p.published_at || p.created_at || "").slice(0, 10)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ ...btn(), textDecoration: "none", whiteSpace: "nowrap" }}>View live</a>}
                  {(p.status === "draft" || p.status === "published") && <button style={btn(p.status === "draft")} onClick={() => openPost(p.id)}>{p.status === "draft" ? "Review" : "Open"}</button>}
                  {p.status === "failed" && <button style={btn()} onClick={() => removeDraft(p.id)}>Delete</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bizId && open && (
        <div style={card()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15 }}>{open.status === "published" ? "Published article" : "Review draft"}</div>
              <div style={{ ...eyebrow }}>Target: {open.target_prompt}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={btn()} onClick={() => setOpen(null)}>← Back</button>
              {open.status === "draft" && <button style={{ ...btn(), opacity: busy === "save" ? 0.5 : 1 }} disabled={busy === "save"} onClick={saveDraft}>{busy === "save" ? "Saving…" : "Save edits"}</button>}
              {open.status === "draft" && <button style={{ ...btn(), color: T.danger }} onClick={() => removeDraft(open.id)}>Delete</button>}
              {open.status === "draft" && <button style={{ ...btn(true), opacity: busy === "pub" || !githubReady || !repo ? 0.5 : 1 }} disabled={busy === "pub" || !githubReady || !repo} onClick={publish}>{busy === "pub" ? "Publishing…" : "Publish live →"}</button>}
              {open.status === "published" && <button style={{ ...btn(), opacity: busy === "pub" || !githubReady ? 0.5 : 1 }} disabled={busy === "pub" || !githubReady} onClick={publish}>{busy === "pub" ? "Republishing…" : "Republish (refresh design)"}</button>}
              {open.status === "published" && open.url && <a href={open.url} target="_blank" rel="noopener noreferrer" style={{ ...btn(true), textDecoration: "none" }}>View live →</a>}
            </div>
          </div>
          <div className="m1col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ ...eyebrow, marginBottom: 6 }}>Title</div>
              <input style={inputStyle} value={open.title ?? ""} onChange={(e) => setOpen({ ...open, title: e.target.value })} readOnly={open.status === "published"} />
            </div>
            <div>
              <div style={{ ...eyebrow, marginBottom: 6 }}>URL slug</div>
              <input style={{ ...inputStyle, fontFamily: MONO, fontSize: 12 }} value={open.slug ?? ""} onChange={(e) => setOpen({ ...open, slug: e.target.value })} readOnly={open.status === "published"} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ ...eyebrow, marginBottom: 6 }}>Meta description</div>
            <input style={inputStyle} value={open.meta_description ?? ""} onChange={(e) => setOpen({ ...open, meta_description: e.target.value })} readOnly={open.status === "published"} />
          </div>
          <div style={{ ...eyebrow, marginBottom: 6 }}>Preview (rendered with the client site’s own stylesheet)</div>
          <iframe title="Article preview" sandbox="" srcDoc={previewDoc(open)} style={{ width: "100%", height: "70vh", border: `1px solid ${T.border}`, borderRadius: 2, background: "#0a0a0c" }} />
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [state, setState] = useState<"loading" | "locked" | "in">("loading");
  const [configured, setConfigured] = useState(true);
  const [tab, setTab] = useState<"overview" | "scan" | "battle" | "exec" | "track" | "content" | "prospects" | "ads">("overview");
  const [data, setData] = useState<Overview | null>(null);
  const [dataErr, setDataErr] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setDataErr(null);
    try {
      const r = await fetch("/api/dashboard/data");
      if (r.status === 401) { setState("locked"); return; }
      if (!r.ok) { setDataErr(`Could not load data (${r.status}).`); return; }
      setData(await r.json());
    } catch { setDataErr("Could not load data."); }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/dashboard/auth");
        const d = await r.json();
        setConfigured(!!d.configured);
        if (d.authed) { setState("in"); loadData(); } else setState("locked");
      } catch { setState("locked"); }
    })();
  }, [loadData]);

  const logout = async () => { await fetch("/api/dashboard/auth", { method: "DELETE" }); setState("locked"); setData(null); };

  if (state === "loading") return <div className="dash-root" style={{ minHeight: "100vh", background: T.bg, color: T.muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 13 }}>Loading…</div>;
  if (state === "locked") return <Login configured={configured} onAuthed={() => { setState("in"); loadData(); }} />;

  const TABS: { id: typeof tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "scan", label: "Quick Scan" },
    { id: "battle", label: "Battle Plan" },
    { id: "exec", label: "90-Day Plan" },
    { id: "track", label: "Tracking" },
    { id: "content", label: "Content" },
    { id: "prospects", label: "Prospects" },
    { id: "ads", label: "Ads" },
  ];

  return (
    <div className="dash-root" style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: BODY }}>
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: T.surface, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/6SIGDashboardLogo.png" alt="6 Signal" style={{ height: 26, width: "auto", display: "block" }} />
          <div>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15 }}>6 Signal</div>
            <div style={{ ...eyebrow, fontSize: 10 }}>Command Center</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {tab === "overview" && <button style={{ ...btn(), padding: "7px 14px" }} onClick={loadData}>Refresh</button>}
          <button style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontFamily: MONO, fontSize: 12 }} onClick={logout}>Log out</button>
        </div>
      </div>

      <div className="dash-tabs" style={{ borderBottom: `1px solid ${T.border}`, padding: "0 24px", display: "flex", background: T.surface }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: "none", border: "none", color: tab === t.id ? T.accent : T.muted, fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: "14px 18px", borderBottom: `2px solid ${tab === t.id ? T.accent : "transparent"}`, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="dash-main" style={{ padding: 24, maxWidth: 1320, margin: "0 auto" }}>
        {dataErr && <div style={card({ borderColor: `${T.danger}66`, marginBottom: 16 })}><span style={{ color: T.danger, fontSize: 13 }}>{dataErr}</span></div>}
        {tab === "overview" && (data ? <OverviewTab data={data} /> : <div style={{ color: T.muted, fontFamily: MONO, fontSize: 13, padding: 40, textAlign: "center" }}>Loading data…</div>)}
        {tab === "scan" && <ScanTab businesses={data?.businesses ?? []} />}
        {tab === "battle" && <BattlePlanTab businesses={data?.businesses ?? []} />}
        {tab === "exec" && <ExecPlanTab businesses={data?.businesses ?? []} />}
        {tab === "track" && <TrackingTab businesses={data?.businesses ?? []} />}
        {tab === "content" && <ContentTab businesses={data?.businesses ?? []} />}
        {tab === "prospects" && <ProspectsTab />}
        {tab === "ads" && <AdsTab />}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${T.border}`, textAlign: "center", ...eyebrow }}>
          6 Signal Command Center · Internal
        </div>
      </div>
    </div>
  );
}
