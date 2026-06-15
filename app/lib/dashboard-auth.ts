import crypto from "crypto";
import { NextRequest } from "next/server";

// Shared-password gate for the internal /dashboard. Stateless: the cookie holds
// sha256(password); each request recomputes and constant-time compares. The
// password itself is never derivable from the stored hash. Swap for Google
// Workspace OAuth when the client-facing phase lands.

export const DASH_COOKIE = "6sig_dash";

export function dashboardToken(): string | null {
  const pw = process.env.DASHBOARD_PASSWORD?.trim();
  if (!pw) return null;
  return crypto.createHash("sha256").update(pw).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function checkPassword(input: string): boolean {
  const pw = process.env.DASHBOARD_PASSWORD?.trim();
  if (!pw || !input) return false;
  return safeEqual(input, pw);
}

export function isAuthed(req: NextRequest): boolean {
  const token = dashboardToken();
  if (!token) return false; // unset password = locked, not open
  const cookie = req.cookies.get(DASH_COOKIE)?.value;
  if (!cookie) return false;
  return safeEqual(cookie, token);
}
