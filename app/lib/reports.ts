// The three heavy report pipelines (quick scan, battle plan, 90-day execution
// plan), extracted so the Netlify BACKGROUND function can run them: this site's
// proxy cuts every HTTP response at ~60s and kills the route lambda shortly
// after, so multi-minute work cannot live inside a request/response cycle.
// Each runner persists its result via completeAudit; callers poll /api/audit/:id.

import { collectSiteEvidence, evidenceForPrompt } from "./evidence";
import { localLandscape, localForPrompt } from "./places";
import { runWebGroundedJSON, clampScore } from "./aiScan";
import { completeAudit, failAudit, saveSignalScores, saveSiteSnapshot, createPlanTasks, getAudit } from "./db";
import { seedTrackingPrompts } from "./autoOnboard";
import { buildClientState, selectPlaybookTasks } from "./playbook";

const SIGNAL_KEYS = ["geo", "aeo", "leo", "veo", "peo", "ieo"] as const;

export interface ReportParams {
  auditId: string;
  businessId: string | null;
  name: string;
  url: string | null;
  trade: string;
  city: string;
  fromAuditId?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function gather(p: ReportParams): Promise<{ evidence: any; local: any }> {
  const [evidence, local] = await Promise.all([
    p.url ? collectSiteEvidence(p.url).catch(() => null) : Promise.resolve(null),
    localLandscape(p.name, p.trade, p.city).catch(() => null),
  ]);
  if (evidence) {
    void saveSiteSnapshot(p.auditId, {
      url: evidence.url, fetched: evidence.fetched, http_status: evidence.http_status,
      robots_allows_ai: evidence.robots_allows_ai, ai_bots_blocked: evidence.ai_bots_blocked,
      has_schema: evidence.has_schema, schema_types: evidence.schema_types,
      has_local_business: evidence.has_local_business, has_faq_schema: evidence.has_faq_schema,
      sitemap_ok: evidence.sitemap_ok, title: evidence.title, has_meta_description: evidence.has_meta_description,
      h1_count: evidence.h1_count, word_count: evidence.word_count, ieo_score: evidence.ieo_score, checks: evidence.checks,
    });
  }
  return { evidence, local };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSignals(doc: Record<string, unknown>, evidence: any): number {
  const signals = (doc.signals ?? {}) as Record<string, { score?: number; finding?: string; gap?: string }>;
  for (const k of SIGNAL_KEYS) signals[k] = { score: clampScore(signals[k]?.score), finding: signals[k]?.finding ?? "", gap: signals[k]?.gap ?? "" };
  if (evidence && Number.isFinite(evidence.ieo_score)) signals.ieo.score = clampScore(evidence.ieo_score);
  doc.signals = signals;
  const overall = Math.round(SIGNAL_KEYS.reduce((s, k) => s + (signals[k].score as number), 0) / SIGNAL_KEYS.length);
  doc.overall = { score: overall };
  return overall;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function persistSignalScores(auditId: string, doc: Record<string, unknown>, evidence: any): Promise<void> {
  const signals = doc.signals as Record<string, { score: number }>;
  await saveSignalScores(auditId, SIGNAL_KEYS.map((k) => ({ signal: k, score: signals[k].score, evidence: k === "ieo" && evidence ? evidence.checks : undefined })));
}

const SCAN_SYSTEM = `You are a 6Signal AI-visibility analyst running a fast LIVE triage scan. Use the web_search tool for real evidence — do not guess.

Search "best <trade> in <city>", "<business> <city>", and "<business> reviews" to establish whether the business is actually named by AI/search and how it presents. Use the AUTHORITATIVE LOCAL DATA provided for all review/rating claims; never invent numbers.

Score each signal 0-100 grounded in what you found (GEO=named by generative engines; AEO=AI Overviews/snippets; LEO=GBP/reviews/citations; VEO=voice readiness; PEO=real buyer queries; IEO=AI-crawlability — a deterministic IEO checklist is provided, weigh it heavily). Most local contractors score 10-50; above 75 is rare.

Return ONLY valid JSON, no prose or fences:
{
  "business": { "name": "string", "trade": "string", "city": "string", "found": false },
  "ai_answer": "2-3 sentences: realistic AI answer to 'best <trade> in <city>', naming real providers found, stating whether <business> appears",
  "competitors": ["names actually found"],
  "signals": { "geo": {"score":0,"finding":"","gap":""}, "aeo": {"score":0,"finding":"","gap":""}, "leo": {"score":0,"finding":"","gap":""}, "veo": {"score":0,"finding":"","gap":""}, "peo": {"score":0,"finding":"","gap":""}, "ieo": {"score":0,"finding":"","gap":""} },
  "top_opportunity": "one sentence",
  "immediate_win": "one sentence"
}`;

export async function runScanReport(p: ReportParams): Promise<Record<string, unknown>> {
  try {
    const { evidence, local } = await gather(p);
    const user = `Run a fast 6Signal triage scan.

Business: ${p.name}
Trade: ${p.trade}
City: ${p.city}
${p.url ? `Website: ${p.url}` : "Website: (none)"}

${evidence ? evidenceForPrompt(evidence) : "No site crawl available."}

${localForPrompt(local)}

Search the web now, then return the scan JSON.`;
    const scan = await runWebGroundedJSON({ system: SCAN_SYSTEM, user, maxTokens: 4096, maxSearches: 5 });
    const overall = normalizeSignals(scan, evidence);
    await completeAudit({ id: p.auditId, payload: scan, overallScore: overall });
    await persistSignalScores(p.auditId, scan, evidence);
    return { id: p.auditId, ...scan };
  } catch (e) {
    console.error("[reports] scan failed:", e);
    await failAudit(p.auditId);
    throw e;
  }
}

const BATTLE_SYSTEM = `You are a senior 6Signal strategist building an INTERNAL BATTLE PLAN for the operator (Matt Vincent Walker) to walk into a paid strategy call already knowing exactly how to win this account. This is not a customer deliverable — it is your own field intelligence.

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

export async function runBattlePlanReport(p: ReportParams): Promise<Record<string, unknown>> {
  try {
    const { evidence, local } = await gather(p);
    const user = `Build the internal battle plan.

Business: ${p.name}
Trade: ${p.trade}
City / Market: ${p.city}
${p.url ? `Website: ${p.url}` : "Website: (none provided)"}

${evidence ? evidenceForPrompt(evidence) : "No site crawl available."}

${localForPrompt(local)}

Search the web thoroughly, then return the battle plan JSON.`;
    const plan = await runWebGroundedJSON({ system: BATTLE_SYSTEM, user, maxTokens: 8192, maxSearches: 5 });
    const overall = normalizeSignals(plan, evidence);
    plan.kind = "battle_plan";
    await completeAudit({ id: p.auditId, payload: plan, overallScore: overall });
    await persistSignalScores(p.auditId, plan, evidence);
    const trackingSeeded = p.businessId ? await seedTrackingPrompts(p.businessId, { name: p.name, trade: p.trade, city: p.city }) : 0;
    return { id: p.auditId, tracking_seeded: trackingSeeded, ...plan };
  } catch (e) {
    console.error("[reports] battle plan failed:", e);
    await failAudit(p.auditId);
    throw e;
  }
}

const EXEC_SYSTEM = `You are a senior 6Signal strategist writing the ULTIMATE 90-DAY EXECUTION PLAN for a newly signed client. This is the internal operating plan that gets this contractor to the best possible AI-visibility and SEO position by day 90. It must be specific enough to execute tomorrow.

Use the web_search tool to ground the plan in this market's reality (who wins, what content/queries matter, what the business currently lacks). Use the AUTHORITATIVE LOCAL DATA (Google Places) for review/competitor facts — never invent numbers. If a prior battle plan is provided, build directly on its findings.

Phase the work across Days 1-30 (Foundation), 31-60 (Authority), 61-90 (Dominance). Mark each deliverable's owner as "6Signal" or "Client". Set realistic but ambitious day-90 targets per signal (typically +20 to +45 over current).

Return ONLY valid JSON, no prose or fences, exactly this shape (respect array sizes):
{
  "business": { "name": "", "trade": "", "city": "" },
  "north_star": "one sentence: the measurable day-90 outcome",
  "current_overall": 0,
  "target_overall_90d": 0,
  "signal_targets": [ { "signal": "GEO", "current": 0, "target_90d": 0 }, { "signal": "AEO", "current": 0, "target_90d": 0 }, { "signal": "LEO", "current": 0, "target_90d": 0 }, { "signal": "VEO", "current": 0, "target_90d": 0 }, { "signal": "PEO", "current": 0, "target_90d": 0 }, { "signal": "IEO", "current": 0, "target_90d": 0 } ],
  "phases": [
    { "phase": "Days 1-30: Foundation", "focus": "1 sentence", "milestone": "the checkpoint outcome", "deliverables": [ { "task": "", "owner": "6Signal|Client", "detail": "1 sentence", "signal": "GEO|AEO|LEO|VEO|PEO|IEO" } ] },
    { "phase": "Days 31-60: Authority", "focus": "", "milestone": "", "deliverables": [ { "task": "", "owner": "", "detail": "", "signal": "" } ] },
    { "phase": "Days 61-90: Dominance", "focus": "", "milestone": "", "deliverables": [ { "task": "", "owner": "", "detail": "", "signal": "" } ] }
  ],
  "content_plan": [ { "page_title": "", "url_slug": "/slug", "h1": "exact H1", "purpose": "1 sentence", "faqs": ["q1","q2","q3"] } ],
  "schema_plan": [ { "type": "LocalBusiness or subtype", "why": "1 sentence", "required_fields": ["f1","f2","f3","f4"], "example": "short example value" } ],
  "gbp_plan": { "actions": ["3 specific Google Business Profile actions"], "review_script": "a copy-paste SMS/email asking past customers for a Google review, with [Name]/[Business]/[LINK] placeholders, under 4 sentences" },
  "quick_wins": [ { "win": "", "impact": "1 sentence", "effort": "30 min|1 hour|2 hours" } ],
  "measurement": "1-2 sentences: how day-90 results are proven (re-scan + Maps/AI checks)"
}
Limits: each phase deliverables 3-4 items; content_plan exactly 3; schema_plan exactly 2; gbp_plan.actions exactly 3; quick_wins exactly 3.`;

export async function runExecutionPlanReport(p: ReportParams): Promise<Record<string, unknown>> {
  try {
    let prior: unknown = null;
    if (p.fromAuditId && /^[0-9a-f-]{36}$/i.test(p.fromAuditId)) {
      const row = await getAudit(p.fromAuditId);
      if (row?.payload) prior = row.payload;
    }
    const { evidence, local } = await gather(p);
    const user = `Write the 90-day execution plan.

Business: ${p.name}
Trade: ${p.trade}
City / Market: ${p.city}
${p.url ? `Website: ${p.url}` : "Website: (none provided)"}

${evidence ? evidenceForPrompt(evidence) : "No site crawl available."}

${localForPrompt(local)}

${prior ? `PRIOR BATTLE PLAN / SCAN FINDINGS (build on these):\n${JSON.stringify(prior).slice(0, 6000)}` : "No prior plan provided — assess from scratch via search."}

Search the web as needed, then return the execution plan JSON.`;
    const plan = await runWebGroundedJSON({ system: EXEC_SYSTEM, user, maxTokens: 8192, maxSearches: 5 });
    plan.kind = "execution_plan";
    const target = Number(plan.target_overall_90d);
    await completeAudit({ id: p.auditId, payload: plan, overallScore: Number.isFinite(target) ? Math.max(0, Math.min(100, Math.round(target))) : null });
    const trackingSeeded = p.businessId ? await seedTrackingPrompts(p.businessId, { name: p.name, trade: p.trade, city: p.city }) : 0;
    // Tasks are selected deterministically from the versioned playbook against
    // the real current state (site crawl + Google Places) — NOT from the LLM
    // plan text — so regeneration is idempotent and never invents obsolete work.
    const tasksCreated = p.businessId
      ? await createPlanTasks(selectPlaybookTasks(buildClientState(evidence, local), p.businessId, p.auditId))
      : 0;
    return { id: p.auditId, tracking_seeded: trackingSeeded, tasks_created: tasksCreated, ...plan };
  } catch (e) {
    console.error("[reports] execution plan failed:", e);
    await failAudit(p.auditId);
    throw e;
  }
}
