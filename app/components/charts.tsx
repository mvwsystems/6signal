"use client";
import React from "react";

// ─── 6 Signal chart primitives ────────────────────────────────────────────────
// Hand-built SVG, zero dependencies, on-brand (#060606 ground, #E6FF00 accent,
// JetBrains Mono numerals). Extracted from the dashboard so they're reusable —
// and syncable to Claude Design as real components.

const C = {
  bg: "#060606",
  border: "rgba(255,255,255,0.07)",
  accent: "#E6FF00",
  text: "#f5f5f3",
  textSub: "#a8a8a3",
  muted: "#6a6a64",
  danger: "#ef4444",
  warn: "#f97316",
  ok: "#22c55e",
};
const MONO = "'JetBrains Mono', ui-monospace, monospace";

export const SIGNALS = [
  { key: "geo", label: "GEO", full: "Generative Engine Optimization" },
  { key: "aeo", label: "AEO", full: "Answer Engine Optimization" },
  { key: "leo", label: "LEO", full: "Local Entity Optimization" },
  { key: "veo", label: "VEO", full: "Voice Engine Optimization" },
  { key: "peo", label: "PEO", full: "Prompt Engine Optimization" },
  { key: "ieo", label: "IEO", full: "Index Engine Optimization" },
];

// 0–100 thresholds — same language as the customer-facing brief.
export const scoreColor = (s: number) => (s < 45 ? C.danger : s < 60 ? C.warn : s < 75 ? "#eab308" : C.ok);
export const tierOf = (s: number) =>
  s < 45 ? { label: "Invisible", color: C.danger }
  : s < 60 ? { label: "Emerging", color: C.warn }
  : s < 75 ? { label: "Visible", color: "#eab308" }
  : { label: "Dominant", color: C.ok };

/** Six-signal radar: plots GEO/AEO/LEO/VEO/PEO/IEO scores (0–100) on a hex grid. */
export function Radar({ scores, size = 200 }: { scores: Record<string, number>; size?: number }) {
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
      {grid.map((g, i) => <polygon key={i} points={g} fill="none" stroke={C.border} strokeWidth="1" />)}
      {SIGNALS.map((_, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(axis(i))} y2={cy + r * Math.sin(axis(i))} stroke={C.border} strokeWidth="1" />
      ))}
      <polygon points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill={`${C.accent}1f`} stroke={C.accent} strokeWidth="1.5" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill={scoreColor(scores[p.s.key] || 0)} stroke={C.bg} strokeWidth="1.5" />)}
      {SIGNALS.map((s, i) => (
        <text key={i} x={cx + (r + 16) * Math.cos(axis(i))} y={cy + (r + 16) * Math.sin(axis(i))}
          textAnchor="middle" dominantBaseline="middle" fill={C.textSub} fontSize="10" fontWeight="700" fontFamily={MONO}>
          {s.label}
        </text>
      ))}
    </svg>
  );
}

/** Score ring: a 0–100 score with tier-colored progress arc (Invisible → Dominant). */
export function Ring({ score, size = 104 }: { score: number; size?: number }) {
  const t = tierOf(score);
  const c = 2 * Math.PI * 45;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0 }}>
        <circle cx="50" cy="50" r="45" fill="none" stroke={C.border} strokeWidth="7" />
        <circle cx="50" cy="50" r="45" fill="none" stroke={t.color} strokeWidth="7" strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c} strokeLinecap="round" transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: size * 0.26, color: t.color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: size * 0.1, color: C.muted }}>/ 100</div>
      </div>
    </div>
  );
}

/** Per-signal horizontal bars with optional finding/gap annotations. */
export function SignalBars({ scores, findings }: { scores: Record<string, number>; findings?: Record<string, { finding?: string; gap?: string }> }) {
  return (
    <div>
      {SIGNALS.map((s) => {
        const sc = scores[s.key] || 0;
        const col = scoreColor(sc);
        const f = findings?.[s.key];
        return (
          <div key={s.key} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
              <span><span style={{ fontWeight: 700, fontSize: 13, color: C.text, fontFamily: MONO }}>{s.label}</span>
                <span style={{ fontSize: 12, color: C.muted, marginLeft: 8 }}>{s.full}</span></span>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 13, color: col }}>{sc} / 100</span>
            </div>
            <div style={{ height: 5, background: C.border, borderRadius: 0, overflow: "hidden" }}>
              <div data-keep style={{ height: "100%", width: `${sc}%`, background: col, transition: "width .8s ease" }} />
            </div>
            {f?.finding && <div style={{ fontSize: 12, color: C.textSub, marginTop: 6, lineHeight: 1.5 }}>{f.finding}</div>}
            {f?.gap && <div style={{ fontSize: 12, color: C.warn, marginTop: 3, lineHeight: 1.5 }}>↳ {f.gap}</div>}
          </div>
        );
      })}
    </div>
  );
}

/** Multi-series 0–100 line chart with gridlines; the "Overall" series renders heavier. */
export function LineChart({ days, series, height = 190 }: { days: string[]; series: { label: string; color: string; values: (number | null)[] }[]; height?: number }) {
  const w = 680, h = height, padL = 26, padR = 12, padT = 10, padB = 22;
  const iw = w - padL - padR, ih = h - padT - padB, n = days.length;
  const x = (i: number) => (n <= 1 ? padL + iw / 2 : padL + (iw * i) / (n - 1));
  const y = (v: number) => padT + ih * (1 - v / 100);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      {[0, 25, 50, 75, 100].map((g) => (
        <g key={g}>
          <line x1={padL} y1={y(g)} x2={w - padR} y2={y(g)} stroke={C.border} strokeWidth="1" />
          <text x={padL - 6} y={y(g) + 3} textAnchor="end" fontSize="9" fill={C.muted} fontFamily={MONO}>{g}</text>
        </g>
      ))}
      {series.map((s, si) => {
        const pts = s.values.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean) as string[];
        const isOverall = s.label === "Overall";
        return (
          <g key={si}>
            <polyline points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth={isOverall ? 2.6 : 1.6} strokeLinejoin="round" strokeLinecap="round" />
            {s.values.map((v, i) => (v == null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={isOverall ? 3 : 2.4} fill={s.color} />))}
          </g>
        );
      })}
      {days.map((d, i) => (i === 0 || i === n - 1 || i === Math.floor(n / 2) ? <text key={i} x={x(i)} y={h - 5} textAnchor="middle" fontSize="9" fill={C.muted} fontFamily={MONO}>{d.slice(5)}</text> : null))}
    </svg>
  );
}

/** Share-of-voice donut: first segment is "you", center shows its percentage. */
export function Donut({ segments, size = 150 }: { segments: { label: string; value: number; color: string }[]; size?: number }) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  const r = size * 0.4, c = 2 * Math.PI * r, cx = size / 2, cy = size / 2, sw = size * 0.13;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={sw} />
      {segments.map((s, i) => {
        const frac = s.value / total, dash = `${frac * c} ${c}`, off = -acc * c;
        acc += frac;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={sw} strokeDasharray={dash} strokeDashoffset={off} transform={`rotate(-90 ${cx} ${cy})`} />;
      })}
      <text x={cx} y={cy - 1} textAnchor="middle" fontFamily={MONO} fontWeight="700" fontSize={size * 0.2} fill={C.accent}>{Math.round((100 * (segments[0]?.value || 0)) / total)}%</text>
      <text x={cx} y={cy + size * 0.13} textAnchor="middle" fontSize={size * 0.08} fill={C.muted} fontFamily={MONO}>SoV</text>
    </svg>
  );
}

/** Tiny 0–100 trend line for stat cards. Renders nothing with fewer than 2 points. */
export function Sparkline({ values, color, width = 130, height = 26 }: { values: (number | null)[]; color: string; width?: number; height?: number }) {
  if ((values.filter((v) => v != null) as number[]).length < 2) return null;
  const n = values.length;
  const x = (i: number) => (width * i) / (n - 1);
  const y = (v: number) => height - 2 - (height - 4) * (v / 100);
  const pts = values.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean) as string[];
  return <svg width={width} height={height} style={{ display: "block", marginTop: 4 }}><polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /></svg>;
}
