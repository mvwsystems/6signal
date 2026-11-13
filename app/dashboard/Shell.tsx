"use client";
import { useEffect, useState } from "react";
import { T, MONO, DISP, BODY, alpha } from "./theme";

// ─────────────────────────────────────────────────────────────────────────────
// Command Center shell: a left side menu modeled on the Manus CRM layout.
// Always-dark sidebar with grouped, icon + label items; collapses to icons on
// desktop (remembered per browser) and becomes a slide-out drawer behind a
// menu button on phones. The main area keeps the light/dark dashboard theme.
// ─────────────────────────────────────────────────────────────────────────────

export interface NavItem<Id extends string> { id: Id; label: string; icon: IconName }
export interface NavGroup<Id extends string> { label: string; items: NavItem<Id>[] }

type IconName =
  | "grid" | "users" | "scan" | "target" | "calendar" | "chart" | "pen" | "list"
  | "file" | "mail" | "megaphone" | "dollar";

// Simple 24×24 stroke icons (no icon library in this repo).
const PATHS: Record<IconName, string> = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  scan: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  chart: "M3 3v18h18M7 15l4-4 3 3 5-6",
  pen: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  list: "M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6",
  megaphone: "M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a3 3 0 0 1 0 6M18 6a7 7 0 0 1 0 12",
  dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
};

function Icon({ name, size = 18 }: { name: IconName | "menu" | "panel" | "sun" | "moon" | "logout" | "close"; size?: number }) {
  const extra: Record<string, string> = {
    menu: "M3 6h18M3 12h18M3 18h18",
    panel: "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 3v18",
    sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
    moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
    logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
    close: "M18 6 6 18M6 6l12 12",
  };
  const d = (PATHS as Record<string, string>)[name] ?? extra[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );
}

// Sidebar palette: always dark, like the Manus CRM, in both themes.
const S = { bg: "#111111", hover: "#1c1c1c", active: "#222222", border: "#222222", text: "#e8e8e6", sub: "#8f8f8a", accent: "#E6FF00" };
const COLLAPSE_KEY = "6sig_db_nav_collapsed";

export default function Shell<Id extends string>({
  groups, active, onSelect, title, actions, theme, onToggleTheme, onLogout, children,
}: {
  groups: NavGroup<Id>[];
  active: Id;
  onSelect: (id: Id) => void;
  title: string;
  actions?: React.ReactNode;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch { /* private mode */ }
  }, []);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const toggleCollapsed = () => setCollapsed((c) => {
    try { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); } catch { /* private mode */ }
    return !c;
  });
  const pick = (id: Id) => { onSelect(id); setDrawer(false); };

  const nav = (compact: boolean) => (
    <nav aria-label="Command Center" style={{ display: "flex", flexDirection: "column", height: "100%", background: S.bg, color: S.text, fontFamily: BODY }}>
      <div style={{ height: 60, display: "flex", alignItems: "center", gap: 10, padding: "0 12px", borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
        <button className="dash-nav-collapse" aria-label={compact ? "Expand menu" : "Collapse menu"} onClick={toggleCollapsed}
          style={{ background: "none", border: "none", color: S.sub, padding: 6, borderRadius: 6, display: "flex" }}>
          <Icon name="panel" />
        </button>
        <button className="dash-nav-close" aria-label="Close menu" onClick={() => setDrawer(false)}
          style={{ background: "none", border: "none", color: S.sub, padding: 6, borderRadius: 6, display: "none" }}>
          <Icon name="close" />
        </button>
        {!compact && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <img src="/6SIGDashboardLogo.png" alt="" style={{ height: 20, width: "auto" }} />
            <span style={{ fontFamily: DISP, fontWeight: 700, fontSize: 14, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>6 SIGNAL</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
        {groups.map((g) => (
          <div key={g.label} style={{ marginBottom: 10 }}>
            {!compact && <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: S.sub, padding: "8px 10px 6px" }}>{g.label}</div>}
            {compact && <div style={{ height: 1, background: S.border, margin: "8px 6px" }} />}
            {g.items.map((it) => {
              const on = it.id === active;
              return (
                <button key={it.id} onClick={() => pick(it.id)} title={compact ? it.label : undefined} aria-current={on ? "page" : undefined}
                  className="dash-nav-item"
                  style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%", height: 40,
                    padding: compact ? "0" : "0 10px", justifyContent: compact ? "center" : "flex-start",
                    background: on ? S.active : "transparent", border: "none", borderRadius: 6,
                    color: on ? S.text : alpha(S.text, 78), fontFamily: BODY, fontSize: 14, fontWeight: on ? 600 : 400,
                    position: "relative", textAlign: "left",
                  }}>
                  {on && <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, background: S.accent }} />}
                  <span style={{ color: on ? S.accent : S.sub, display: "flex" }}><Icon name={it.icon} /></span>
                  {!compact && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${S.border}`, padding: 8, flexShrink: 0 }}>
        <button onClick={onToggleTheme} className="dash-nav-item" title={compact ? "Switch theme" : undefined}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", height: 38, padding: compact ? 0 : "0 10px", justifyContent: compact ? "center" : "flex-start", background: "none", border: "none", borderRadius: 6, color: S.sub, fontFamily: BODY, fontSize: 13 }}>
          <Icon name={theme === "dark" ? "sun" : "moon"} />
          {!compact && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
        </button>
        <button onClick={onLogout} className="dash-nav-item" title={compact ? "Log out" : undefined}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", height: 38, padding: compact ? 0 : "0 10px", justifyContent: compact ? "center" : "flex-start", background: "none", border: "none", borderRadius: 6, color: S.sub, fontFamily: BODY, fontSize: 13 }}>
          <Icon name="logout" />
          {!compact && <span>Log out</span>}
        </button>
      </div>
    </nav>
  );

  const width = collapsed ? 68 : 240;

  return (
    <div className="dash-root dash-shell" style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: BODY, display: "flex" }}>
      {/* Desktop sidebar */}
      <aside className="dash-sidebar" style={{ width, flexShrink: 0, position: "sticky", top: 0, height: "100vh", transition: "width 160ms ease", borderRight: `1px solid ${S.border}` }}>
        {nav(collapsed)}
      </aside>

      {/* Phone drawer */}
      {drawer && (
        <div className="dash-drawer" role="dialog" aria-label="Menu" style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex" }}>
          <div style={{ width: "min(280px, 84vw)", height: "100%", boxShadow: "0 0 40px rgba(0,0,0,0.4)" }}>{nav(false)}</div>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.45)" }} onClick={() => setDrawer(false)} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ height: 60, display: "flex", alignItems: "center", gap: 12, padding: "0 24px", borderBottom: `1px solid ${T.border}`, background: T.surface, position: "sticky", top: 0, zIndex: 10 }} className="dash-topbar">
          <button className="dash-menu-btn" aria-label="Open menu" onClick={() => setDrawer(true)}
            style={{ display: "none", background: "none", border: `1px solid ${T.border}`, color: T.text, padding: 7, borderRadius: 6 }}>
            <Icon name="menu" />
          </button>
          <h1 style={{ fontFamily: DISP, fontWeight: 700, fontSize: 18, margin: 0, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</h1>
          {actions}
        </header>
        <main className="dash-main" style={{ padding: 24, width: "100%", maxWidth: 1320, margin: "0 auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
