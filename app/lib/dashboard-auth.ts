import crypto from "crypto";
import { NextRequest } from "next/server";
import { decodeSession } from "./session";

// Command Center access (spec §3, Phase 0):
//   owner    → Google sign-in as one of OWNER_EMAILS (default hello@6signal.co,
//              mvw@mattvincentwalker.com). Sees and approves everything.
//   operator → Google sign-in as one of OPERATOR_EMAILS (default
//              casey@6signal.co), or a server-side OPERATOR_API_TOKEN sent as
//              "Authorization: Bearer <token>" for Casey's automation.
//   break-glass → the old DASHBOARD_PASSWORD, owner only. Every use is logged
//              and raises an alarm (see /api/dashboard/auth).
// The session is a signed cookie (session.ts). The old password-hash cookie
// is no longer accepted, so everyone signs in again once after this ships.

export const DASH_COOKIE = "6sig_session";
export const OLD_COOKIE = "6sig_dash";

export type Role = "owner" | "operator";

export interface Who { role: Role; name: string; email: string | null; method: "google" | "break_glass" | "api_token" }

const list = (v: string | undefined, dflt: string) =>
  (v?.trim() || dflt).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
export const ownerEmails = () => list(process.env.OWNER_EMAILS, "hello@6signal.co,mvw@mattvincentwalker.com");
export const operatorEmails = () => list(process.env.OPERATOR_EMAILS, "casey@6signal.co");

export function roleForEmail(email: string): Role | null {
  const e = email.trim().toLowerCase();
  if (ownerEmails().includes(e)) return "owner";
  if (operatorEmails().includes(e)) return "operator";
  return null;
}

export function actorName(role: Role, method?: Who["method"]): string {
  const base = role === "owner"
    ? process.env.DASHBOARD_OWNER_NAME?.trim() || "Matt"
    : process.env.OPERATOR_NAME?.trim() || "Casey";
  return method === "api_token" ? `${base} (automation)` : base;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function breakGlassConfigured(): boolean {
  return !!process.env.DASHBOARD_PASSWORD?.trim();
}

export function checkBreakGlass(input: string): boolean {
  const pw = process.env.DASHBOARD_PASSWORD?.trim();
  return !!pw && !!input && safeEqual(input, pw);
}

export function googleConfigured(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID?.trim() && !!process.env.GOOGLE_CLIENT_SECRET?.trim();
}

export function whoFromRequest(req: NextRequest): Who | null {
  const auth = req.headers.get("authorization");
  const apiToken = process.env.OPERATOR_API_TOKEN?.trim();
  if (auth?.startsWith("Bearer ") && apiToken && apiToken.length >= 24) {
    if (safeEqual(auth.slice(7).trim(), apiToken)) return { role: "operator", name: actorName("operator", "api_token"), email: null, method: "api_token" };
    return null;
  }
  const s = decodeSession(req.cookies.get(DASH_COOKIE)?.value);
  if (!s) return null;
  // A Google session is re-checked against the current email lists, so taking
  // someone off OWNER_EMAILS/OPERATOR_EMAILS locks them out at once.
  if (s.method === "google" && roleForEmail(s.email) !== s.role) return null;
  if (s.method === "break_glass" && (!breakGlassConfigured() || s.role !== "owner")) return null;
  return { role: s.role, name: actorName(s.role), email: s.email, method: s.method };
}

export function sessionRole(req: NextRequest): Role | null {
  return whoFromRequest(req)?.role ?? null;
}

export function isAuthed(req: NextRequest): boolean {
  return whoFromRequest(req) !== null; // nothing configured = locked, not open
}
