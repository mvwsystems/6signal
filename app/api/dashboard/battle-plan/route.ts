import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAuthed } from "../../../lib/dashboard-auth";
import { collectSiteEvidence, evidenceForPrompt } from "../../../lib/evidence";
import { localLandscape, localForPrompt } from "../../../lib/places";
import { runWebGroundedJSON, clampScore, SCAN_MODEL } from "../../../lib/aiScan";
import { upsertBusiness, insertAuditRow, completeAudit, failAudit, saveSignalScores, saveSiteSnapshot } from "../../../lib/db";
import { seedTrackingPrompts } from "../../../lib/autoOnboard";

export const maxDuration = 300;

const PROMPT_VERSION = "battleplan-1.0.0";
const SIGNAL_KEYS = ["geo", "aeo", "leo", "veo", "peo", "ieo"] as const;

const SYSTEM_PROMPT = `You are a senior 6Signal strategist building an INTERNAL BATTLE PLAN for the operator (Matt Vincent Walker) to walk into a paid strategy call already knowing exactly how to win this account. This is not a customer deliverable — it is your own field intelligence.

Use the web_search tool aggressively to gather REAL evidence before writing: what AI assistants surface for "best <trade> in <city>", whether THIS business is named, who IS winning and why, the business's actual review/presence footprint, and content the market rewards. Use the AUTHORITATIVE LOCAL DATA (Google Places) provided for every review/rating/competitor claim — never invent numbers. Use the deterministic IEO checklist for IEO.

Be specific, honest, and tactical. Most local contractors score 10-50; above 75 is rare. Every sentence must be specific to THIS business, trade, and city.

Return ONLY valid JSON, no prose or fences, exactly this shape (respect array sizes):
{
  "business": { "name": "", "trade": "", "city": "", "found": false, "ai_status": "AI-INVISIBLE|WEAK|PARTIAL|COMPETITIVE|DOMINANT", "risk": "CRITICAL|HIGH|MODERATE|STRONG" },
  "headline": "one-sentence verdict naming the business and the core problem",
  "ai_answer": "2-3 sentences: what AI returns for 'best <trade> in <city>', naming real providers, stating whether the business appears",
  "overall": { "score": 0 },
  "signals": { "geo": {"score":0,"finding":"1 sentence","gap":"1 sentence"}, "aeo": {"score":0,"finding":"","gap":""}, "leo": {"score":0,"finding":"","gap":""}, "veo": {"score":0,"finding":"","gap":""}, "peo": {"score":0,"finding":"","gap":""}, "ieo": {"score":0,"finding":"","gap":""} },
  "local_audit": { "rating": "from Places or unknown", "reviews": "from Places or unknown", "gbp_finding": "1-2 sentences grounded in Places data", "review_velocity_gap": "1 sentence vs top competitors" },
  "competitor_teardown": [ { "name": "real competitor", "why_winning": "1 sentence", "what_they_have": "specific assets/signals they have that this business lacks", "threat": "HIGH|MEDIUM" } ],
  "buyer_journey": { "persona": "1-2 sentences on the primary buyer", "stages": [ { "stage": 1, "label": "Problem Awareness", "buyer_question": "", "who_answers_now": "", "is_business_present": false, "gap": "" }, { "stage": 2, "label": "Provider Research", "buyer_question": "", "who_answers_now": "", "is_business_present": false, "gap": "" }, { "stage": 3, "label": "Trust Verification", "buyer_question": "", "who_answers_now": "", "is_business_present": false, "gap": "" }, { "stage": 4, "label": "Decision & Contact", "buyer_question": "", "who_answers_now": "", "is_business_present": false, "gap": "" } ] },
  "content_gaps": [ { "content_type": "", "why_it_matters": "", "priority": "HIGH|MEDIUM" } ],
  "priority_roadmap": [ { "rank": 1, "timeframe": "Week 1-2", "action": "", "expected_impact": "", "effort": "LOW|MEDIUM|HIGH" } ],
  "pitch_angles": [ "3 sharp, specific talking points to use IN the strategy call to close this account" ],
  "cost_of_inaction": "one sentence with a concrete lead/revenue framing"
}
Limits: competitor_teardown <=3, content_gaps <=5, priority_roadmap exactly 5, pitch_angles exactly 3.`;

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, string> | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const { name, trade, city } = body ?? {};
  let { url } = body ?? {};
  if (!name || !trade || !city) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;

  const [evidence, local] = await Promise.all([
    url ? collectSiteEvidence(url).catch(() => null) : Promise.resolve(null),
    localLandscape(name, trade, city).catch(() => null),
  ]);

  const auditId = randomUUID();
  const businessId = await upsertBusiness({ name, url: url ?? null, trade, city });
  await insertAuditRow({ id: auditId, businessId, intakeId: null, tier: "brief_27", model: SCAN_MODEL, promptVersion: PROMPT_VERSION });
  if (evidence) {
    void saveSiteSnapshot(auditId, {
      url: evidence.url, fetched: evidence.fetched, http_status: evidence.http_status,
      robots_allows_ai: evidence.robots_allows_ai, ai_bots_blocked: evidence.ai_bots_blocked,
      has_schema: evidence.has_schema, schema_types: evidence.schema_types,
      has_local_business: evidence.has_local_business, has_faq_schema: evidence.has_faq_schema,
      sitemap_ok: evidence.sitemap_ok, title: evidence.title, has_meta_description: evidence.has_meta_description,
      h1_count: evidence.h1_count, word_count: evidence.word_count, ieo_score: evidence.ieo_score, checks: evidence.checks,
    });
  }

  const user = `Build the internal battle plan.

Business: ${name}
Trade: ${trade}
City / Market: ${city}
${url ? `Website: ${url}` : "Website: (none provided)"}

${evidence ? evidenceForPrompt(evidence) : "No site crawl available."}

${localForPrompt(local)}

Search the web thoroughly, then return the battle plan JSON.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 290_000);
  let plan: Record<string, unknown>;
  try {
    plan = await runWebGroundedJSON({ system: SYSTEM_PROMPT, user, maxTokens: 8192, maxSearches: 8, signal: controller.signal });
  } catch (e) {
    console.error("[dashboard/battle-plan]", e);
    await failAudit(auditId);
    return NextResponse.json({ error: "Battle plan failed or timed out." }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }

  const signals = (plan.signals ?? {}) as Record<string, { score?: number; finding?: string; gap?: string }>;
  for (const k of SIGNAL_KEYS) signals[k] = { score: clampScore(signals[k]?.score), finding: signals[k]?.finding ?? "", gap: signals[k]?.gap ?? "" };
  if (evidence && Number.isFinite(evidence.ieo_score)) signals.ieo.score = clampScore(evidence.ieo_score);
  plan.signals = signals;
  const overall = Math.round(SIGNAL_KEYS.reduce((s, k) => s + (signals[k].score as number), 0) / SIGNAL_KEYS.length);
  plan.overall = { score: overall };
  plan.kind = "battle_plan";

  await completeAudit({ id: auditId, payload: plan, overallScore: overall });
  await saveSignalScores(auditId, SIGNAL_KEYS.map((k) => ({ signal: k, score: signals[k].score as number, evidence: k === "ieo" && evidence ? evidence.checks : undefined })));

  // Auto-onboard into continuous tracking: seed evidence-based prompts so the
  // weekly cron starts building this business's baseline immediately.
  const trackingSeeded = businessId ? await seedTrackingPrompts(businessId, { name, trade, city }) : 0;

  return NextResponse.json({ id: auditId, tracking_seeded: trackingSeeded, ...plan });
}
