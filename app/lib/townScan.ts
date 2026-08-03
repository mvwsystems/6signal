// Town-level AI visibility scan: ask the core buyer question per service-area
// town ("best <trade> in <town>") across every configured engine, judge each
// answer with the existing haiku analyzer, and score each town by the share of
// responding engines that name the business. Runs in the background worker
// (kind "ai-towns") — towns run sequentially, engines in parallel per town.

import { probeAllEngines, analyzePrompt, enginesWithKeys, ENGINES, Engine } from "./engines";
import { getBusiness, saveTownScan } from "./db";

export interface TownResult {
  town: string;
  prompt: string;
  engines: Partial<Record<Engine, { ok: boolean; mentioned: boolean; position: number | null }>>;
  score: number; // % of responding engines that named the business
}

export async function runTownScan(args: { businessId: string; towns: string[] }): Promise<void> {
  const business = await getBusiness(args.businessId);
  if (!business) throw new Error("business not found");
  const towns = [...new Set(args.towns.map((t) => t.trim()).filter(Boolean))].slice(0, 8);
  if (!towns.length) throw new Error("no towns given");
  const active = enginesWithKeys();

  // Qualify a bare town with the client's state ("Red Oak" → "Red Oak, TX") so
  // engines don't answer about a same-named town in another state — the cause of
  // the "every engine ✗, town 0%" reading despite strong tracked-prompt ranks.
  const cityParts = business.city.split(",").map((s) => s.trim());
  const state = cityParts.length >= 2 ? cityParts[cityParts.length - 1] : "";
  const withState = (town: string) => (/,\s*[A-Za-z]/.test(town) || !state ? town : `${town}, ${state}`);

  const results: TownResult[] = [];
  for (const town of towns) {
    const townLabel = withState(town);
    const prompt = `best ${business.trade.toLowerCase()} in ${townLabel}`;
    try {
      const answers = await probeAllEngines(prompt, undefined, { city: townLabel });
      const verdicts = await analyzePrompt({ name: business.name, trade: business.trade, city: townLabel }, prompt, answers);
      const engines: TownResult["engines"] = {};
      let responded = 0, named = 0;
      for (const e of ENGINES) {
        const a = answers.find((x) => x.engine === e);
        // Count an engine only if it answered, had something to measure, AND the
        // judge actually ran — so a single judge hiccup can't paint the whole
        // town 0%.
        const ok = Boolean(a?.ok && a.text && a.measured !== false && verdicts[e]?.judged !== false);
        engines[e] = { ok, mentioned: ok && Boolean(verdicts[e]?.mentioned), position: ok ? verdicts[e]?.position ?? null : null };
        if (active.includes(e) && ok) { responded++; if (verdicts[e]?.mentioned) named++; }
      }
      results.push({ town, prompt, engines, score: responded ? Math.round((100 * named) / responded) : 0 });
    } catch (e) {
      console.error(`[town-scan] ${town} failed:`, e);
      results.push({ town, prompt: `best ${business.trade.toLowerCase()} in ${withState(town)}`, engines: {}, score: 0 });
    }
  }

  // Only towns where at least one engine was actually measured count toward the
  // average — an unmeasurable town shouldn't read as a real 0%.
  const scored = results.filter((r) => Object.values(r.engines).some((v) => v.ok));
  const avg = scored.length ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length) : 0;
  const best = scored.length ? scored.reduce((a, b) => (b.score > a.score ? b : a)).town : null;
  const worst = scored.length ? scored.reduce((a, b) => (b.score < a.score ? b : a)).town : null;

  await saveTownScan({
    business_id: args.businessId,
    towns: results,
    stats: { avg_score: avg, best_town: best, worst_town: worst, engines_used: active },
  });
}
