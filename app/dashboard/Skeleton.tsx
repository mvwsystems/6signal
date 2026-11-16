"use client";
import { T } from "./theme";

// Loading placeholders shaped like the content that is about to arrive, so a
// panel fills in place instead of a "Loading…" line being replaced by a much
// taller list (the jump that made pages feel jerky). The shimmer stops for
// anyone who has asked their device to reduce motion (globals.css).

export function Bar({ w = "100%", h = 12, style }: { w?: number | string; h?: number; style?: React.CSSProperties }) {
  return <span className="dash-skel" aria-hidden="true" style={{ display: "block", width: w, height: h, ...style }} />;
}

// A stack of card-shaped rows, like Today's sections or the Approvals list.
export function SkeletonCards({ count = 3, label = "Loading" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-label={label} style={{ display: "grid", gap: 12 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
          <Bar w={i % 2 ? "46%" : "58%"} h={14} />
          <Bar w="88%" style={{ marginTop: 12 }} />
          <Bar w="32%" h={10} style={{ marginTop: 10 }} />
        </div>
      ))}
    </div>
  );
}

// One card holding a list of lines, like the Changelog, Activity or a table.
export function SkeletonList({ rows = 6, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-label={label} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10 }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ padding: "12px 14px", borderTop: i ? `1px solid ${T.border}` : "none" }}>
          <Bar w={`${70 - ((i * 13) % 30)}%`} h={13} />
          <Bar w="28%" h={10} style={{ marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}

// Lines inside an existing card (a section body that is still loading).
export function SkeletonLines({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-hidden="true" style={{ padding: "16px 20px", display: "grid", gap: 12 }}>
      {Array.from({ length: rows }, (_, i) => <Bar key={i} w={`${82 - ((i * 17) % 40)}%`} />)}
    </div>
  );
}

// The whole screen while the sign-in check runs: menu on the left, a title
// and a few cards, so the dashboard doesn't flash from a blank page.
export function SkeletonShell() {
  return (
    <div className="dash-root dash-shell" role="status" aria-label="Loading the Command Center" style={{ minHeight: "100vh", background: T.bg, display: "flex" }}>
      <div className="dash-sidebar" style={{ width: 240, flexShrink: 0, height: "100vh", background: "#111111", position: "sticky", top: 0 }} />
      <main className="dash-main" style={{ flex: 1, padding: 24, maxWidth: 1280, margin: "0 auto" }}>
        <Bar w={180} h={26} />
        <Bar w={320} h={12} style={{ marginTop: 10, marginBottom: 28 }} />
        <SkeletonCards count={3} />
      </main>
    </div>
  );
}
