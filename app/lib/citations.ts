// Citation intelligence: which sources AI engines actually cite when answering
// this business's buyer questions. The raw URLs are already captured by every
// probe run (probe_results.sources) — this aggregates the latest verdict per
// prompt×engine into a domain leaderboard. "Owned" = the client's own site.
// Pure DB + code, no AI calls.

import { getBusiness, getProbeResults, listTrackedPrompts } from "./db";

export interface CitationRow {
  domain: string;
  count: number;          // citations across latest answers
  engines: string[];      // which engines cite it
  prompts: string[];      // example buyer questions it was cited for
  owned: boolean;         // the client's own domain
}

// Engine plumbing/redirect hosts — not real sources.
const JUNK = [
  "vertexaisearch.cloud.google.com", "google.com", "www.google.com",
  "gstatic.com", "googleusercontent.com", "bing.com",
];

// Non-actionable sources for a local-services citation work order: academic /
// research, developer, encyclopedic, and finance/tax/records government sites.
// The panel's whole point is "get the client listed on these" — arxiv.org or a
// state comptroller domain being cited (observed, ChatGPT-only) is noise that
// misleads the work order, so it's filtered out of the leaderboard entirely.
const NOISE_PATTERNS: RegExp[] = [
  /(^|\.)arxiv\.org$/, /(^|\.)researchgate\.net$/, /(^|\.)jstor\.org$/,
  /(^|\.)ssrn\.com$/, /(^|\.)semanticscholar\.org$/, /(^|\.)ncbi\.nlm\.nih\.gov$/, /pubmed/,
  /\.edu$/, /\.mil$/,
  /(^|\.)github\.com$/, /(^|\.)stackoverflow\.com$/, /(^|\.)w3\.org$/,
  /(^|\.)wikipedia\.org$/, /(^|\.)wikimedia\.org$/,
  /(^|\.)cpa\.(state\.)?[a-z]{2}\.us$/, /comptroller/, /(^|\.)irs\.gov$/,
];

function isNoiseDomain(d: string): boolean {
  return NOISE_PATTERNS.some((re) => re.test(d));
}

function domainOf(url: string): string | null {
  try {
    const h = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (!h || JUNK.some((j) => h === j.replace(/^www\./, "") || h.endsWith(`.${j.replace(/^www\./, "")}`))) return null;
    if (isNoiseDomain(h)) return null;
    return h;
  } catch { return null; }
}

export async function citationIntel(businessId: string): Promise<{
  rows: CitationRow[]; siteDomain: string | null; ownedInTop: number; topN: number;
}> {
  const [business, results, prompts] = await Promise.all([
    getBusiness(businessId),
    getProbeResults(businessId, 90),
    listTrackedPrompts(businessId),
  ]);
  const siteDomain = business?.url ? domainOf(business.url) : null;
  const promptText = Object.fromEntries(prompts.map((p) => [p.id, p.prompt]));

  // Latest result per prompt×engine (results arrive newest-first is not
  // guaranteed — keep the newest run_at).
  const latest = new Map<string, { run_at: string; engine: string; prompt_id: string; sources: unknown }>();
  for (const r of results as Array<{ prompt_id?: string; engine?: string; run_at?: string; sources?: unknown }>) {
    if (!r.prompt_id || !r.engine) continue;
    const k = `${r.prompt_id}|${r.engine}`;
    const prev = latest.get(k);
    if (!prev || String(r.run_at) > prev.run_at) latest.set(k, { run_at: String(r.run_at), engine: r.engine, prompt_id: r.prompt_id, sources: r.sources });
  }

  const agg = new Map<string, { count: number; engines: Set<string>; prompts: Set<string> }>();
  for (const row of latest.values()) {
    if (!Array.isArray(row.sources)) continue;
    const seen = new Set<string>(); // count each domain once per answer
    for (const u of row.sources as unknown[]) {
      const d = typeof u === "string" ? domainOf(u) : null;
      if (!d || seen.has(d)) continue;
      seen.add(d);
      let a = agg.get(d);
      if (!a) { a = { count: 0, engines: new Set(), prompts: new Set() }; agg.set(d, a); }
      a.count += 1;
      a.engines.add(row.engine);
      const pt = promptText[row.prompt_id];
      if (pt && a.prompts.size < 3) a.prompts.add(pt);
    }
  }

  const rows: CitationRow[] = [...agg.entries()]
    .map(([domain, a]) => ({
      domain, count: a.count,
      engines: [...a.engines], prompts: [...a.prompts],
      owned: siteDomain != null && (domain === siteDomain || domain.endsWith(`.${siteDomain}`)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const topN = Math.min(rows.length, 10);
  const ownedInTop = rows.slice(0, topN).filter((r) => r.owned).length;
  return { rows, siteDomain, ownedInTop, topN };
}
