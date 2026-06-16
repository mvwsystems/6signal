"use client";
import { useState, useEffect, useCallback, useMemo } from "react";

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
interface Biz { id: string; name: string; url: string | null; trade: string; city: string; created_at: string }
interface AuditRow { id: string; business_id: string | null; tier: string; overall_score: number | null; status: string; created_at: string }
interface ScoreRow { audit_id: string; signal: string; score: number }
interface LeadRow { id: string; business_id: string | null; email: string; source: string; created_at: string }
interface PurchaseRow { amount_total: number | null; product: string; email: string | null; created_at: string }
interface Overview { businesses: Biz[]; audits: AuditRow[]; signalScores: ScoreRow[]; leads: LeadRow[]; purchases: PurchaseRow[] }

// ─── Radar ───────────────────────────────────────────────────────────────────
function Radar({ scores, size = 200 }: { scores: Record<string, number>; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.36, n = SIGNALS.length;
  const axis = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const grid = [0.25, 0.5, 0.75, 1].map((lvl) =>
    SIGNALS.map((_, i) => `${cx + r * lvl * Math.cos(axis(i))},${cy + r * lvl * Math.sin(axis(i))}`).join(" ")
  );
  const pts = SIGNALS.map((s, i) => {
    const v = Math.max(0, Math.min(100, scores[s.key] || 0)) / 100;
    return { x: cx + r * v * Math.cos(axis(i)), y: cy + r * v * Math.sin(axis(i)), s };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {grid.map((g, i) => <polygon key={i} points={g} fill="none" stroke={T.border} strokeWidth="1" />)}
      {SIGNALS.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(axis(i))} y2={cy + r * Math.sin(axis(i))} stroke={T.border} strokeWidth="1" />
      ))}
      <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill={`${T.accent}1f`} stroke={T.accent} strokeWidth="1.5" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={scoreColor(scores[p.s.key] || 0)} stroke={T.bg} strokeWidth="1.5" />)}
      {SIGNALS.map((s, i) => (
        <text key={i} x={cx + (r + 16) * Math.cos(axis(i))} y={cy + (r + 16) * Math.sin(axis(i))}
          textAnchor="middle" dominantBaseline="middle" fill={T.textSub} fontSize="10" fontWeight="700" fontFamily={MONO}>
          {s.label}
        </text>
      ))}
    </svg>
  );
}

function Ring({ score, size = 104 }: { score: number; size?: number }) {
  const t = tierOf(score);
  const c = 2 * Math.PI * 45;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0 }}>
        <circle cx="50" cy="50" r="45" fill="none" stroke={T.border} strokeWidth="7" />
        <circle cx="50" cy="50" r="45" fill="none" stroke={t.color} strokeWidth="7" strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c} strokeLinecap="round" transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: size * 0.26, color: t.color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: size * 0.1, color: T.muted }}>/ 100</div>
      </div>
    </div>
  );
}

function SignalBars({ scores, findings }: { scores: Record<string, number>; findings?: Record<string, { finding?: string; gap?: string }> }) {
  return (
    <div>
      {SIGNALS.map((s) => {
        const sc = scores[s.key] || 0;
        const col = scoreColor(sc);
        const f = findings?.[s.key];
        return (
          <div key={s.key} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
              <span><span style={{ fontWeight: 700, fontSize: 13, color: T.text, fontFamily: MONO }}>{s.label}</span>
                <span style={{ fontSize: 12, color: T.muted, marginLeft: 8 }}>{s.full}</span></span>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: col }}>{sc} / 100</span>
            </div>
            <div style={{ height: 5, background: T.border, borderRadius: 0, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${sc}%`, background: col, transition: "width .8s ease" }} />
            </div>
            {f?.finding && <div style={{ fontSize: 12, color: T.textSub, marginTop: 6, lineHeight: 1.5 }}>{f.finding}</div>}
            {f?.gap && <div style={{ fontSize: 12, color: T.warn, marginTop: 3, lineHeight: 1.5 }}>↳ {f.gap}</div>}
          </div>
        );
      })}
    </div>
  );
}

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
        <div style={{ ...eyebrow, marginBottom: 8 }}>6 Signal</div>
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

function ReportRunner({ cta, subtitle, longNote, endpoint, render }: {
  cta: string; subtitle: string; longNote: string; endpoint: string;
  render: (data: any, form: Record<string, string>) => React.ReactNode;
}) {
  const [form, setForm] = useState({ name: "", url: "", trade: "", city: "" });
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ready = form.name && form.url && form.trade && form.city;

  const run = async () => {
    if (!ready) return;
    setRunning(true); setErr(null); setData(null);
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || `Server error ${r.status}`);
      setData(d);
    } catch (e: any) { setErr(e?.message || "Request failed."); }
    finally { setRunning(false); }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>
      <div style={card()}>
        <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{cta}</div>
        <div style={{ ...eyebrow, marginBottom: 16 }}>{subtitle}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={inputStyle} placeholder="Business name" value={form.name} onChange={set("name")} />
          <input style={inputStyle} placeholder="Website (e.g. acme.com)" value={form.url} onChange={set("url")} />
          <input style={inputStyle} placeholder="Trade (e.g. Plumbing)" value={form.trade} onChange={set("trade")} />
          <input style={inputStyle} placeholder="City / market" value={form.city} onChange={set("city")} />
          <button style={{ ...btn(true), width: "100%", opacity: running || !ready ? 0.5 : 1 }} onClick={run} disabled={running || !ready}>
            {running ? "Working…" : cta}
          </button>
        </div>
        {running && <p style={{ fontSize: 12, color: T.muted, marginTop: 12, lineHeight: 1.5 }}>{longNote}</p>}
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
        {data && <div>{render(data, form)}</div>}
      </div>
    </div>
  );
}

const ownerColor = (o?: string) => (String(o).toLowerCase().includes("client") ? T.textSub : T.accent);

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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
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

function ScanTab() {
  return <ReportRunner cta="Run scan" subtitle="Fast live triage" endpoint="/api/dashboard/scan" longNote="Crawling the site + live web search to check AI citations — ~1–2 min." render={renderScan} />;
}
function BattlePlanTab() {
  return <ReportRunner cta="Build battle plan" subtitle="Deep pre-meeting intel" endpoint="/api/dashboard/battle-plan" longNote="Deep web research + competitor teardown + local audit — this can take 2–4 min." render={renderBattlePlan} />;
}
function ExecPlanTab() {
  return <ReportRunner cta="Build 90-day plan" subtitle="Post-signing execution plan" endpoint="/api/dashboard/execution-plan" longNote="Researching the market and phasing the 90-day plan — this can take 2–4 min." render={renderExecPlan} />;
}

// ─── Tracking tab (continuous multi-engine visibility) ───────────────────────────
const ENGINE_LABELS: Record<string, string> = { chatgpt: "ChatGPT", perplexity: "Perplexity", gemini: "Gemini" };
const ENGINE_KEYS = ["chatgpt", "perplexity", "gemini"];

function TrackingTab({ businesses }: { businesses: Biz[] }) {
  const [bizId, setBizId] = useState("");
  const [prompts, setPrompts] = useState<{ id: string; prompt: string }[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<{ prompt: string; source?: string; volume?: number | null }[]>([]);
  const [newPrompt, setNewPrompt] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [runMsg, setRunMsg] = useState<string | null>(null);

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
      const r = await fetch("/api/dashboard/track/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: bizId }) });
      const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.error || "Run failed");
      setRunMsg(`Probed ${d.promptsRun}/${d.promptsTotal} prompts across ${(d.engines || []).length} engine(s).${d.skipped ? ` ${d.skipped} will run on the weekly schedule.` : ""}`);
      await loadFor(bizId);
    } catch (e: any) { setErr(e?.message || "Run failed"); } finally { setBusy(null); }
  };

  // summary from latest probe per (prompt, engine)
  const latest: Record<string, any> = {};
  for (const r of results) latest[`${r.prompt_id}|${r.engine}`] = r;
  const latestRows = Object.values(latest) as any[];
  const eng: Record<string, { answered: number; mentioned: number }> = { chatgpt: { answered: 0, mentioned: 0 }, perplexity: { answered: 0, mentioned: 0 }, gemini: { answered: 0, mentioned: 0 } };
  let bizMentions = 0, compMentions = 0;
  for (const r of latestRows) { if (eng[r.engine]) { eng[r.engine].answered++; if (r.mentioned) eng[r.engine].mentioned++; } if (r.mentioned) bizMentions++; compMentions += Array.isArray(r.competitors) ? r.competitors.length : 0; }
  const totMen = latestRows.filter((r) => r.mentioned).length;
  const overall = latestRows.length ? Math.round((100 * totMen) / latestRows.length) : 0;
  const sov = bizMentions + compMentions > 0 ? Math.round((100 * bizMentions) / (bizMentions + compMentions)) : 0;
  const byDay: Record<string, { a: number; m: number }> = {};
  for (const r of results) { const d = String(r.run_at).slice(0, 10); (byDay[d] ||= { a: 0, m: 0 }); byDay[d].a++; if (r.mentioned) byDay[d].m++; }
  const days = Object.keys(byDay).sort();

  const selectStyle: React.CSSProperties = { ...inputStyle, width: "auto", minWidth: 260 };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select style={selectStyle} value={bizId} onChange={(e) => setBizId(e.target.value)}>
          <option value="">Select a business…</option>
          {businesses.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
        </select>
        {bizId && <button style={{ ...btn(true), opacity: busy === "run" ? 0.5 : 1 }} onClick={runNow} disabled={busy === "run"}>{busy === "run" ? "Probing…" : "Run probes now"}</button>}
        {runMsg && <span style={{ fontSize: 12, color: T.textSub }}>{runMsg}</span>}
      </div>

      {!businesses.length && <div style={card({ padding: 48, textAlign: "center" })}><p style={{ fontSize: 14, color: T.muted, margin: 0 }}>No businesses yet. Run a scan or wait for a lead, then track them here.</p></div>}
      {err && <div style={card({ borderColor: `${T.danger}66`, marginBottom: 16 })}><span style={{ color: T.danger, fontSize: 13 }}>{err}</span></div>}

      {bizId && (
        <>
          {latestRows.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
              {ENGINE_KEYS.map((e) => {
                const rate = eng[e].answered ? Math.round((100 * eng[e].mentioned) / eng[e].answered) : null;
                return <div key={e} style={card({ display: "flex", flexDirection: "column", gap: 6 })}>
                  <span style={eyebrow}>{ENGINE_LABELS[e]}</span>
                  <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: rate === null ? T.muted : scoreColor(rate) }}>{rate === null ? "—" : `${rate}%`}</span>
                  <span style={{ fontSize: 11, color: T.muted }}>named in answers</span>
                </div>;
              })}
              <div style={card({ display: "flex", flexDirection: "column", gap: 6 })}><span style={eyebrow}>Overall</span><span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: scoreColor(overall) }}>{overall}%</span><span style={{ fontSize: 11, color: T.muted }}>mention rate</span></div>
              <div style={card({ display: "flex", flexDirection: "column", gap: 6 })}><span style={eyebrow}>Share of voice</span><span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: T.accent }}>{sov}%</span><span style={{ fontSize: 11, color: T.muted }}>you vs competitors</span></div>
            </div>
          )}

          {days.length > 1 && (
            <div style={card({ marginBottom: 20 })}>
              <div style={{ ...eyebrow, marginBottom: 12 }}>Mention-rate trend</div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 80 }}>
                {days.map((d) => { const pct = byDay[d].a ? Math.round((100 * byDay[d].m) / byDay[d].a) : 0; return (
                  <div key={d} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ height: 60, display: "flex", alignItems: "flex-end" }}><div style={{ width: "100%", height: `${pct}%`, background: scoreColor(pct), minHeight: 2 }} /></div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: T.text }}>{pct}%</div>
                    <div style={{ fontSize: 9, color: T.muted }}>{d.slice(5)}</div>
                  </div>
                ); })}
              </div>
            </div>
          )}

          {/* Prompt management */}
          <div style={card({ marginBottom: 20 })}>
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
            <div style={card({ padding: 0, overflow: "hidden" })}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px", padding: "12px 18px", borderBottom: `1px solid ${T.border}`, ...eyebrow }}>
                <span>Prompt</span>{ENGINE_KEYS.map((e) => <span key={e} style={{ textAlign: "center" }}>{ENGINE_LABELS[e]}</span>)}
              </div>
              {prompts.map((p) => (
                <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 90px 90px", padding: "12px 18px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
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
        </>
      )}
    </div>
  );
}

// ─── Overview tab ────────────────────────────────────────────────────────────────
function OverviewTab({ data }: { data: Overview }) {
  const [selected, setSelected] = useState<string | null>(null);

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

  const revenue = data.purchases.reduce((sum, p) => sum + (p.amount_total || 0), 0);
  const scored = data.businesses.map((b) => latestByBiz[b.id]?.overall_score).filter((s): s is number => typeof s === "number");
  const avg = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0;

  const sel = selected ? data.businesses.find((b) => b.id === selected) : null;
  const selAudit = sel ? latestByBiz[sel.id] : null;
  const selScores = selAudit ? scoresByAudit[selAudit.id] || {} : {};
  const selTrend = sel ? data.audits.filter((a) => a.business_id === sel.id && typeof a.overall_score === "number") : [];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <Stat label="Businesses" value={String(data.businesses.length)} accent />
        <Stat label="Leads" value={String(data.leads.length)} />
        <Stat label="Revenue" value={fmtMoney(revenue)} />
        <Stat label="Avg score" value={scored.length ? `${avg} / 100` : "—"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr 380px" : "1fr", gap: 20, alignItems: "start" }}>
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
          </div>
        )}
      </div>
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

// ─── Main ────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [state, setState] = useState<"loading" | "locked" | "in">("loading");
  const [configured, setConfigured] = useState(true);
  const [tab, setTab] = useState<"overview" | "scan" | "battle" | "exec" | "track" | "ads">("overview");
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
    { id: "ads", label: "Ads" },
  ];

  return (
    <div className="dash-root" style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: BODY }}>
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: T.surface, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, background: T.accent, color: "#060606", fontFamily: MONO, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>6S</div>
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

      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "0 24px", display: "flex", background: T.surface }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: "none", border: "none", color: tab === t.id ? T.accent : T.muted, fontFamily: DISP, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: "14px 18px", borderBottom: `2px solid ${tab === t.id ? T.accent : "transparent"}`, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: 24, maxWidth: 1320, margin: "0 auto" }}>
        {dataErr && <div style={card({ borderColor: `${T.danger}66`, marginBottom: 16 })}><span style={{ color: T.danger, fontSize: 13 }}>{dataErr}</span></div>}
        {tab === "overview" && (data ? <OverviewTab data={data} /> : <div style={{ color: T.muted, fontFamily: MONO, fontSize: 13, padding: 40, textAlign: "center" }}>Loading data…</div>)}
        {tab === "scan" && <ScanTab />}
        {tab === "battle" && <BattlePlanTab />}
        {tab === "exec" && <ExecPlanTab />}
        {tab === "track" && <TrackingTab businesses={data?.businesses ?? []} />}
        {tab === "ads" && <AdsTab />}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${T.border}`, textAlign: "center", ...eyebrow }}>
          6 Signal Command Center · Internal
        </div>
      </div>
    </div>
  );
}
