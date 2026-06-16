import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAuthed } from "../../../lib/dashboard-auth";
import { collectSiteEvidence, evidenceForPrompt } from "../../../lib/evidence";
import { localLandscape, localForPrompt } from "../../../lib/places";
import { runWebGroundedJSON, clampScore, SCAN_MODEL } from "../../../lib/aiScan";
import { upsertBusiness, insertAuditRow, completeAudit, failAudit, saveSignalScores, saveSiteSnapshot } from "../../../lib/db";

export const maxDuration = 300;

const PROMPT_VERSION = "scan-2.0.0-websearch+places";
const SIGNAL_KEYS = ["geo", "aeo", "leo", "veo", "peo", "ieo"] as const;

const SYSTEM_PROMPT = `You are a 6Signal AI-visibility analyst running a fast LIVE triage scan. Use the web_search tool for real evidence — do not guess.

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

  const user = `Run a fast 6Signal triage scan.

Business: ${name}
Trade: ${trade}
City: ${city}
${url ? `Website: ${url}` : "Website: (none)"}

${evidence ? evidenceForPrompt(evidence) : "No site crawl available."}

${localForPrompt(local)}

Search the web now, then return the scan JSON.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 285_000);
  let scan: Record<string, unknown>;
  try {
    scan = await runWebGroundedJSON({ system: SYSTEM_PROMPT, user, maxTokens: 4096, maxSearches: 5, signal: controller.signal });
  } catch (e) {
    console.error("[dashboard/scan]", e);
    await failAudit(auditId);
    return NextResponse.json({ error: "Scan failed or timed out." }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }

  const signals = (scan.signals ?? {}) as Record<string, { score?: number; finding?: string; gap?: string }>;
  for (const k of SIGNAL_KEYS) signals[k] = { score: clampScore(signals[k]?.score), finding: signals[k]?.finding ?? "", gap: signals[k]?.gap ?? "" };
  if (evidence && Number.isFinite(evidence.ieo_score)) signals.ieo.score = clampScore(evidence.ieo_score);
  scan.signals = signals;
  const overall = Math.round(SIGNAL_KEYS.reduce((s, k) => s + (signals[k].score as number), 0) / SIGNAL_KEYS.length);
  scan.overall = { score: overall };

  await completeAudit({ id: auditId, payload: scan, overallScore: overall });
  await saveSignalScores(auditId, SIGNAL_KEYS.map((k) => ({ signal: k, score: signals[k].score as number, evidence: k === "ieo" && evidence ? evidence.checks : undefined })));

  return NextResponse.json({ id: auditId, ...scan });
}
