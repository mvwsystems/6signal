// Deterministic site-crawl evidence for the IEO signal.
// No LLM involvement: every check is observable, repeatable, and citable.
// The IEO score is computed here in code and injected into the audit prompt —
// the model writes the narrative around it, never the number.

export interface SiteEvidence {
  url: string;
  fetched: boolean;
  http_status: number | null;
  robots_allows_ai: boolean;
  ai_bots_blocked: string[];
  has_schema: boolean;
  schema_types: string[];
  has_local_business: boolean;
  has_faq_schema: boolean;
  sitemap_ok: boolean;
  title: string | null;
  has_meta_description: boolean;
  h1_count: number;
  word_count: number;
  ieo_score: number;
  checks: Record<string, boolean>;
}

const AI_BOTS = ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"];

const LOCAL_BUSINESS_TYPES = new Set([
  "LocalBusiness",
  "Plumber",
  "HVACBusiness",
  "RoofingContractor",
  "Electrician",
  "GeneralContractor",
  "HomeAndConstructionBusiness",
  "ProfessionalService",
  "MovingCompany",
  "HousePainter",
  "Locksmith",
]);

const UA = "6SignalBot/1.0 (+https://6signal.co)";

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*" },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Minimal robots.txt parse: which of the AI bots are disallowed from "/"
function blockedAiBots(robotsTxt: string): string[] {
  const blocked: string[] = [];
  const lines = robotsTxt.split("\n").map((l) => l.replace(/#.*$/, "").trim());
  let currentAgents: string[] = [];
  let rulesSeen = false;
  const disallowedAll = new Set<string>();

  for (const line of lines) {
    const ua = line.match(/^user-agent:\s*(.+)$/i);
    if (ua) {
      if (rulesSeen) currentAgents = [];
      rulesSeen = false;
      currentAgents.push(ua[1].trim());
      continue;
    }
    const dis = line.match(/^disallow:\s*(.*)$/i);
    if (dis) {
      rulesSeen = true;
      const path = dis[1].trim();
      if (path === "/") currentAgents.forEach((a) => disallowedAll.add(a.toLowerCase()));
    }
  }

  for (const bot of AI_BOTS) {
    if (disallowedAll.has(bot.toLowerCase()) || disallowedAll.has("*")) blocked.push(bot);
  }
  return blocked;
}

function extractJsonLdTypes(html: string): string[] {
  const types: string[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1]);
      const nodes: unknown[] = [];
      const collect = (n: unknown) => {
        if (Array.isArray(n)) return n.forEach(collect);
        if (n && typeof n === "object") {
          nodes.push(n);
          const g = (n as Record<string, unknown>)["@graph"];
          if (g) collect(g);
        }
      };
      collect(parsed);
      for (const node of nodes) {
        const t = (node as Record<string, unknown>)["@type"];
        if (typeof t === "string") types.push(t);
        else if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && types.push(x));
      }
    } catch {
      /* malformed JSON-LD is itself a finding: it just won't count */
    }
  }
  return Array.from(new Set(types));
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function collectSiteEvidence(rawUrl: string): Promise<SiteEvidence> {
  const url = normalizeUrl(rawUrl);
  const origin = (() => {
    try {
      return new URL(url).origin;
    } catch {
      return url;
    }
  })();

  const [pageRes, robotsRes, sitemapRes] = await Promise.all([
    fetchWithTimeout(url, 8000),
    fetchWithTimeout(`${origin}/robots.txt`, 4000),
    fetchWithTimeout(`${origin}/sitemap.xml`, 4000),
  ]);

  const fetched = !!pageRes && pageRes.ok;
  const html = fetched ? await pageRes!.text().catch(() => "") : "";

  const robotsTxt = robotsRes && robotsRes.ok ? await robotsRes.text().catch(() => "") : "";
  const aiBotsBlocked = robotsTxt ? blockedAiBots(robotsTxt) : [];
  // No robots.txt (or unreadable) = nothing is blocked
  const robotsAllowsAi = aiBotsBlocked.length === 0;

  const sitemapOk = !!sitemapRes && sitemapRes.ok;

  const schemaTypes = html ? extractJsonLdTypes(html) : [];
  const hasSchema = schemaTypes.length > 0;
  const hasLocalBusiness = schemaTypes.some((t) => LOCAL_BUSINESS_TYPES.has(t));
  const hasFaqSchema = schemaTypes.includes("FAQPage");

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim().slice(0, 200) : null;
  const hasMetaDescription = /<meta[^>]+name=["']description["'][^>]*content=["'][^"']{10,}/i.test(html);
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  const wordCount = html ? stripHtml(html).split(" ").filter(Boolean).length : 0;

  const checks: Record<string, boolean> = {
    site_reachable: fetched,
    robots_allows_ai_bots: robotsAllowsAi,
    json_ld_present: hasSchema,
    local_business_schema: hasLocalBusiness,
    faq_schema: hasFaqSchema,
    sitemap_present: sitemapOk,
    title_present: !!title,
    meta_description_present: hasMetaDescription,
    h1_present: h1Count >= 1,
    substantial_content: wordCount >= 300,
  };

  // Deterministic 0–100 checklist score. Weights sum to 100.
  let score = 0;
  if (checks.site_reachable) score += 15;
  score += (AI_BOTS.length - aiBotsBlocked.length) * 5; // 20 max
  if (checks.json_ld_present) score += 10;
  if (checks.local_business_schema) score += 15;
  if (checks.faq_schema) score += 10;
  if (checks.sitemap_present) score += 10;
  if (checks.title_present) score += 5;
  if (checks.meta_description_present) score += 5;
  if (checks.h1_present) score += 5;
  if (checks.substantial_content) score += 5;
  if (!fetched) score = Math.min(score, 20); // unreachable caps everything

  return {
    url,
    fetched,
    http_status: pageRes ? pageRes.status : null,
    robots_allows_ai: robotsAllowsAi,
    ai_bots_blocked: aiBotsBlocked,
    has_schema: hasSchema,
    schema_types: schemaTypes,
    has_local_business: hasLocalBusiness,
    has_faq_schema: hasFaqSchema,
    sitemap_ok: sitemapOk,
    title,
    has_meta_description: hasMetaDescription,
    h1_count: h1Count,
    word_count: wordCount,
    ieo_score: score,
    checks,
  };
}

export function evidenceForPrompt(e: SiteEvidence): string {
  if (!e.fetched) {
    return `REAL CRAWL EVIDENCE (collected ${new Date().toISOString().slice(0, 10)} by 6Signal's crawler):
- The website ${e.url} could NOT be fetched (HTTP status: ${e.http_status ?? "no response"}). AI crawlers attempting to read this site will likely fail the same way. This is a severe, observed IEO failure — state it as fact.
- IEO score (computed from crawl checklist): ${e.ieo_score}/100. Use exactly this number for signals.ieo.score.`;
  }
  return `REAL CRAWL EVIDENCE (collected ${new Date().toISOString().slice(0, 10)} by 6Signal's crawler — these are observed facts, not assumptions; reference them directly in the IEO finding and anywhere else relevant):
- Site reachable: yes (HTTP ${e.http_status})
- robots.txt blocks AI crawlers: ${e.ai_bots_blocked.length ? e.ai_bots_blocked.join(", ") : "none blocked — GPTBot, ClaudeBot, PerplexityBot, Google-Extended all allowed"}
- JSON-LD structured data present: ${e.has_schema ? `yes (types: ${e.schema_types.join(", ")})` : "NO — zero structured data found"}
- LocalBusiness (or subtype) schema: ${e.has_local_business ? "yes" : "MISSING"}
- FAQPage schema: ${e.has_faq_schema ? "yes" : "MISSING"}
- sitemap.xml: ${e.sitemap_ok ? "present" : "MISSING or unreachable"}
- Title tag: ${e.title ? `"${e.title}"` : "MISSING"}
- Meta description: ${e.has_meta_description ? "present" : "MISSING"}
- H1 count on homepage: ${e.h1_count}
- Homepage visible word count: ~${e.word_count}
- IEO score (computed deterministically from this checklist): ${e.ieo_score}/100. Use exactly this number for signals.ieo.score and base the IEO finding/evidence/gap fields on the observed facts above.`;
}
