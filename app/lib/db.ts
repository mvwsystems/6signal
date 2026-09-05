import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side only. All persistence is best-effort: if Supabase env vars are
// missing or a write fails, the funnel keeps working and we log a warning.
// Never let the database break the product.

let client: SupabaseClient | null | undefined;

export function db(): SupabaseClient | null {
  if (client !== undefined) return client;
  // Trim to defend against trailing whitespace/newlines pasted into env vars,
  // a common cause of an otherwise-valid URL failing createClient's URL parse.
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && key) {
    try {
      client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } catch (e) {
      // A malformed SUPABASE_URL makes createClient throw. Persistence must
      // never break the funnel, so degrade to "off" instead of crashing the
      // request. Expected URL form: https://<ref>.supabase.co
      client = null;
      console.error("[db] createClient failed — persistence disabled. Check SUPABASE_URL format:", e);
    }
  } else {
    client = null;
    console.warn("[db] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — persistence disabled");
  }
  return client;
}

export interface BusinessInput {
  name: string;
  url?: string | null;
  trade: string;
  city: string;
}

const STATE_ABBR: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", florida: "FL", georgia: "GA",
  hawaii: "HI", idaho: "ID", illinois: "IL", indiana: "IN", iowa: "IA",
  kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO",
  montana: "MT", nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", ohio: "OH",
  oklahoma: "OK", oregon: "OR", pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};

// "Red Oak, Texas" / "red oak, tx" → "Red Oak, TX" so spelling variants of the
// same city can't mint duplicate businesses.
function canonicalCity(city: string): string {
  const parts = city.trim().replace(/\s+/g, " ").split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1].toLowerCase().replace(/\./g, "");
    if (STATE_ABBR[last]) parts[parts.length - 1] = STATE_ABBR[last];
    else if (/^[a-z]{2}$/.test(last)) parts[parts.length - 1] = last.toUpperCase();
  }
  return parts.join(", ");
}

// "X-actplumbing.com/about" / "HTTPS://WWW.X-ActPlumbing.com" → "x-actplumbing.com"
function urlDomain(url?: string | null): string | null {
  if (!url) return null;
  const d = url.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "")
    .replace(/\/+$/, "");
  return d || null;
}

export async function upsertBusiness(b: BusinessInput): Promise<string | null> {
  const s = db();
  if (!s) return null;
  try {
    const city = canonicalCity(b.city);
    const domain = urlDomain(b.url);

    // Strongest identity first: same website domain = same business, regardless
    // of how the name or city was typed this time.
    if (domain) {
      const { data: byDomain } = await s
        .from("businesses")
        .select("id")
        .ilike("url", `%${domain}%`)
        .limit(1)
        .maybeSingle();
      if (byDomain?.id) return byDomain.id as string;
    }

    // Fallback: case-insensitive (name,trade,city) match with the city
    // canonicalized — "TX" and "Texas" are the same place.
    const { data: existing } = await s
      .from("businesses")
      .select("id, url")
      .ilike("name", b.name.trim())
      .ilike("trade", b.trade.trim())
      .ilike("city", city)
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      // Heal a missing website: free-check rows are created without one, which
      // leaves url null forever and breaks form autofill.
      if (domain && !existing.url) {
        void s.from("businesses").update({ url: `https://${domain}` }).eq("id", existing.id).then(({ error }) => {
          if (error) console.error("[db] url heal failed:", error);
        });
      }
      return existing.id as string;
    }

    const { data, error } = await s
      .from("businesses")
      .upsert(
        {
          name: b.name.trim(),
          url: domain ? `https://${domain}` : null,
          trade: b.trade.trim(),
          city,
        },
        { onConflict: "name,city,trade" }
      )
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  } catch (e) {
    console.error("[db] upsertBusiness failed:", e);
    return null;
  }
}

export async function insertLead(args: {
  businessId: string | null;
  email: string;
  source: string;
  // Where this person came from on their first visit (app/lib/attribution.ts).
  attribution?: Record<string, unknown> | null;
}): Promise<void> {
  const s = db();
  if (!s) return;
  try {
    const { error } = await s.from("leads").insert({
      business_id: args.businessId,
      email: args.email,
      source: args.source,
      attribution: args.attribution ?? null,
    });
    if (error) throw error;
  } catch (e) {
    console.error("[db] insertLead failed:", e);
  }
}

export async function createIntake(args: {
  businessId: string | null;
  form: Record<string, unknown>;
  attribution?: Record<string, unknown> | null;
}): Promise<string | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s
      .from("intakes")
      .insert({ business_id: args.businessId, form: args.form, attribution: args.attribution ?? null })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  } catch (e) {
    console.error("[db] createIntake failed:", e);
    return null;
  }
}

export async function getIntake(id: string): Promise<Record<string, unknown> | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s
      .from("intakes")
      .select("id, form, status, created_at")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("[db] getIntake failed:", e);
    return null;
  }
}

export async function markIntakePaid(id: string): Promise<void> {
  const s = db();
  if (!s) return;
  try {
    const { error } = await s.from("intakes").update({ status: "paid" }).eq("id", id);
    if (error) throw error;
  } catch (e) {
    console.error("[db] markIntakePaid failed:", e);
  }
}

export async function insertAuditRow(args: {
  id: string;
  businessId: string | null;
  intakeId: string | null;
  tier: "free_check" | "brief_27" | "strategy_97";
  model: string;
  promptVersion: string;
}): Promise<void> {
  const s = db();
  if (!s) return;
  try {
    const { error } = await s.from("audits").insert({
      id: args.id,
      business_id: args.businessId,
      intake_id: args.intakeId,
      tier: args.tier,
      model: args.model,
      prompt_version: args.promptVersion,
      status: "generating",
    });
    if (error) throw error;
  } catch (e) {
    console.error("[db] insertAuditRow failed:", e);
  }
}

export async function completeAudit(args: {
  id: string;
  payload: unknown;
  overallScore: number | null;
}): Promise<void> {
  const s = db();
  if (!s) return;
  try {
    const { error } = await s
      .from("audits")
      .update({ payload: args.payload, overall_score: args.overallScore, status: "complete" })
      .eq("id", args.id);
    if (error) throw error;
  } catch (e) {
    console.error("[db] completeAudit failed:", e);
  }
}

export async function failAudit(id: string): Promise<void> {
  const s = db();
  if (!s) return;
  try {
    await s.from("audits").update({ status: "failed" }).eq("id", id);
  } catch (e) {
    console.error("[db] failAudit failed:", e);
  }
}

// ── Client reports (baseline + monthly) + share links ───────────────────────
export async function saveClientReport(businessId: string, periodLabel: string, payload: unknown): Promise<string | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s.from("client_reports").insert({ business_id: businessId, period_label: periodLabel, payload }).select("id").single();
    if (error) throw error;
    return data.id as string;
  } catch (e) {
    console.error("[db] saveClientReport failed:", e);
    return null;
  }
}

export async function listClientReports(businessId: string): Promise<Record<string, unknown>[]> {
  const s = db();
  if (!s) return [];
  try {
    const { data, error } = await s.from("client_reports").select("id, period_label, created_at").eq("business_id", businessId).order("created_at", { ascending: false }).limit(24);
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.error("[db] listClientReports failed:", e);
    return [];
  }
}

export async function getClientReport(id: string): Promise<Record<string, unknown> | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s.from("client_reports").select("id, business_id, period_label, payload, created_at").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ?? null;
  } catch (e) {
    console.error("[db] getClientReport failed:", e);
    return null;
  }
}

export async function getLatestClientReport(businessId: string): Promise<Record<string, unknown> | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s.from("client_reports").select("id, period_label, payload, created_at").eq("business_id", businessId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data ?? null;
  } catch (e) {
    console.error("[db] getLatestClientReport failed:", e);
    return null;
  }
}

export async function ensureShareToken(businessId: string): Promise<string | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data } = await s.from("businesses").select("share_token").eq("id", businessId).maybeSingle();
    if (data?.share_token) return data.share_token as string;
    const token = Array.from(crypto.getRandomValues(new Uint8Array(18))).map((b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await s.from("businesses").update({ share_token: token }).eq("id", businessId);
    if (error) throw error;
    return token;
  } catch (e) {
    console.error("[db] ensureShareToken failed:", e);
    return null;
  }
}

export async function getBusinessByShareToken(token: string): Promise<{ id: string; name: string; trade: string; city: string } | null> {
  const s = db();
  if (!s || !/^[0-9a-f]{24,64}$/i.test(token)) return null;
  try {
    const { data, error } = await s.from("businesses").select("id, name, trade, city").eq("share_token", token).maybeSingle();
    if (error) throw error;
    return (data as { id: string; name: string; trade: string; city: string } | null) ?? null;
  } catch (e) {
    console.error("[db] getBusinessByShareToken failed:", e);
    return null;
  }
}

export async function setBusinessContactEmail(id: string, email: string): Promise<void> {
  const s = db();
  if (!s) return;
  try {
    await s.from("businesses").update({ contact_email: email }).eq("id", id);
  } catch (e) {
    console.error("[db] setBusinessContactEmail failed:", e);
  }
}

// Completed report history for one business (dashboard "Past reports" list).
export async function listCompletedAudits(businessId: string): Promise<Record<string, unknown>[]> {
  const s = db();
  if (!s) return [];
  try {
    const { data, error } = await s
      .from("audits")
      .select("id, prompt_version, tier, overall_score, created_at")
      .eq("business_id", businessId)
      .eq("status", "complete")
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.error("[db] listCompletedAudits failed:", e);
    return [];
  }
}

// Status regardless of completion — lets pollers distinguish "still working"
// from "failed" from "gone".
export async function getAuditStatus(id: string): Promise<{ id: string; status: string } | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s.from("audits").select("id, status").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as { id: string; status: string } | null) ?? null;
  } catch (e) {
    console.error("[db] getAuditStatus failed:", e);
    return null;
  }
}

export async function getAudit(id: string): Promise<Record<string, unknown> | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s
      .from("audits")
      .select("id, tier, payload, overall_score, status, created_at")
      .eq("id", id)
      .eq("status", "complete")
      .single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("[db] getAudit failed:", e);
    return null;
  }
}

// The buyer's email is captured by Stripe at checkout, not in the intake form.
// It lands in `purchases` (via the webhook), linked by intake_id. Generation
// completes after payment, so by then the purchase row almost always exists;
// if it doesn't yet, we return null and skip the email (no crash, no funnel
// impact). Returns the most recent email seen for this intake.
export async function getEmailForIntake(intakeId: string): Promise<string | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s
      .from("purchases")
      .select("email, created_at")
      .eq("intake_id", intakeId)
      .not("email", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data?.email as string | undefined) ?? null;
  } catch (e) {
    console.error("[db] getEmailForIntake failed:", e);
    return null;
  }
}

export async function saveSignalScores(
  auditId: string,
  scores: Array<{ signal: string; score: number; evidence?: unknown }>
): Promise<void> {
  const s = db();
  if (!s) return;
  try {
    const rows = scores
      .filter((r) => ["geo", "aeo", "leo", "veo", "peo", "ieo"].includes(r.signal) && Number.isFinite(r.score))
      .map((r) => ({ audit_id: auditId, signal: r.signal, score: Math.min(100, Math.max(0, Math.round(r.score))), evidence: r.evidence ?? null }));
    if (!rows.length) return;
    const { error } = await s.from("signal_scores").upsert(rows);
    if (error) throw error;
  } catch (e) {
    console.error("[db] saveSignalScores failed:", e);
  }
}

export async function saveSiteSnapshot(auditId: string, snapshot: Record<string, unknown>): Promise<void> {
  const s = db();
  if (!s) return;
  try {
    const { error } = await s.from("site_snapshots").upsert({ audit_id: auditId, ...snapshot });
    if (error) throw error;
  } catch (e) {
    console.error("[db] saveSiteSnapshot failed:", e);
  }
}

// Everything the internal dashboard needs in one shot. Raw arrays — the client
// stitches latest-audit-per-business, radar, and trend. Volumes are small at
// this stage; revisit with server-side aggregation if the tables grow large.
export async function getDashboardOverview(): Promise<{
  businesses: Record<string, unknown>[];
  audits: Record<string, unknown>[];
  signalScores: Record<string, unknown>[];
  leads: Record<string, unknown>[];
  purchases: Record<string, unknown>[];
} | null> {
  const s = db();
  if (!s) return null;
  try {
    const [biz, audits, scores, leads, purchases] = await Promise.all([
      s.from("businesses").select("id, name, url, trade, city, contact_email, created_at").order("created_at", { ascending: false }),
      s.from("audits").select("id, business_id, tier, overall_score, status, created_at").eq("status", "complete").order("created_at", { ascending: true }),
      s.from("signal_scores").select("audit_id, signal, score"),
      s.from("leads").select("id, business_id, email, source, attribution, created_at").order("created_at", { ascending: false }).limit(200),
      s.from("purchases").select("amount_total, product, email, created_at").order("created_at", { ascending: false }).limit(500),
    ]);
    return {
      businesses: biz.data ?? [],
      audits: audits.data ?? [],
      signalScores: scores.data ?? [],
      leads: leads.data ?? [],
      purchases: purchases.data ?? [],
    };
  } catch (e) {
    console.error("[db] getDashboardOverview failed:", e);
    return null;
  }
}

// ── Continuous tracking ──────────────────────────────────────────────────────
export async function getBusiness(id: string): Promise<{ id: string; name: string; url: string | null; trade: string; city: string; github_repo: string | null; looker_url: string | null } | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s.from("businesses").select("id, name, url, trade, city, github_repo, looker_url").eq("id", id).single();
    if (error) throw error;
    return data as { id: string; name: string; url: string | null; trade: string; city: string; github_repo: string | null; looker_url: string | null };
  } catch (e) {
    console.error("[db] getBusiness failed:", e);
    return null;
  }
}

// Ads reporting is one embedded Looker Studio report per client, stored on the
// business — a single global URL would show every client the same numbers.
export async function setBusinessLookerUrl(id: string, url: string | null): Promise<boolean> {
  const s = db();
  if (!s) return false;
  try {
    const { error } = await s.from("businesses").update({ looker_url: url }).eq("id", id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("[db] setBusinessLookerUrl failed:", e);
    return false;
  }
}

export async function setBusinessGithubRepo(id: string, repo: string | null): Promise<boolean> {
  const s = db();
  if (!s) return false;
  try {
    const { error } = await s.from("businesses").update({ github_repo: repo }).eq("id", id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("[db] setBusinessGithubRepo failed:", e);
    return false;
  }
}

// ── Content engine ────────────────────────────────────────────────────────────

export async function createContentPost(businessId: string, targetPrompt: string | null): Promise<string | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s.from("content_posts")
      .insert({ business_id: businessId, status: "generating", target_prompt: targetPrompt })
      .select("id").single();
    if (error) throw error;
    return (data as { id: string }).id;
  } catch (e) {
    console.error("[db] createContentPost failed:", e);
    return null;
  }
}

export async function updateContentPost(id: string, fields: Record<string, unknown>): Promise<boolean> {
  const s = db();
  if (!s) return false;
  try {
    const { error } = await s.from("content_posts").update(fields).eq("id", id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("[db] updateContentPost failed:", e);
    return false;
  }
}

export async function getContentPost(id: string): Promise<Record<string, unknown> | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s.from("content_posts").select("*").eq("id", id).single();
    if (error) throw error;
    return data as Record<string, unknown>;
  } catch (e) {
    console.error("[db] getContentPost failed:", e);
    return null;
  }
}

export async function listContentPosts(businessId: string): Promise<Record<string, unknown>[]> {
  const s = db();
  if (!s) return [];
  try {
    const { data, error } = await s.from("content_posts")
      .select("id, status, title, slug, meta_description, target_prompt, summary, url, created_at, published_at, error, archived_at")
      .eq("business_id", businessId).order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return (data ?? []) as Record<string, unknown>[];
  } catch (e) {
    console.error("[db] listContentPosts failed:", e);
    return [];
  }
}

export async function listPublishedPosts(businessId: string): Promise<Array<{ slug: string; title: string; summary: string | null; published_at: string }>> {
  const s = db();
  if (!s) return [];
  try {
    const { data, error } = await s.from("content_posts")
      .select("slug, title, summary, published_at")
      .eq("business_id", businessId).eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Array<{ slug: string; title: string; summary: string | null; published_at: string }>;
  } catch (e) {
    console.error("[db] listPublishedPosts failed:", e);
    return [];
  }
}

// ── Maps geo-grid scans ───────────────────────────────────────────────────────

export async function saveMapsGridScan(row: {
  business_id: string; keyword: string; center: Record<string, unknown>;
  grid_size: number; spacing_miles: number; points: unknown; stats: unknown;
}): Promise<string | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s.from("maps_grid_scans").insert(row).select("id").single();
    if (error) throw error;
    return (data as { id: string }).id;
  } catch (e) {
    console.error("[db] saveMapsGridScan failed:", e);
    return null;
  }
}

export async function listMapsGridScans(businessId: string, limit = 12): Promise<Record<string, unknown>[]> {
  const s = db();
  if (!s) return [];
  try {
    const { data, error } = await s.from("maps_grid_scans")
      .select("*").eq("business_id", businessId)
      .order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as Record<string, unknown>[];
  } catch (e) {
    console.error("[db] listMapsGridScans failed:", e);
    return [];
  }
}

export async function getLatestMapsGrid(businessId: string): Promise<Record<string, unknown> | null> {
  const rows = await listMapsGridScans(businessId, 1);
  return rows[0] ?? null;
}

// ── Town-level AI visibility scans ────────────────────────────────────────────

export async function saveTownScan(row: { business_id: string; towns: unknown; stats: unknown }): Promise<string | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s.from("ai_town_scans").insert(row).select("id").single();
    if (error) throw error;
    return (data as { id: string }).id;
  } catch (e) {
    console.error("[db] saveTownScan failed:", e);
    return null;
  }
}

export async function listTownScans(businessId: string, limit = 12): Promise<Record<string, unknown>[]> {
  const s = db();
  if (!s) return [];
  try {
    const { data, error } = await s.from("ai_town_scans")
      .select("*").eq("business_id", businessId)
      .order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []) as Record<string, unknown>[];
  } catch (e) {
    console.error("[db] listTownScans failed:", e);
    return [];
  }
}

export async function getLatestTownScan(businessId: string): Promise<Record<string, unknown> | null> {
  const rows = await listTownScans(businessId, 1);
  return rows[0] ?? null;
}

export async function deleteContentPostDraft(id: string): Promise<boolean> {
  const s = db();
  if (!s) return false;
  try {
    const { error } = await s.from("content_posts").delete().eq("id", id).neq("status", "published");
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("[db] deleteContentPostDraft failed:", e);
    return false;
  }
}

export async function createTrackedPrompts(businessId: string, prompts: string[]): Promise<number> {
  const s = db();
  if (!s) return 0;
  const rows = prompts.map((p) => p.trim()).filter(Boolean).map((prompt) => ({ business_id: businessId, prompt }));
  if (!rows.length) return 0;
  try {
    const { error } = await s.from("tracked_prompts").insert(rows);
    if (error) throw error;
    return rows.length;
  } catch (e) {
    console.error("[db] createTrackedPrompts failed:", e);
    return 0;
  }
}

export async function listTrackedPrompts(businessId: string): Promise<{ id: string; prompt: string; article_dismissed_at?: string | null }[]> {
  const s = db();
  if (!s) return [];
  try {
    const { data, error } = await s.from("tracked_prompts").select("id, prompt, article_dismissed_at").eq("business_id", businessId).eq("active", true).order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.error("[db] listTrackedPrompts failed:", e);
    return [];
  }
}

export async function deactivateTrackedPrompt(id: string): Promise<void> {
  const s = db();
  if (!s) return;
  try {
    await s.from("tracked_prompts").update({ active: false }).eq("id", id);
  } catch (e) {
    console.error("[db] deactivateTrackedPrompt failed:", e);
  }
}

// For the scheduled runner: every active prompt across all businesses, with the
// business context needed to probe + judge.
export async function listAllActiveTracked(): Promise<Array<{ id: string; prompt: string; business_id: string; business: { name: string; trade: string; city: string } | null }>> {
  const s = db();
  if (!s) return [];
  try {
    const { data, error } = await s.from("tracked_prompts").select("id, prompt, business_id, businesses(name, trade, city)").eq("active", true);
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => ({ id: r.id, prompt: r.prompt, business_id: r.business_id, business: r.businesses ?? null }));
  } catch (e) {
    console.error("[db] listAllActiveTracked failed:", e);
    return [];
  }
}

// Latest run_at per prompt over the recent window — lets the cron probe
// least-recently-probed prompts first so a bounded tick rotates fairly.
export async function getLastProbeTimes(): Promise<Record<string, string>> {
  const s = db();
  if (!s) return {};
  try {
    const since = new Date(Date.now() - 60 * 86400000).toISOString();
    const { data, error } = await s
      .from("probe_results")
      .select("prompt_id, run_at")
      .gte("run_at", since)
      .order("run_at", { ascending: false })
      .limit(5000);
    if (error) throw error;
    const out: Record<string, string> = {};
    for (const r of data ?? []) {
      const pid = r.prompt_id as string;
      if (!(pid in out)) out[pid] = r.run_at as string; // first seen = latest
    }
    return out;
  } catch (e) {
    console.error("[db] getLastProbeTimes failed:", e);
    return {};
  }
}

export async function saveProbeResults(rows: Array<{ business_id: string; prompt_id: string; engine: string; mentioned: boolean; position: number | null; sentiment: string | null; competitors: unknown; sources: unknown; answer: string | null }>): Promise<void> {
  const s = db();
  if (!s || !rows.length) return;
  try {
    const { error } = await s.from("probe_results").insert(rows);
    if (error) throw error;
  } catch (e) {
    console.error("[db] saveProbeResults failed:", e);
  }
}

export async function getProbeResults(businessId: string, sinceDays = 90): Promise<Record<string, unknown>[]> {
  const s = db();
  if (!s) return [];
  try {
    const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
    const { data, error } = await s
      .from("probe_results")
      .select("prompt_id, engine, mentioned, position, sentiment, competitors, sources, run_at")
      .eq("business_id", businessId)
      .gte("run_at", since)
      .order("run_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.error("[db] getProbeResults failed:", e);
    return [];
  }
}

// ── Plan tasks (living execution plan) ───────────────────────────────────────
export interface PlanTaskInput {
  business_id: string;
  plan_audit_id: string | null;
  phase: string | null;
  task: string;
  detail: string | null;
  owner: string;
  signal: string | null;
  due_date: string | null; // YYYY-MM-DD
}

// Regenerating a battle plan used to append its whole task list again, so a
// business that had three plans generated carried three copies of the same
// work — and a "0 of 45 done" progress line that overstated what was actually
// outstanding. Skip anything this business already has.
const taskKey = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, "");

export async function createPlanTasks(rows: PlanTaskInput[]): Promise<number> {
  const s = db();
  if (!s || !rows.length) return 0;
  try {
    const businessIds = [...new Set(rows.map((r) => r.business_id).filter(Boolean))] as string[];
    const seen = new Set<string>();
    if (businessIds.length) {
      const { data } = await s.from("plan_tasks").select("business_id, task").in("business_id", businessIds);
      for (const r of (data ?? []) as { business_id: string; task: string }[]) {
        seen.add(`${r.business_id}|${taskKey(r.task)}`);
      }
    }
    const fresh = rows.filter((r) => {
      const k = `${r.business_id}|${taskKey(r.task)}`;
      if (seen.has(k)) return false;
      seen.add(k); // also dedupes within this batch
      return true;
    });
    const skipped = rows.length - fresh.length;
    if (skipped) console.warn(`[db] createPlanTasks: skipped ${skipped} task(s) this business already has`);
    if (!fresh.length) return 0;
    const { error } = await s.from("plan_tasks").insert(fresh);
    if (error) throw error;
    return fresh.length;
  } catch (e) {
    console.error("[db] createPlanTasks failed:", e);
    return 0;
  }
}

export async function listTasks(businessId: string): Promise<Record<string, unknown>[]> {
  const s = db();
  if (!s) return [];
  try {
    const { data, error } = await s
      .from("plan_tasks")
      .select("id, phase, task, detail, owner, signal, status, due_date")
      .eq("business_id", businessId)
      .neq("status", "skipped")
      .order("due_date", { ascending: true });
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.error("[db] listTasks failed:", e);
    return [];
  }
}

export async function updateTaskStatus(id: string, status: "open" | "in_progress" | "done" | "skipped"): Promise<boolean> {
  const s = db();
  if (!s) return false;
  try {
    const { error } = await s
      .from("plan_tasks")
      .update({ status, completed_at: status === "done" ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("[db] updateTaskStatus failed:", e);
    return false;
  }
}

// Every business that has open tasks OR tracked prompts — the briefing roster.
export async function briefingRoster(): Promise<Array<{ id: string; name: string; trade: string; city: string }>> {
  const s = db();
  if (!s) return [];
  try {
    const [tasks, tracked] = await Promise.all([
      s.from("plan_tasks").select("business_id").eq("status", "open"),
      s.from("tracked_prompts").select("business_id").eq("active", true),
    ]);
    const ids = Array.from(new Set([...(tasks.data ?? []), ...(tracked.data ?? [])].map((r) => r.business_id as string)));
    if (!ids.length) return [];
    const { data, error } = await s.from("businesses").select("id, name, trade, city").in("id", ids);
    if (error) throw error;
    return (data ?? []) as Array<{ id: string; name: string; trade: string; city: string }>;
  } catch (e) {
    console.error("[db] briefingRoster failed:", e);
    return [];
  }
}

// ── Proposals (printable quotes) ─────────────────────────────────────────────

export async function createProposal(args: {
  businessId: string | null;
  clientName: string;
  payload: unknown;
}): Promise<string | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s
      .from("proposals")
      .insert({ business_id: args.businessId, client_name: args.clientName, payload: args.payload })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  } catch (e) {
    console.error("[db] createProposal failed:", e);
    return null;
  }
}

export async function listProposals(): Promise<Record<string, unknown>[]> {
  const s = db();
  if (!s) return [];
  try {
    const { data, error } = await s
      .from("proposals")
      .select("id, business_id, client_name, payload, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  } catch (e) {
    console.error("[db] listProposals failed:", e);
    return [];
  }
}

export async function getProposal(id: string): Promise<Record<string, unknown> | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s.from("proposals").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ?? null;
  } catch (e) {
    console.error("[db] getProposal failed:", e);
    return null;
  }
}

export async function updateProposal(id: string, args: { clientName?: string; payload?: unknown }): Promise<boolean> {
  const s = db();
  if (!s) return false;
  try {
    const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (args.clientName !== undefined) fields.client_name = args.clientName;
    if (args.payload !== undefined) fields.payload = args.payload;
    const { error } = await s.from("proposals").update(fields).eq("id", id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("[db] updateProposal failed:", e);
    return false;
  }
}

export async function recordPurchase(args: {
  stripeSessionId: string;
  intakeId: string | null;
  email: string | null;
  amountTotal: number | null;
  currency: string | null;
  product: string;
  raw: unknown;
}): Promise<boolean> {
  const s = db();
  if (!s) return false;
  try {
    const { error } = await s.from("purchases").upsert(
      {
        stripe_session_id: args.stripeSessionId,
        intake_id: args.intakeId,
        email: args.email,
        amount_total: args.amountTotal,
        currency: args.currency,
        product: args.product,
        raw: args.raw,
      },
      { onConflict: "stripe_session_id", ignoreDuplicates: true }
    );
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("[db] recordPurchase failed:", e);
    return false;
  }
}

// Archive/restore a tracked prompt as an ARTICLE TOPIC (does not affect probe
// tracking) — keeps the "Write the next article" list to topics still wanted.
export async function setPromptArticleDismissed(promptId: string, dismissed: boolean): Promise<boolean> {
  const s = db();
  if (!s) return false;
  try {
    const { error } = await s.from("tracked_prompts")
      .update({ article_dismissed_at: dismissed ? new Date().toISOString() : null })
      .eq("id", promptId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("[db] setPromptArticleDismissed failed:", e);
    return false;
  }
}
