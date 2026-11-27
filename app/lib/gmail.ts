import crypto from "crypto";
import type { GmailMessage } from "./inboxCore";
import { db } from "./db";
import { serverSecret } from "./session";

// Gmail access for one Workspace mailbox (casey@6signal.co by default).
// casey@ connects once with Google (Settings → Sending engine → Connect),
// which gives the dashboard a refresh token for two scopes only: read mail,
// and create drafts. There is no send scope, so nothing here can send an
// email even by mistake.
//
// The refresh token is encrypted (AES-256-GCM) before it is stored in the
// gmail_tokens table, which only the server's service role can read. It is
// never sent to the browser. Access tokens are minted from it as needed and
// kept in memory only.
//
// Config (Netlify env):
//   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET  the dashboard's existing Google sign-in client
//   GMAIL_MAILBOX                            the mailbox to read (default casey@6signal.co)
//   GMAIL_TOKEN_KEY                          optional; encryption key for the stored token
//                                            (defaults to the session secret)

export const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.compose"];
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

export const gmailMailbox = () => (process.env.GMAIL_MAILBOX?.trim() || "casey@6signal.co").toLowerCase();

// ── Token encryption ────────────────────────────────────────────────────────
function tokenKey(): Buffer | null {
  const k = process.env.GMAIL_TOKEN_KEY?.trim() || serverSecret();
  return k ? crypto.createHash("sha256").update(`6sig-gmail-token:${k}`).digest() : null;
}
export function sealToken(plain: string): string {
  const key = tokenKey();
  if (!key) throw new Error("No server secret to encrypt the Gmail token with (set SESSION_SECRET).");
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}
export function openToken(sealed: string): string | null {
  const key = tokenKey();
  const [v, iv, tag, ct] = sealed.split(".");
  if (!key || v !== "v1" || !iv || !tag || !ct) return null;
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
  } catch { return null; }
}

// ── The stored connection ───────────────────────────────────────────────────
export interface GmailLink { mailbox: string; scopes: string; connected_by: string | null; connected_at: string; refresh_token_enc: string }
let linkCache: { at: number; link: GmailLink | null } | null = null;
export function forgetGmailLink() { linkCache = null; cached = null; }

async function readLink(): Promise<GmailLink | null> {
  if (linkCache && Date.now() - linkCache.at < 30_000) return linkCache.link;
  const s = db();
  if (!s) return null;
  const { data, error } = await s.from("gmail_tokens").select("mailbox,scopes,connected_by,connected_at,refresh_token_enc").eq("mailbox", gmailMailbox()).maybeSingle();
  if (error) { console.error("[gmail] reading gmail_tokens:", error.message); return null; }
  linkCache = { at: Date.now(), link: (data as GmailLink) ?? null };
  return linkCache.link;
}

// Public view of the connection; never includes the token.
export async function gmailLink(): Promise<{ mailbox: string; connected_by: string | null; connected_at: string } | null> {
  const l = await readLink();
  return l ? { mailbox: l.mailbox, connected_by: l.connected_by, connected_at: l.connected_at } : null;
}
export const gmailConfigured = async () => !!(await readLink());

let cached: { token: string; exp: number } | null = null;
async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const link = await readLink();
  if (!link) throw new Error("Gmail isn't connected. Connect casey@ in Settings.");
  const refresh = openToken(link.refresh_token_enc);
  if (!refresh) throw new Error("The saved Gmail connection can't be read (the server secret changed). Connect casey@ again in Settings.");
  const id = process.env.GOOGLE_CLIENT_ID?.trim(), secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new Error("Google sign-in isn't set up (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh, client_id: id, client_secret: secret }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.access_token) {
    const why = j.error === "invalid_grant" ? "Google access was removed or has expired. Connect casey@ again in Settings" : j.error_description || j.error || `HTTP ${res.status}`;
    throw new Error(`Gmail sign-in failed: ${why}.`);
  }
  cached = { token: j.access_token, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 };
  return cached.token;
}

async function gmail<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`Gmail ${path.split("?")[0]}: HTTP ${res.status} ${text.slice(0, 200)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

// Message ids matching a Gmail search (e.g. "after:1731800000 -in:chats").
export async function searchMessages(q: string, max = 200): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const r = await gmail<{ messages?: { id: string }[]; nextPageToken?: string }>(`/messages?q=${encodeURIComponent(q)}&maxResults=100${pageToken ? `&pageToken=${pageToken}` : ""}`);
    ids.push(...(r.messages ?? []).map((m) => m.id));
    pageToken = r.nextPageToken;
  } while (pageToken && ids.length < max);
  return ids.slice(0, max);
}

export const getMessage = (id: string) => gmail<GmailMessage>(`/messages/${id}?format=full`);

export async function createDraft(threadId: string, rawMime: string): Promise<string> {
  const r = await gmail<{ id: string }>("/drafts", { method: "POST", body: JSON.stringify({ message: { threadId, raw: rawMime } }) });
  return r.id;
}

export async function profile(): Promise<{ emailAddress: string; messagesTotal: number }> {
  return gmail("/profile");
}
