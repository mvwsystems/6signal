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

// ─── Scan tab (live audit engine) ───────────────────────────────────────────────
function ScanTab() {
  const [form, setForm] = useState({ name: "", url: "", trade: "", city: "" });
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [audit, setAudit] = useState<any>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ready = form.name && form.url && form.trade && form.city;

  const run = async () => {
    if (!ready) return;
    setRunning(true); setErr(null); setAudit(null);
    try {
      const r = await fetch("/api/dashboard/scan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Server error ${r.status}`);
      setAudit(data);
    } catch (e: any) { setErr(e?.message || "Scan failed."); }
    finally { setRunning(false); }
  };

  const scores: Record<string, number> = {};
  const findings: Record<string, { finding?: string; gap?: string }> = {};
  if (audit?.signals) for (const k of Object.keys(audit.signals)) { scores[k] = Number(audit.signals[k]?.score) || 0; findings[k] = { finding: audit.signals[k]?.finding, gap: audit.signals[k]?.gap }; }
  const overall = Number(audit?.overall?.score) || 0;
  const tier = tierOf(overall);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>
      <div style={card()}>
        <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Run a scan</div>
        <div style={{ ...eyebrow, marginBottom: 16 }}>Live 6-signal audit</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={inputStyle} placeholder="Business name" value={form.name} onChange={set("name")} />
          <input style={inputStyle} placeholder="Website (e.g. acme.com)" value={form.url} onChange={set("url")} />
          <input style={inputStyle} placeholder="Trade (e.g. Plumbing)" value={form.trade} onChange={set("trade")} />
          <input style={inputStyle} placeholder="City / market" value={form.city} onChange={set("city")} />
          <button style={{ ...btn(true), width: "100%", opacity: running || !ready ? 0.5 : 1 }} onClick={run} disabled={running || !ready}>
            {running ? "Scanning…" : "Run audit"}
          </button>
        </div>
        {running && <p style={{ fontSize: 12, color: T.muted, marginTop: 12, lineHeight: 1.5 }}>Crawling the site and searching the live web to check AI citations — this can take 1–2 min.</p>}
      </div>

      <div>
        {err && <div style={{ ...card({ borderColor: `${T.danger}66`, marginBottom: 16 }) }}><span style={{ color: T.danger, fontSize: 13 }}>{err}</span></div>}
        {!audit && !running && !err && (
          <div style={card({ padding: 56, textAlign: "center", border: `1px dashed ${T.border}` })}>
            <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>AI Visibility scan</div>
            <p style={{ fontSize: 14, color: T.muted, maxWidth: 380, margin: "0 auto", lineHeight: 1.6 }}>
              Enter a business and run a live audit to score all six signals. Saved automatically — it shows up in Overview and feeds the trend.
            </p>
          </div>
        )}
        {running && !audit && (
          <div style={card({ padding: 56, textAlign: "center" })}>
            <div style={{ fontFamily: MONO, color: T.accent, fontSize: 13 }}>Scanning {form.name}…</div>
          </div>
        )}
        {audit && (
          <div>
            <div style={card({ display: "flex", gap: 24, alignItems: "center", marginBottom: 16, borderColor: `${tier.color}55` })}>
              <Ring score={overall} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 20 }}>{audit?.business?.name || form.name}</span>
                  <span style={{ background: `${tier.color}1f`, color: tier.color, fontWeight: 700, fontSize: 11, padding: "3px 10px", borderRadius: 20, border: `1px solid ${tier.color}55`, fontFamily: MONO }}>{tier.label}</span>
                  <span style={{ background: audit?.business?.found ? `${T.ok}1f` : `${T.danger}1f`, color: audit?.business?.found ? T.ok : T.danger, fontWeight: 700, fontSize: 11, padding: "3px 10px", borderRadius: 20, fontFamily: MONO }}>
                    {audit?.business?.found ? "NAMED BY AI" : "NOT NAMED"}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: T.muted }}>{[form.trade, form.city, form.url].filter(Boolean).join(" · ")}</div>
              </div>
              <Radar scores={scores} size={180} />
            </div>

            {audit?.ai_answer && (
              <div style={card({ marginBottom: 16, borderColor: `${T.accent}33` })}>
                <div style={{ ...eyebrow, marginBottom: 8 }}>What AI says — &ldquo;best {form.trade} in {form.city}&rdquo;</div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: T.text, margin: 0 }}>{audit.ai_answer}</p>
                {Array.isArray(audit?.competitors) && audit.competitors.length > 0 && (
                  <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {audit.competitors.map((c: string, i: number) => (
                      <span key={i} style={{ fontFamily: MONO, fontSize: 11, color: T.textSub, border: `1px solid ${T.border}`, padding: "3px 10px" }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(audit?.top_opportunity || audit?.immediate_win) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {audit?.top_opportunity && (
                  <div style={card()}>
                    <div style={{ ...eyebrow, color: T.ok, marginBottom: 6 }}>Top opportunity</div>
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: T.text, margin: 0 }}>{audit.top_opportunity}</p>
                  </div>
                )}
                {audit?.immediate_win && (
                  <div style={card()}>
                    <div style={{ ...eyebrow, color: T.accent, marginBottom: 6 }}>Immediate win</div>
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: T.text, margin: 0 }}>{audit.immediate_win}</p>
                  </div>
                )}
              </div>
            )}

            <div style={card()}>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14, marginBottom: 18 }}>Signal breakdown</div>
              <SignalBars scores={scores} findings={findings} />
            </div>
          </div>
        )}
      </div>
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
  const [tab, setTab] = useState<"overview" | "scan" | "ads">("overview");
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
    { id: "scan", label: "Run Scan" },
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
        {tab === "ads" && <AdsTab />}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${T.border}`, textAlign: "center", ...eyebrow }}>
          6 Signal Command Center · Internal
        </div>
      </div>
    </div>
  );
}
