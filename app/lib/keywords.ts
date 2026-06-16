// Real search-demand signals for evidence-based prompt suggestions.
//  - Google Autocomplete: free, no key — the actual completions people type.
//  - Google Ads Keyword Planner: real monthly search volume (env-gated; needs
//    Google Ads API access + an OAuth refresh token). Best-effort everywhere.

export async function autocomplete(seed: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&q=${encodeURIComponent(seed)}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!res.ok) return [];
    const data = await res.json(); // ["seed", ["completion", ...]]
    return Array.isArray(data?.[1]) ? data[1].map(String) : [];
  } catch {
    return [];
  }
}

export async function autocompleteMany(seeds: string[]): Promise<string[]> {
  const all = await Promise.all(seeds.map(autocomplete));
  return Array.from(new Set(all.flat().map((s) => s.trim()).filter(Boolean)));
}

// ── Google Ads Keyword Planner volume (best-effort, env-gated) ────────────────
let cachedToken: { token: string; exp: number } | null = null;

async function adsAccessToken(): Promise<string | null> {
  const id = process.env.GOOGLE_ADS_CLIENT_ID;
  const secret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refresh = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (!id || !secret || !refresh) return null;
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: id, client_secret: secret, refresh_token: refresh, grant_type: "refresh_token" }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    cachedToken = { token: d.access_token, exp: Date.now() + (Number(d.expires_in) || 3000) * 1000 };
    return cachedToken.token;
  } catch (e) {
    console.error("[keywords] token refresh failed:", e);
    return null;
  }
}

// Returns { "<query lowercased>": avgMonthlySearches }. Empty if not configured.
export async function keywordVolume(queries: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const dev = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const customer = process.env.GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, "");
  if (!dev || !customer || !queries.length) return out;
  const token = await adsAccessToken();
  if (!token) return out;
  const version = process.env.GOOGLE_ADS_API_VERSION?.trim() || "v18";
  try {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}`, "developer-token": dev, "Content-Type": "application/json" };
    const login = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "");
    if (login) headers["login-customer-id"] = login;
    const res = await fetch(`https://googleads.googleapis.com/${version}/customers/${customer}:generateKeywordIdeas`, {
      method: "POST",
      headers,
      body: JSON.stringify({ keywordSeed: { keywords: queries.slice(0, 20) }, language: "languageConstants/1000" }),
    });
    if (!res.ok) {
      console.error("[keywords] ads", res.status, (await res.text().catch(() => "")).slice(0, 200));
      return out;
    }
    const d = await res.json();
    for (const r of d.results ?? []) {
      const txt = String(r.text ?? "").toLowerCase();
      const vol = Number(r.keywordIdeaMetrics?.avgMonthlySearches);
      if (txt && Number.isFinite(vol)) out[txt] = vol;
    }
    return out;
  } catch (e) {
    console.error("[keywords] ads error:", e);
    return out;
  }
}

// Loose match a query phrase to the closest volume entry.
export function volumeFor(basis: string, vol: Record<string, number>): number | null {
  if (!basis) return null;
  const b = basis.toLowerCase();
  if (vol[b] != null) return vol[b];
  for (const [k, v] of Object.entries(vol)) if (k && (b.includes(k) || k.includes(b))) return v;
  return null;
}
