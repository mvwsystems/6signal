import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAuthed } from "../../../lib/dashboard-auth";
import { collectSiteEvidence, evidenceForPrompt } from "../../../lib/evidence";
import {
  upsertBusiness,
  insertAuditRow,
  completeAudit,
  failAudit,
  saveSignalScores,
  saveSiteSnapshot,
} from "../../../lib/db";

export const maxDuration = 300;

// Internal-only, web-search-grounded scan. Unlike the customer-facing audit
// (which model-estimates the AI-engine signals), this actually searches the
// live web to check whether the business is named for its trade + city, then
// scores all six signals against what it found. Gated by the dashboard cookie.

const MODEL = "claude-opus-4-8";
const PROMPT_VERSION = "scan-1.0.0-websearch";
const SIGNAL_KEYS = ["geo", "aeo", "leo", "veo", "peo", "ieo"] as const;

const SYSTEM_PROMPT = `You are a 6Signal AI-visibility analyst running a LIVE scan. Use the web_search tool to gather real evidence before scoring — do not guess.

Run searches that establish, for THIS business in THIS city and trade:
1. "best <trade> in <city>" and "top <trade> <city>" — what an AI assistant would surface, which providers are named, and whether THIS business appears.
2. "<business name> <city>" and "<business name> reviews" — its real presence: Google Business Profile, Yelp, Angi, BBB, directories, review volume/recency.
3. Anything that reveals AI Overview / featured-snippet presence for the trade + city.

Then score each of the six signals 0–100 grounded in what you actually found:
- GEO: is the business named by generative engines (ChatGPT/Gemini/Perplexity/Claude) for its trade + city?
- AEO: cited in Google AI Overviews / featured snippets / PAA?
- LEO: GBP strength + citation/NAP consistency + review signals across Maps/Yelp/directories?
- VEO: voice-assistant readiness (conversational, local, would Siri/Alexa surface it)?
- PEO: surfaces inside the real query language buyers use?
- IEO: site is AI-crawlable — schema, structure, robots access. (A deterministic IEO checklist is provided below; weigh it heavily for IEO.)

Most local contractors score 10–50. A score above 75 is rare and must be justified by what you found.

Return ONLY a valid JSON object — no markdown, no prose, no code fences — exactly this shape:
{
  "business": { "name": "string", "trade": "string", "city": "string", "found": false },
  "ai_answer": "2-3 sentences: a realistic AI-assistant answer to 'best <trade> in <city>', naming the real providers you found, and stating plainly whether <business name> appears.",
  "competitors": ["names actually surfaced in search"],
  "signals": {
    "geo": { "score": 0, "finding": "1 sentence grounded in what you found", "gap": "1 sentence" },
    "aeo": { "score": 0, "finding": "string", "gap": "string" },
    "leo": { "score": 0, "finding": "string", "gap": "string" },
    "veo": { "score": 0, "finding": "string", "gap": "string" },
    "peo": { "score": 0, "finding": "string", "gap": "string" },
    "ieo": { "score": 0, "finding": "string", "gap": "string" }
  },
  "top_opportunity": "one sentence — the highest-leverage move",
  "immediate_win": "one sentence — something doable this week"
}`;

interface AnthropicBlock { type: string; text?: string }
interface AnthropicResponse { content?: AnthropicBlock[]; stop_reason?: string }

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, string> | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { name, trade, city } = body ?? {};
  let { url } = body ?? {};
  if (!name || !trade || !city) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 500 });

  // Deterministic IEO crawl (best-effort).
  const evidence = url ? await collectSiteEvidence(url).catch(() => null) : null;

  const auditId = randomUUID();
  const businessId = await upsertBusiness({ name, url: url ?? null, trade, city });
  await insertAuditRow({ id: auditId, businessId, intakeId: null, tier: "brief_27", model: MODEL, promptVersion: PROMPT_VERSION });
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

  const userPrompt = `Run a live 6Signal AI-visibility scan.

Business Name: ${name}
Trade: ${trade}
City / Market: ${city}
${url ? `Website: ${url}` : "Website: (none provided)"}

${evidence ? evidenceForPrompt(evidence) : "No site crawl was available."}

Search the web now, then return the scan JSON.`;

  // Server-side web_search runs inside one request; pause_turn means it hit the
  // internal iteration cap — re-send to resume. Bounded for safety.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 285_000);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages: { role: "user" | "assistant"; content: any }[] = [{ role: "user", content: userPrompt }];
  let fullText = "";

  try {
    for (let turn = 0; turn < 5; turn++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 4096,
          thinking: { type: "disabled" },
          system: SYSTEM_PROMPT,
          tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
          messages,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "unknown");
        console.error("[dashboard/scan] Anthropic error:", res.status, errText);
        await failAudit(auditId);
        return NextResponse.json({ error: `Scan failed (${res.status}).` }, { status: 502 });
      }
      const data = (await res.json()) as AnthropicResponse;
      for (const b of data.content ?? []) if (b.type === "text" && b.text) fullText += b.text;
      if (data.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: data.content });
        continue;
      }
      break;
    }
  } catch (e) {
    console.error("[dashboard/scan] error:", e);
    await failAudit(auditId);
    return NextResponse.json({ error: "Scan failed or timed out." }, { status: 504 });
  } finally {
    clearTimeout(timer);
  }

  // Extract the JSON object from the final text.
  const match = fullText.replace(/```json\n?|```\n?/g, "").match(/\{[\s\S]*\}/);
  if (!match) {
    await failAudit(auditId);
    return NextResponse.json({ error: "Scan produced no parseable result." }, { status: 502 });
  }
  let scan: Record<string, unknown>;
  try {
    scan = JSON.parse(match[0]);
  } catch {
    await failAudit(auditId);
    return NextResponse.json({ error: "Scan result was malformed." }, { status: 502 });
  }

  // Normalize + clamp scores; let the deterministic crawl own IEO when present.
  const signals = (scan.signals ?? {}) as Record<string, { score?: number; finding?: string; gap?: string }>;
  const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  for (const k of SIGNAL_KEYS) signals[k] = { score: clamp(signals[k]?.score), finding: signals[k]?.finding ?? "", gap: signals[k]?.gap ?? "" };
  if (evidence && Number.isFinite(evidence.ieo_score)) signals.ieo.score = clamp(evidence.ieo_score);
  scan.signals = signals;
  const overall = Math.round(SIGNAL_KEYS.reduce((sum, k) => sum + (signals[k].score as number), 0) / SIGNAL_KEYS.length);
  scan.overall = { score: overall };

  await completeAudit({ id: auditId, payload: scan, overallScore: overall });
  await saveSignalScores(
    auditId,
    SIGNAL_KEYS.map((k) => ({ signal: k, score: signals[k].score as number, evidence: k === "ieo" && evidence ? evidence.checks : undefined }))
  );

  return NextResponse.json({ id: auditId, ...scan });
}
