"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MapHeatGrid } from "../../components/charts";

// Public client results page (/c/<token>) — the live view a client can open
// any time. Token-gated (unguessable), client-safe data only. Printable.

const T = { bg: "#060606", panel: "#0e0e0c", border: "rgba(255,255,255,0.07)", accent: "#E6FF00", text: "#f5f5f3", sub: "#a8a8a3", muted: "#6a6a64", ok: "#22c55e", warn: "#f97316" };
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const DISP = "'Chakra Petch', sans-serif";
const BODY = "'Inter', sans-serif";
const rateColor = (n: number) => (n < 45 ? "#ef4444" : n < 60 ? "#f97316" : n < 75 ? "#eab308" : "#22c55e");
const ENGINE_LABELS: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude", perplexity: "Perplexity", gemini: "Gemini", "google-ai": "Google AI Overviews", maps: "Google Maps" };

const card: React.CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 2, padding: 24, marginBottom: 16 };
const eyebrow: React.CSSProperties = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: T.muted };

export default function ClientSharePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/share/${token}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.business) { setData(d); setState("ok"); } else setState("missing"); })
      .catch(() => setState("missing"));
  }, [token]);

  if (state === "loading") return <div style={{ minHeight: "100vh", background: T.bg, color: T.muted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 13 }}>Loading…</div>;
  if (state === "missing") return <div style={{ minHeight: "100vh", background: T.bg, color: T.sub, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: BODY }}>This link isn&rsquo;t valid. Contact hello@6signal.co.</div>;

  const rep = data.report;
  const m = rep?.metrics;
  const n = rep?.narrative;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: BODY }}>
      <div className="dash-print-area" style={{ maxWidth: 860, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/6SIGDashboardLogo.png" alt="6 Signal" style={{ height: 26 }} />
            <div>
              <div style={{ fontFamily: DISP, fontWeight: 700, fontSize: 16 }}>6 Signal</div>
              <div style={{ ...eyebrow, fontSize: 9 }}>AI Visibility Report</div>
            </div>
          </div>
          <button onClick={() => window.print()} className="no-print" style={{ background: T.accent, color: "#060606", border: "none", fontFamily: DISP, fontWeight: 700, fontSize: 12, padding: "10px 16px", cursor: "pointer", textTransform: "uppercase" }}>
            Download PDF
          </button>
        </div>

        <div style={card}>
          <div style={{ ...eyebrow, marginBottom: 6 }}>{rep?.period_label ?? "Live view"}</div>
          <h1 style={{ fontFamily: DISP, fontWeight: 700, fontSize: 26, margin: "0 0 4px" }}>{data.business.name}</h1>
          <div style={{ fontSize: 13, color: T.muted }}>{data.business.trade} · {data.business.city}</div>
          {n?.headline && <p style={{ fontFamily: DISP, fontWeight: 700, fontSize: 18, lineHeight: 1.4, margin: "16px 0 0", color: T.text }}>{n.headline}</p>}
          {n?.summary && <p style={{ fontSize: 14, lineHeight: 1.7, color: T.sub, margin: "10px 0 0" }}>{n.summary}</p>}
          {n?.what_this_means && <p style={{ fontSize: 14, lineHeight: 1.7, color: T.sub, margin: "10px 0 0" }}>{n.what_this_means}</p>}
        </div>

        {m && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div style={card}><div style={eyebrow}>Named by AI</div><div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: m.mention_rate != null ? rateColor(m.mention_rate) : T.muted, marginTop: 6 }}>{m.mention_rate ?? "—"}%</div><div style={{ fontSize: 11, color: T.muted }}>{m.mention_rate_prev != null ? `was ${m.mention_rate_prev}% last period` : "of tracked buyer questions"}</div></div>
            <div style={card}><div style={eyebrow}>Share of voice</div><div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: T.accent, marginTop: 6 }}>{m.share_of_voice ?? "—"}%</div><div style={{ fontSize: 11, color: T.muted }}>you vs competitors in AI answers</div></div>
            <div style={card}><div style={eyebrow}>Plan progress</div><div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: T.text, marginTop: 6 }}>{m.tasks_done}/{m.tasks_total}</div><div style={{ fontSize: 11, color: T.muted }}>work items completed</div></div>
          </div>
        )}

        {m?.engines && (
          <div style={card}>
            <div style={{ ...eyebrow, marginBottom: 14 }}>Where you show up, engine by engine</div>
            {Object.entries(m.engines).filter(([, v]: any) => v.rate != null).map(([e, v]: any) => (
              <div key={e} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: T.text }}>{ENGINE_LABELS[e] ?? e}</span>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: rateColor(v.rate) }}>{v.rate}%{v.prev != null ? <span style={{ color: T.muted }}> · was {v.prev}%</span> : null}</span>
                </div>
                <div style={{ height: 6, background: T.border }}><div data-keep style={{ height: "100%", width: `${v.rate}%`, background: rateColor(v.rate) }} /></div>
              </div>
            ))}
          </div>
        )}

        {rep?.maps_grid && (
          <div style={card}>
            <div style={{ ...eyebrow, marginBottom: 4 }}>Google Maps coverage — where you win, block by block</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
              We searched Google Maps for &ldquo;{rep.maps_grid.keyword}&rdquo; from {rep.maps_grid.stats.total} points across your service area. Each dot is your ranking at that location.
            </div>
            <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
              <MapHeatGrid points={rep.maps_grid.points} center={rep.maps_grid.center ?? null} gridSize={rep.maps_grid.grid_size} spacingMiles={Number(rep.maps_grid.spacing_miles)} size={380} />
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div><div style={eyebrow}>Coverage</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: rateColor(rep.maps_grid.stats.coverage) }}>{rep.maps_grid.stats.coverage}%</div><div style={{ fontSize: 11, color: T.muted }}>of your area sees you in the top 10</div></div>
                  <div><div style={eyebrow}>Top-3 zones</div><div style={{ fontFamily: MONO, fontSize: 28, fontWeight: 700, color: T.ok }}>{rep.maps_grid.stats.top3}<span style={{ fontSize: 13, color: T.muted }}>/{rep.maps_grid.stats.total}</span></div><div style={{ fontSize: 11, color: T.muted }}>where you&rsquo;re a top pick</div></div>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[{ c: T.ok, l: "Top 3" }, { c: "#eab308", l: "4–10" }, { c: T.warn, l: "11–20" }, { c: "#ef4444", l: "Not found" }].map((x) => (
                    <span key={x.l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.sub }}><span data-keep style={{ width: 10, height: 10, borderRadius: 999, background: x.c, display: "inline-block" }} />{x.l}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {Array.isArray(rep?.ai_towns) && rep.ai_towns.length > 0 && (
          <div style={card}>
            <div style={{ ...eyebrow, marginBottom: 4 }}>AI visibility across your service area</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
              How often AI assistants recommend you when someone asks in each town you serve.
            </div>
            {rep.ai_towns.map((t: any) => (
              <div key={t.town} style={{ display: "grid", gridTemplateColumns: "140px 1fr 56px", gap: 12, alignItems: "center", marginBottom: 9 }}>
                <span style={{ fontSize: 13, color: T.text }}>{t.town}</span>
                <div style={{ height: 6, background: T.border }}><div data-keep style={{ height: "100%", width: `${t.score}%`, background: rateColor(t.score) }} /></div>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: rateColor(t.score), textAlign: "right" }}>{t.score}%</span>
              </div>
            ))}
          </div>
        )}

        {Array.isArray(rep?.top_citations) && rep.top_citations.length > 0 && (
          <div style={card}>
            <div style={{ ...eyebrow, marginBottom: 4 }}>The sources AI trusts in your market</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
              When AI assistants answer questions about {data.business.trade.toLowerCase()} services in your area, these are the websites they pull from. Our job is getting you onto — and above — this list.
            </div>
            {rep.top_citations.map((c: any) => (
              <div key={c.domain} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: c.owned ? T.accent : T.text }}>
                  {c.domain}{c.owned && <span style={{ marginLeft: 8, fontSize: 9, letterSpacing: "0.15em", color: T.accent }}>YOU</span>}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 11, color: T.muted }}>cited {c.count}×</span>
              </div>
            ))}
          </div>
        )}

        {Array.isArray(data.trend) && data.trend.length > 1 && (
          <div style={card}>
            <div style={{ ...eyebrow, marginBottom: 14 }}>Your visibility over time</div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 90 }}>
              {data.trend.map((t: any) => (
                <div key={t.date} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: 64, display: "flex", alignItems: "flex-end" }}><div data-keep style={{ width: "100%", height: `${t.rate}%`, background: rateColor(t.rate), minHeight: 2 }} /></div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: T.text, marginTop: 4 }}>{t.rate}%</div>
                  <div style={{ fontSize: 9, color: T.muted }}>{String(t.date).slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {rep?.wins?.length > 0 && (
          <div style={{ ...card, borderColor: `${T.ok}44` }}>
            <div style={{ ...eyebrow, color: T.ok, marginBottom: 12 }}>New wins</div>
            {rep.wins.map((w: string, i: number) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ color: T.ok }}>✓</span><span style={{ fontSize: 13, color: T.text }}>{w}</span></div>)}
          </div>
        )}

        {(n?.focus_next?.length > 0 || data.tasks?.client_open?.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {n?.focus_next?.length > 0 && (
              <div style={card}><div style={{ ...eyebrow, marginBottom: 10 }}>What we&rsquo;re doing next</div>{n.focus_next.map((f: string, i: number) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ color: T.accent }}>•</span><span style={{ fontSize: 13, color: T.sub }}>{f}</span></div>)}</div>
            )}
            {data.tasks?.client_open?.length > 0 && (
              <div style={{ ...card, borderColor: `${T.accent}44` }}><div style={{ ...eyebrow, color: T.accent, marginBottom: 10 }}>What we need from you</div>{data.tasks.client_open.map((t: string, i: number) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ color: T.accent }}>→</span><span style={{ fontSize: 13, color: T.text }}>{t}</span></div>)}</div>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", padding: "20px 0", ...eyebrow }}>
          6 Signal · AI visibility for contractors · hello@6signal.co
        </div>
      </div>
    </div>
  );
}
