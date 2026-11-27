import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";
import { whoFromRequest, googleConfigured } from "./dashboard-auth";
import { runAs, currentActor } from "./actor";
import { CrmError, logActivity } from "./crm";
import { canApprove, clearException } from "./commandCenter";
import { redirectUri, siteOrigin } from "./googleAuth";
import { GMAIL_SCOPES, RECONNECT_MSG, gmailMailbox, gmailLink, sealToken, openToken, forgetGmailLink } from "./gmail";

// One-time "Connect casey@ Gmail" (owner only). The browser goes to Google
// with the dashboard's existing sign-in client, asking for read + create
// drafts on casey@ only. Google returns to the same callback the dashboard
// sign-in uses (so no new redirect address is needed); a separate state
// cookie tells the two apart. We keep the refresh token, encrypted, and
// refuse any account other than the inbox mailbox.

export const GMAIL_STATE_COOKIE = "6sig_gmail_state";
const COOKIE_PATH = "/api/dashboard/auth/google";
const SVC = "Command Center";

const back = (q: string) => {
  const res = NextResponse.redirect(new URL(`/dashboard?gmail=${q}#settings`, siteOrigin()));
  res.cookies.set(GMAIL_STATE_COOKIE, "", { path: COOKIE_PATH, maxAge: 0 });
  return res;
};

export function startGmailConnect(req: NextRequest): NextResponse {
  const who = whoFromRequest(req);
  if (!who) return NextResponse.redirect(new URL("/dashboard", siteOrigin()));
  if (!canApprove(who.role)) return back("owner_only");
  if (!googleConfigured()) return back("google_not_set_up");
  const state = crypto.randomBytes(24).toString("base64url");
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!.trim());
  u.searchParams.set("redirect_uri", redirectUri(req));
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", ["openid", "email", ...GMAIL_SCOPES].join(" "));
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent select_account");
  u.searchParams.set("login_hint", gmailMailbox());
  const domain = gmailMailbox().split("@")[1];
  if (domain) u.searchParams.set("hd", domain);
  u.searchParams.set("state", state);
  const res = NextResponse.redirect(u.toString());
  res.cookies.set(GMAIL_STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", path: COOKIE_PATH, maxAge: 600 });
  return res;
}

// True when this callback belongs to a Gmail connect (not a dashboard sign-in).
export function isGmailCallback(req: NextRequest): boolean {
  const state = req.nextUrl.searchParams.get("state") ?? "";
  const want = req.cookies.get(GMAIL_STATE_COOKIE)?.value ?? "";
  return !!state && !!want && state.length === want.length && crypto.timingSafeEqual(Buffer.from(state), Buffer.from(want));
}

async function revoke(token: string) {
  try {
    await fetch("https://oauth2.googleapis.com/revoke", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token }) });
  } catch { /* best effort */ }
}

export async function finishGmailConnect(req: NextRequest): Promise<NextResponse> {
  const who = whoFromRequest(req);
  if (!who || !canApprove(who.role)) return back("owner_only");
  const p = req.nextUrl.searchParams;
  const code = p.get("code");
  if (!code) return back(p.get("error") === "access_denied" ? "cancelled" : "failed");
  const mailbox = gmailMailbox();
  let tok: { access_token?: string; refresh_token?: string; id_token?: string; scope?: string; error?: string; error_description?: string };
  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!.trim(), client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(), redirect_uri: redirectUri(req), grant_type: "authorization_code" }),
    });
    tok = await r.json();
    if (!r.ok || typeof tok.id_token !== "string") throw new Error(tok.error_description || tok.error || `token ${r.status}`);
  } catch (e) {
    console.error("[gmail-connect] code exchange failed:", e);
    return back("failed");
  }
  const giveBack = async (q: string) => { await revoke(tok.refresh_token || tok.access_token || ""); return back(q); };
  let email = "";
  try {
    const claims = JSON.parse(Buffer.from(tok.id_token!.split(".")[1], "base64url").toString());
    const issOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
    if (!issOk || claims.aud !== process.env.GOOGLE_CLIENT_ID!.trim() || !claims.email_verified || claims.exp * 1000 < Date.now()) throw new Error("ID token failed checks");
    email = String(claims.email).toLowerCase();
  } catch (e) {
    console.error("[gmail-connect] id token:", e);
    return giveBack("failed");
  }
  // Only the inbox mailbox may be connected; anything else is handed back to Google.
  if (email !== mailbox) {
    await runAs({ role: who.role, name: who.name }, () => logActivity({ entityType: "settings", action: "gmail_refused", summary: `Gmail connect refused: ${email} isn't the inbox mailbox (${mailbox})`, service: SVC })).catch(() => {});
    return giveBack("wrong_account");
  }
  const granted = (tok.scope ?? "").split(/\s+/);
  if (!GMAIL_SCOPES.every((s) => granted.includes(s))) return giveBack("missing_scopes");
  if (!tok.refresh_token) return giveBack("no_refresh_token");

  const s = db();
  if (!s) return giveBack("failed");
  try {
    const old = (await s.from("gmail_tokens").select("refresh_token_enc").eq("mailbox", mailbox).maybeSingle()).data;
    const { error } = await s.from("gmail_tokens").upsert({
      mailbox, refresh_token_enc: sealToken(tok.refresh_token), scopes: GMAIL_SCOPES.join(" "), connected_by: who.name, connected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    // A reconnect replaces the old grant; hand the old one back to Google.
    const prev = old?.refresh_token_enc ? openToken(old.refresh_token_enc) : null;
    if (prev && prev !== tok.refresh_token) await revoke(prev);
    await s.from("connections").update({ status: "connected", last_error: null, note: `Connected ${mailbox}: read and create drafts only.`, updated_at: new Date().toISOString() }).eq("name", "gmail_casey");
  } catch (e) {
    console.error("[gmail-connect] saving token:", e);
    return giveBack("failed");
  }
  forgetGmailLink();
  await runAs({ role: who.role, name: who.name }, () => clearException("connection:gmail_casey", `${mailbox} reconnected`)).catch(() => {});
  await runAs({ role: who.role, name: who.name }, () => logActivity({ entityType: "settings", action: "gmail_connected", summary: `${who.name} connected ${mailbox}'s Gmail to the inbox (read + drafts only)`, service: SVC })).catch(() => {});
  return back("connected");
}

export async function gmailStatus() {
  const s = db();
  const conn = s ? (await s.from("connections").select("status,last_error,last_sync_at").eq("name", "gmail_casey").maybeSingle()).data : null;
  const link = await gmailLink();
  return { mailbox: gmailMailbox(), client_ready: googleConfigured(), connected: !!link, needs_reconnect: !!link && conn?.status === "down" && conn?.last_error === RECONNECT_MSG, connected_at: link?.connected_at ?? null, connected_by: link?.connected_by ?? null, status: conn?.status ?? null, last_error: conn?.last_error ?? null, last_sync_at: conn?.last_sync_at ?? null };
}

export async function disconnectGmail() {
  const who = currentActor();
  if (!who || !canApprove(who.role)) throw new CrmError("Only Matt can disconnect Gmail.", 403);
  const s = db();
  if (!s) throw new CrmError("Database not configured.", 503);
  const mailbox = gmailMailbox();
  const { data } = await s.from("gmail_tokens").select("refresh_token_enc").eq("mailbox", mailbox).maybeSingle();
  const tok = data?.refresh_token_enc ? openToken(data.refresh_token_enc) : null;
  if (tok) await revoke(tok);
  const { error } = await s.from("gmail_tokens").delete().eq("mailbox", mailbox);
  if (error) throw new CrmError(error.message);
  await s.from("connections").update({ status: "not_configured", last_error: null, note: "Connect casey@ with Google in Settings (read + create drafts; never sends).", updated_at: new Date().toISOString() }).eq("name", "gmail_casey");
  forgetGmailLink();
  await clearException("connection:gmail_casey", `${mailbox} disconnected on purpose`).catch(() => {});
  await logActivity({ entityType: "settings", action: "gmail_disconnected", summary: `${who.name} disconnected ${mailbox}'s Gmail from the inbox`, service: SVC });
  return { ok: true };
}
