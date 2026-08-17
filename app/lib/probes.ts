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

  // Rotation, budgeted in two lanes. Never-probed prompts used to sort first
  // outright, so adding a large batch of new prompts pushed the established
  // set out of the sweep entirely and broke its trendline — the one thing the
  // measurement is for. New prompts get at most half the run and phase in over
  // a few sweeps; the rest of the budget goes to the least-recently-probed.
  const lastProbed = await getLastProbeTimes();
  const fresh = items.filter((i) => !lastProbed[i.id]);
  const seen = items
    .filter((i) => lastProbed[i.id])
    .sort((a, b) => (lastProbed[a.id] ?? "").localeCompare(lastProbed[b.id] ?? ""));
  const freshQuota = Math.min(fresh.length, seen.length ? Math.max(1, Math.floor(cap / 2)) : cap);
  const slice = [...fresh.slice(0, freshQuota), ...seen.slice(0, cap - freshQuota)];

  let processed = 0;
  let results = 0;
  for (const p of slice) {
    if (!p.business) continue;
    try {
      const answers = await probeAllEngines(p.prompt);
      const verdicts = await analyzePrompt(p.business, p.prompt, answers);
      const rows: Array<{ business_id: string; prompt_id: string; engine: string; mentioned: boolean; position: number | null; sentiment: string | null; competitors: unknown; sources: unknown; answer: string | null }> = [];
      for (const e of ENGINES) {
        const a = answers.find((x) => x.engine === e);
        if (!a || !a.ok) continue;
        const v = verdicts[e];
        rows.push({
          business_id: p.business_id, prompt_id: p.id, engine: e,
          mentioned: v.mentioned, position: v.position, sentiment: v.sentiment,
          competitors: v.competitors, sources: a.sources, answer: a.text.slice(0, 8000),
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
