import { NextRequest } from "next/server";

export const STATE_COOKIE = "6sig_oauth_state";

// The site's public address. On Netlify, req.nextUrl.origin is the deploy's
// own *.netlify.app address, not 6signal.co, so it can't be used for the
// Google redirect (Google refuses any address not registered on the client)
// or for sending the browser back to the dashboard afterwards.
export function siteOrigin(): string {
  const fromRedirect = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (fromRedirect) {
    try { return new URL(fromRedirect).origin; } catch { /* fall through */ }
  }
  return (process.env.DASHBOARD_ORIGIN?.trim() || process.env.URL?.trim() || "https://6signal.co").replace(/\/+$/, "");
}

// The redirect URI must match one listed on the Google OAuth client exactly.
export function redirectUri(_req?: NextRequest): string {
  return process.env.GOOGLE_REDIRECT_URI?.trim() || `${siteOrigin()}/api/dashboard/auth/google/callback`;
}
