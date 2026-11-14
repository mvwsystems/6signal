import crypto from "crypto";

// Signed session cookie for the dashboard: base64url(JSON) + "." + HMAC.
// Holds who signed in (email), their role, how (google | break_glass) and
// when it expires. Nothing secret is stored in it; the HMAC stops tampering.

export interface SessionData {
  email: string;
  role: "owner" | "operator";
  method: "google" | "break_glass";
  exp: number; // unix seconds
}

function secret(): string | null {
  const s = process.env.SESSION_SECRET?.trim();
  if (s) return s;
  // Fallback so a missing env var can't lock everyone out: derive a key from
  // server-only secrets. Setting SESSION_SECRET is still recommended.
  const pw = process.env.DASHBOARD_PASSWORD?.trim();
  const sk = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!pw && !sk) return null;
  return crypto.createHash("sha256").update(`6sig-session:${pw ?? ""}:${sk ?? ""}`).digest("hex");
}

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sign = (body: string, key: string) => crypto.createHmac("sha256", key).update(body).digest("base64url");

export function encodeSession(d: Omit<SessionData, "exp">, maxAgeSec: number): string | null {
  const key = secret();
  if (!key) return null;
  const body = b64(JSON.stringify({ ...d, exp: Math.floor(Date.now() / 1000) + maxAgeSec }));
  return `${body}.${sign(body, key)}`;
}

export function decodeSession(token: string | undefined): SessionData | null {
  const key = secret();
  if (!key || !token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const want = Buffer.from(sign(body, key));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  try {
    const d = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionData;
    if (!d.exp || d.exp < Date.now() / 1000) return null;
    if (d.role !== "owner" && d.role !== "operator") return null;
    return d;
  } catch {
    return null;
  }
}
