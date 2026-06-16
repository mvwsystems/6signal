import { NextRequest, NextResponse } from "next/server";
import { listAllActiveTracked, saveProbeResults } from "../../../../lib/db";
import { probeAllEngines, analyzePrompt, ENGINES, enginesWithKeys } from "../../../../lib/engines";

export const maxDuration = 300;

// Scheduled probe runner. Authorized by CRON_SECRET (not the dashboard cookie)
// so the Netlify scheduled function can call it. Bounded per invocation; at
// higher client counts, raise cadence or chunk by business.
const MAX_PROMPTS_PER_TICK = 30;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (enginesWithKeys().length === 0) return NextResponse.json({ error: "No engine keys" }, { status: 503 });

  const all = await listAllActiveTracked();
  const slice = all.slice(0, MAX_PROMPTS_PER_TICK);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 290_000);
  const rows: Array<{ business_id: string; prompt_id: string; engine: string; mentioned: boolean; position: number | null; sentiment: string | null; competitors: unknown; sources: unknown; answer: string | null }> = [];
  let processed = 0;

  try {
    for (const p of slice) {
      if (!p.business) continue;
      const answers = await probeAllEngines(p.prompt, controller.signal);
      const verdicts = await analyzePrompt(p.business, p.prompt, answers, controller.signal);
      for (const e of ENGINES) {
        const a = answers.find((x) => x.engine === e);
        if (!a || !a.ok) continue;
        const v = verdicts[e];
        rows.push({ business_id: p.business_id, prompt_id: p.id, engine: e, mentioned: v.mentioned, position: v.position, sentiment: v.sentiment, competitors: v.competitors, sources: a.sources, answer: a.text.slice(0, 8000) });
      }
      processed++;
    }
  } catch (e) {
    console.error("[track/cron]", e);
  } finally {
    clearTimeout(timer);
  }

  await saveProbeResults(rows);
  return NextResponse.json({ ok: true, processed, total: all.length, results: rows.length });
}
