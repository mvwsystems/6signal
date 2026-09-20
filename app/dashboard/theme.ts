"use client";
import { useCallback, useEffect, useState } from "react";

// One theme for the whole dashboard. Every color is a CSS custom property
// scoped to .dash-root (defined in globals.css), so the ~360 inline-style
// usages across page.tsx and ProposalsTab.tsx stay exactly as written and the
// light/dark switch is a single attribute flip on <html>. Dark is the default
// and the brand; light is for the operator's eyes in daylight.

export const T = {
  bg: "var(--db-bg)",
  surface: "var(--db-surface)",
  panel: "var(--db-panel)",
  panel2: "var(--db-panel2)",
  border: "var(--db-border)",
  borderH: "var(--db-border-h)",
  accent: "var(--db-accent)",
  text: "var(--db-text)",
  textSub: "var(--db-text-sub)",
  muted: "var(--db-muted)",
  danger: "var(--db-danger)",
  warn: "var(--db-warn)",
  ok: "var(--db-ok)",
};

// Replaces the old `${T.danger}66` hex-alpha string math, which can't work
// on a var(). color-mix resolves the variable first, then applies the alpha.
export const alpha = (color: string, pct: number): string =>
  `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export const MONO = "'JetBrains Mono', ui-monospace, monospace";
export const DISP = "'Chakra Petch', sans-serif";
export const BODY = "'Inter', sans-serif";

export type DbTheme = "dark" | "light";
export const DB_THEME_KEY = "6sig_db_theme";

export function readDbTheme(): DbTheme {
  try {
    return localStorage.getItem(DB_THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyDbTheme(t: DbTheme): void {
  document.documentElement.setAttribute("data-db-theme", t);
}

// The layout's inline script sets the attribute before first paint; this hook
// only syncs React state to it and handles the toggle.
export function useDbTheme(): [DbTheme, () => void] {
  const [theme, setTheme] = useState<DbTheme>("dark");
  useEffect(() => {
    const t = readDbTheme();
    setTheme(t);
    applyDbTheme(t);
  }, []);
  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: DbTheme = prev === "dark" ? "light" : "dark";
      applyDbTheme(next);
      try {
        localStorage.setItem(DB_THEME_KEY, next);
      } catch {
        /* private mode — theme still applies for this session */
      }
      return next;
    });
  }, []);
  return [theme, toggle];
}
