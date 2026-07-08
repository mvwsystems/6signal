import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAuthed } from "../../../lib/dashboard-auth";
import { collectSiteEvidence, evidenceForPrompt } from "../../../lib/evidence";
import { localLandscape, localForPrompt } from "../../../lib/places";
import { runWebGroundedJSON, streamedJSONResponse, SCAN_MODEL } from "../../../lib/aiScan";
import { upsertBusiness, insertAuditRow, completeAudit, failAudit, getAudit, createPlanTasks, PlanTaskInput } from "../../../lib/db";
import { seedTrackingPrompts } from "../../../lib/autoOnboard";

// "Days 1-30: Foundation" → a due date ~N days out; quick wins get 14 days.
function dueFromPhase(phase: string): string {
  const m = phase.match(/(\d+)\s*[-–]\s*(\d+)/);
  const days = m ? Number(m[2]) : 30;
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tasksFromPlan(plan: any, businessId: string, auditId: string): PlanTaskInput[] {
  const rows: PlanTaskInput[] = [];
  for (const p of plan.phases ?? []) {
    for (const d of p.deliverables ?? []) {
      if (!d?.task) continue;
      rows.push({
        business_id: businessId,
        plan_audit_id: auditId,
        phase: String(p.phase ?? ""),
        task: String(d.task),
        detail: d.detail ? String(d.detail) : null,
        owner: /client/i.test(String(d.owner)) ? "Client" : "6Signal",
        signal: d.signal ? String(d.signal).toUpperCase() : null,
        due_date: dueFromPhase(String(p.phase ?? "")),
      });
    }
  }
  for (const w of plan.quick_wins ?? []) {
    if (!w?.win) continue;
    rows.push({
      business_id: businessId,
      plan_audit_id: auditId,
      phase: "Quick wins",
      task: String(w.win),
      detail: w.impact ? String(w.impact) : null,
      owner: "6Signal",
      signal: null,
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    });
  }
  return rows;
}

export const maxDuration = 300;

const PROMPT_VERSION = "execplan-1.0.0";

const SYSTEM_PROMPT = `You are a senior 6Signal strategist writing the ULTIMATE 90-DAY EXECUTION PLAN for a newly signed client. This is the internal operating plan that gets this contractor to the best possible AI-visibility and SEO position by day 90. It must be specific enough to execute tomorrow.

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

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, string> | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const { name, trade, city, fromAuditId } = body ?? {};
  let { url } = body ?? {};
  if (!name || !trade || !city) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;

  // Heartbeat-streamed — see streamedJSONResponse (Netlify gateway 504s
  // non-streaming responses that take longer than ~2 minutes).
  const finalUrl = url;
  return streamedJSONResponse(async (signal) => {
    // Optional: ground in a prior battle plan / scan.
    let prior: unknown = null;
    if (fromAuditId && /^[0-9a-f-]{36}$/i.test(fromAuditId)) {
      const row = await getAudit(fromAuditId);
      if (row?.payload) prior = row.payload;
    }

    const [evidence, local] = await Promise.all([
      finalUrl ? collectSiteEvidence(finalUrl).catch(() => null) : Promise.resolve(null),
      localLandscape(name, trade, city).catch(() => null),
    ]);

    const auditId = randomUUID();
    const businessId = await upsertBusiness({ name, url: finalUrl ?? null, trade, city });
    await insertAuditRow({ id: auditId, businessId, intakeId: null, tier: "strategy_97", model: SCAN_MODEL, promptVersion: PROMPT_VERSION });

    const user = `Write the 90-day execution plan.

Business: ${name}
Trade: ${trade}
City / Market: ${city}
${finalUrl ? `Website: ${finalUrl}` : "Website: (none provided)"}

${evidence ? evidenceForPrompt(evidence) : "No site crawl available."}

${localForPrompt(local)}

${prior ? `PRIOR BATTLE PLAN / SCAN FINDINGS (build on these):\n${JSON.stringify(prior).slice(0, 6000)}` : "No prior plan provided — assess from scratch via search."}

Search the web as needed, then return the execution plan JSON.`;

    let plan: Record<string, unknown>;
    try {
      plan = await runWebGroundedJSON({ system: SYSTEM_PROMPT, user, maxTokens: 8192, maxSearches: 6, signal });
    } catch (e) {
      await failAudit(auditId);
      throw new Error("Execution plan failed or timed out — try again.");
    }

    plan.kind = "execution_plan";
    const target = Number(plan.target_overall_90d);
    await completeAudit({ id: auditId, payload: plan, overallScore: Number.isFinite(target) ? Math.max(0, Math.min(100, Math.round(target))) : null });

    // Auto-onboard into continuous tracking — a signed client's 90-day story
    // needs a baseline from day one.
    const trackingSeeded = businessId ? await seedTrackingPrompts(businessId, { name, trade, city }) : 0;

    // The plan becomes a live work queue: every deliverable → a plan_task with
    // owner + due date, which the Monday briefing works through.
    const tasksCreated = businessId ? await createPlanTasks(tasksFromPlan(plan, businessId, auditId)) : 0;

    return { id: auditId, tracking_seeded: trackingSeeded, tasks_created: tasksCreated, ...plan };
  });
}
