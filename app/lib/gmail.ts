import crypto from "crypto";
import type { GmailMessage } from "./inboxCore";

// Gmail access for one Workspace mailbox (casey@6signal.co by default), through
// a Google service account with domain-wide delegation. Two scopes only:
// read mail, and create drafts. There is no send scope, so nothing here can
// send an email even by mistake.
//
// Config (Netlify env):
//   GMAIL_SERVICE_ACCOUNT_JSON  the service account's JSON key (raw or base64)
//   GMAIL_MAILBOX               the mailbox to read (default casey@6signal.co)

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.compose"];
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

export const gmailMailbox = () => process.env.GMAIL_MAILBOX?.trim() || "casey@6signal.co";

function serviceAccount(): { client_email: string; private_key: string } | null {
  const raw = process.env.GMAIL_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const sa = JSON.parse(json);
    return sa.client_email && sa.private_key ? { client_email: sa.client_email, private_key: sa.private_key } : null;
  } catch { return null; }
}
export const gmailConfigured = () => !!serviceAccount();

let cached: { token: string; exp: number } | null = null;
async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const sa = serviceAccount();
  if (!sa) throw new Error("Gmail isn't connected: GMAIL_SERVICE_ACCOUNT_JSON isn't set.");
  const now = Math.floor(Date.now() / 1000);
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({ iss: sa.client_email, sub: gmailMailbox(), scope: SCOPES.join(" "), aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const sig = crypto.createSign("RSA-SHA256").update(unsigned).sign(sa.private_key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.access_token) {
    const why = j.error === "unauthorized_client" ? "domain-wide delegation isn't set up for these scopes in Google Workspace admin" : j.error_description || j.error || `HTTP ${res.status}`;
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
