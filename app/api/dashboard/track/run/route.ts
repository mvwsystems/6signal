import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/dashboard-auth";
import { getBusiness, listTrackedPrompts, saveProbeResults } from "../../../../lib/db";
import { probeAllEngines, analyzePrompt, ENGINES, enginesWithKeys } from "../../../../lib/engines";

export const maxDuration = 300;

// Run a tracking probe for one business: every active prompt × every engine with
// a key, judged by Claude, persisted to probe_results. Bounded so an on-demand
// run fits the function window; the scheduled runner handles the full set.
const MAX_PROMPTS_PER_RUN = 8;

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { businessId?: string } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const businessId = body?.businessId;
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const haveKeys = enginesWithKeys();
  if (haveKeys.length === 0) return NextResponse.json({ error: "No engine API keys configured (OPENAI/PERPLEXITY/GEMINI)." }, { status: 503 });

  const business = await getBusiness(businessId);
  if (!business) return NextResponse.json({ error: "Business not found." }, { status: 404 });

  const allPrompts = await listTrackedPrompts(businessId);
  if (allPrompts.length === 0) return NextResponse.json({ error: "No tracked prompts for this business yet." }, { status: 400 });
  const prompts = allPrompts.slice(0, MAX_PROMPTS_PER_RUN);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 290_000);

  const rows: Array<{ business_id: string; prompt_id: string; engine: string; mentioned: boolean; position: number | null; sentiment: string | null; competitors: unknown; sources: unknown; answer: string | null }> = [];
  const perEngine: Record<string, { answered: number; mentioned: number }> = {};
  for (const e of ENGINES) perEngine[e] = { answered: 0, mentioned: 0 };

  try {
    // Sequential per prompt (engines parallel within) to stay friendly to rate limits.
    for (const p of prompts) {
      const answers = await probeAllEngines(p.prompt, controller.signal);
      const verdicts = await analyzePrompt(business, p.prompt, answers, controller.signal);
      for (const e of ENGINES) {
        const a = answers.find((x) => x.engine === e);
        if (!a || !a.ok) continue; // engine errored or no key
        const v = verdicts[e];
        perEngine[e].answered++;
        if (v.mentioned) perEngine[e].mentioned++;
        rows.push({
          business_id: businessId,
          prompt_id: p.id,
          engine: e,
          mentioned: v.mentioned,
          position: v.position,
          sentiment: v.sentiment,
          competitors: v.competitors,
          sources: a.sources,
          answer: a.text.slice(0, 8000),
        });
      }
    }
  } catch (e) {
    console.error("[dashboard/track/run]", e);
  } finally {
    clearTimeout(timer);
  }

  await saveProbeResults(rows);

  return NextResponse.json({
    ok: true,
    promptsRun: prompts.length,
    promptsTotal: allPrompts.length,
    skipped: Math.max(0, allPrompts.length - prompts.length),
    engines: haveKeys,
    perEngine,
    results: rows.length,
  });
}
