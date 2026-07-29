// Probe sweeps (on-demand and scheduled) — run inside the BACKGROUND worker,
// never in a request lambda (this host kills those ~60s in). Saves after every
// prompt so partial progress survives even a worker death.

import { probeAllEngines, analyzePrompt, ENGINES } from "./engines";
import { listTrackedPrompts, listAllActiveTracked, getLastProbeTimes, saveProbeResults, getBusiness } from "./db";

export async function runProbeSweep(opts: { businessId?: string; cap?: number }): Promise<{ processed: number; results: number }> {
  const cap = opts.cap ?? 30;

  let items: Array<{ id: string; prompt: string; business_id: string; business: { name: string; trade: string; city: string } | null }>;
  if (opts.businessId) {
    const business = await getBusiness(opts.businessId);
    if (!business) return { processed: 0, results: 0 };
    items = (await listTrackedPrompts(opts.businessId)).map((p) => ({ id: p.id, prompt: p.prompt, business_id: opts.businessId as string, business }));
  } else {
    items = await listAllActiveTracked();
  }

  // Fair rotation: never-probed first, then least-recently-probed.
  const lastProbed = await getLastProbeTimes();
  items.sort((a, b) => (lastProbed[a.id] ?? "").localeCompare(lastProbed[b.id] ?? ""));
  const slice = items.slice(0, cap);

  let processed = 0;
  let results = 0;
  for (const p of slice) {
    if (!p.business) continue;
    try {
      const answers = await probeAllEngines(p.prompt, undefined, { city: p.business.city });
      const verdicts = await analyzePrompt(p.business, p.prompt, answers);
      const rows: Array<{ business_id: string; prompt_id: string; engine: string; mentioned: boolean; position: number | null; sentiment: string | null; competitors: unknown; sources: unknown; answer: string | null; measured: boolean }> = [];
      for (const e of ENGINES) {
        const a = answers.find((x) => x.engine === e);
        if (!a || !a.ok) continue;
        const v = verdicts[e];
        // measured=false when the engine ran but had nothing to measure (empty
        // AI Overview / no Maps results) or the judge never actually ran — so
        // the UI shows "—" and it's excluded from mention-rate denominators,
        // instead of a misleading 0%.
        const measured = a.measured !== false && v?.judged !== false;
        rows.push({
          business_id: p.business_id, prompt_id: p.id, engine: e,
          mentioned: v.mentioned, position: v.position, sentiment: v.sentiment,
          competitors: v.competitors, sources: a.sources, answer: a.text.slice(0, 8000),
          measured,
        });
      }
      await saveProbeResults(rows); // incremental — survives interruption
      processed++;
      results += rows.length;
    } catch (e) {
      console.error("[probes] prompt failed:", e);
    }
  }
  return { processed, results };
}
