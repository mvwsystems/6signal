import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { roleForEmail, actorName, googleConfigured, DASH_COOKIE, OLD_COOKIE } from "../../../../../lib/dashboard-auth";
import { encodeSession } from "../../../../../lib/session";
import { runAs } from "../../../../../lib/actor";
import { logActivity } from "../../../../../lib/crm";
import { STATE_COOKIE, redirectUri, siteOrigin } from "../../../../../lib/googleAuth";
import { isGmailCallback, finishGmailConnect } from "../../../../../lib/gmailConnect";

export const dynamic = "force-dynamic";

// Google sends the browser back here with ?code&state. We check the state,
// trade the code for an ID token directly with Google (server to server, so
// the token's origin is Google itself), and map the verified email to a role.
export async function GET(req: NextRequest) {
  // The one-time "Connect casey@ Gmail" flow comes back to this same address;
  // its own state cookie marks it.
  if (isGmailCallback(req)) return finishGmailConnect(req);
  const home = (q: string) => {
    const res = NextResponse.redirect(new URL(`/dashboard${q}`, siteOrigin()));
    res.cookies.set(STATE_COOKIE, "", { path: "/api/dashboard/auth/google", maxAge: 0 });
    return res;
  };
  if (!googleConfigured()) return home("?login_error=google_not_set_up");
  const p = req.nextUrl.searchParams;
  const state = p.get("state") ?? "";
  const want = req.cookies.get(STATE_COOKIE)?.value ?? "";
  if (!state || !want || state.length !== want.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(want))) return home("?login_error=expired");
  const code = p.get("code");
  if (!code) return home(p.get("error") === "access_denied" ? "?login_error=cancelled" : "?login_error=failed");

  let email = "";
  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: process.env.GOOGLE_CLIENT_ID!.trim(), client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
        redirect_uri: redirectUri(req), grant_type: "authorization_code",
      }),
    });
    const tok = await r.json();
    if (!r.ok || typeof tok.id_token !== "string") throw new Error(tok.error_description || tok.error || `token ${r.status}`);
    const claims = JSON.parse(Buffer.from(tok.id_token.split(".")[1], "base64url").toString());
    const issOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
    if (!issOk || claims.aud !== process.env.GOOGLE_CLIENT_ID!.trim() || !claims.email_verified || claims.exp * 1000 < Date.now()) throw new Error("ID token failed checks");
    email = String(claims.email).toLowerCase();
  } catch (e) {
    console.error("[auth] google sign-in failed:", e);
    return home("?login_error=failed");
  }

  const role = roleForEmail(email);
  if (!role) {
    await runAs({ role: "operator", name: "system" }, () =>
      logActivity({ entityType: "session", action: "sign_in_refused", summary: `Refused Google sign-in for ${email} (not on the owner or operator list)` })).catch(() => {});
    return home("?login_error=not_allowed");
  }
  const days = 14;
  const token = encodeSession({ email, role, method: "google" }, days * 86400);
  if (!token) return home("?login_error=failed");
  await runAs({ role, name: actorName(role) }, () =>
    logActivity({ entityType: "session", action: "signed_in", summary: `${actorName(role)} signed in with Google (${email})` })).catch(() => {});
  const res = home("#today");
  res.cookies.set(DASH_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: days * 86400 });
  res.cookies.set(OLD_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
