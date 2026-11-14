"use client";
import { useEffect, useState } from "react";
import { T, DISP, BODY } from "./theme";

// ─────────────────────────────────────────────────────────────────────────────
// Command Center shell, built to match the Manus CRM layout: an always-dark
// left menu (flat list, brand-yellow active icon, theme toggle and account
// chip at the bottom), the page title and subtitle at the top of the content
// area, no top bar on desktop. The menu collapses to icons (remembered per
// browser) and becomes a slide-out drawer behind a menu button on phones.
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

// Sidebar palette: always dark, like the Manus CRM (#111 menu, #222 active
// row, brand-yellow active icon), in both themes.
const S = { bg: "#111111", hover: "#1f1f1f", active: "#222222", border: "#222222", text: "#e8eaee", sub: "rgba(232,234,238,0.5)", dim: "rgba(232,234,238,0.7)", accent: "#E6FF00" };
const COLLAPSE_KEY = "6sig_db_nav_collapsed";

export default function Shell<Id extends string>({
  groups, active, onSelect, title, subtitle, actions, theme, onToggleTheme, onLogout, children,
}: {
  groups: NavGroup<Id>[];
  active: Id;
  onSelect: (id: Id) => void;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    try { setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1"); } catch { /* private mode */ }
  }, []);
  useEffect(() => {
    if (!drawer && !userMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setDrawer(false); setUserMenu(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer, userMenu]);

  const toggleCollapsed = () => setCollapsed((c) => {
    try { localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1"); } catch { /* private mode */ }
    return !c;
  });
  const pick = (id: Id) => { onSelect(id); setDrawer(false); };
  const items = groups.flatMap((g) => g.items);

  const nav = (compact: boolean) => (
    <nav aria-label="Command Center" style={{ display: "flex", flexDirection: "column", height: "100%", background: S.bg, color: S.text, fontFamily: BODY }}>
      <div style={{ height: 64, display: "flex", alignItems: "center", gap: 12, padding: compact ? "0 16px" : "0 16px", borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
        <button className="dash-nav-collapse" aria-label={compact ? "Expand menu" : "Collapse menu"} onClick={toggleCollapsed}
          style={{ background: "none", border: "none", color: S.dim, width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="panel" size={16} />
        </button>
        <button className="dash-nav-close" aria-label="Close menu" onClick={() => setDrawer(false)}
          style={{ background: "none", border: "none", color: S.dim, width: 32, height: 32, borderRadius: 8, display: "none", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="close" size={16} />
        </button>
        {!compact && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <span style={{ width: 24, height: 24, borderRadius: 4, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              <img src="/6SIGDashboardLogo.png" alt="" style={{ height: 16, width: "auto" }} />
            </span>
            <span style={{ fontFamily: DISP, fontWeight: 600, fontSize: 15, whiteSpace: "nowrap" }}>6 SIGNAL</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
        {items.map((it) => {
          const on = it.id === active;
          return (
            <button key={it.id} onClick={() => pick(it.id)} title={compact ? it.label : undefined} aria-current={on ? "page" : undefined}
              className="dash-nav-item"
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", height: 40, marginBottom: 2,
                padding: compact ? "0" : "0 10px", justifyContent: compact ? "center" : "flex-start",
                background: on ? S.active : "transparent", border: "none", borderRadius: 6,
                color: on ? S.text : "rgba(232,234,238,0.8)", fontFamily: BODY, fontSize: 15, fontWeight: on ? 500 : 400, textAlign: "left",
              }}>
              <span style={{ color: on ? S.accent : S.dim, display: "flex" }}><Icon name={it.icon} size={16} /></span>
              {!compact && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${S.border}`, padding: 12, flexShrink: 0, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: compact ? "center" : "space-between", padding: compact ? "6px 0" : "6px 8px", marginBottom: 4 }}>
          {!compact && <span style={{ fontSize: 12, fontWeight: 500, color: S.sub }}>{theme === "dark" ? "Dark mode" : "Light mode"}</span>}
          <button onClick={onToggleTheme} className="dash-theme-btn" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", borderRadius: 6, color: S.dim }}>
            <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
          </button>
        </div>
        <button onClick={() => setUserMenu((m) => !m)} className="dash-nav-item" aria-haspopup="menu" aria-expanded={userMenu} title={compact ? "Account" : undefined}
          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: compact ? "8px 0" : 8, justifyContent: compact ? "center" : "flex-start", background: "none", border: "none", borderRadius: 8, color: S.text, textAlign: "left" }}>
          <span style={{ width: 32, height: 32, borderRadius: "50%", background: S.accent, color: "#0b0d02", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>M</span>
          {!compact && (
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "block", fontSize: 12, fontWeight: 500, lineHeight: 1 }}>Matt Walker</span>
              <span style={{ display: "block", fontSize: 12, color: S.sub, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>6 Signal Command Center</span>
            </span>
          )}
        </button>
        {userMenu && (
          <div role="menu" style={{ position: "absolute", bottom: "calc(100% - 4px)", left: 12, right: compact ? "auto" : 12, minWidth: 180, background: "#171717", border: `1px solid ${S.border}`, borderRadius: 8, padding: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 5 }}>
            <button role="menuitem" onClick={() => { setUserMenu(false); onLogout(); }} className="dash-nav-item"
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", height: 34, padding: "0 8px", background: "none", border: "none", borderRadius: 6, color: "#f87171", fontFamily: BODY, fontSize: 13, textAlign: "left" }}>
              <Icon name="logout" size={16} /> Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  );

  const width = collapsed ? 64 : 240;

  return (
    <div className="dash-root dash-shell" style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: BODY, display: "flex" }}>
      {/* Desktop sidebar */}
      <aside className="dash-sidebar" style={{ width, flexShrink: 0, position: "sticky", top: 0, height: "100vh", transition: "width 160ms ease" }}>
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
        {/* Phone top bar (hidden on desktop, like the Manus layout) */}
        <div className="dash-mobilebar" style={{ display: "none", height: 56, alignItems: "center", gap: 12, padding: "0 16px", borderBottom: `1px solid ${T.border}`, background: T.bg, position: "sticky", top: 0, zIndex: 10 }}>
          <button aria-label="Open menu" onClick={() => setDrawer(true)}
            style={{ display: "flex", background: "none", border: "none", color: T.text, padding: 8, borderRadius: 8 }}>
            <Icon name="menu" />
          </button>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
        </div>
        <main className="dash-main" style={{ padding: 24, width: "100%", maxWidth: 1280, margin: "0 auto" }}>
          <div className="dash-fade" style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontFamily: DISP, fontWeight: 700, fontSize: 26, letterSpacing: "-0.01em", margin: 0, lineHeight: 1.2 }}>{title}</h1>
              {subtitle && <p style={{ fontSize: 14, color: T.muted, margin: "4px 0 0" }}>{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
