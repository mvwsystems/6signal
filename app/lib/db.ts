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

export async function upsertBusiness(b: BusinessInput): Promise<string | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s
      .from("businesses")
      .upsert(
        { name: b.name, url: b.url ?? null, trade: b.trade, city: b.city },
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
}): Promise<void> {
  const s = db();
  if (!s) return;
  try {
    const { error } = await s.from("leads").insert({
      business_id: args.businessId,
      email: args.email,
      source: args.source,
    });
    if (error) throw error;
  } catch (e) {
    console.error("[db] insertLead failed:", e);
  }
}

export async function createIntake(args: {
  businessId: string | null;
  form: Record<string, unknown>;
}): Promise<string | null> {
  const s = db();
  if (!s) return null;
  try {
    const { data, error } = await s
      .from("intakes")
      .insert({ business_id: args.businessId, form: args.form })
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
      s.from("businesses").select("id, name, url, trade, city, created_at").order("created_at", { ascending: false }),
      s.from("audits").select("id, business_id, tier, overall_score, status, created_at").eq("status", "complete").order("created_at", { ascending: true }),
      s.from("signal_scores").select("audit_id, signal, score"),
      s.from("leads").select("id, business_id, email, source, created_at").order("created_at", { ascending: false }).limit(200),
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
