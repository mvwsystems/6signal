import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { collectSiteEvidence, evidenceForPrompt } from "../../lib/evidence";
import {
  upsertBusiness,
  insertAuditRow,
  completeAudit,
  failAudit,
  saveSignalScores,
  saveSiteSnapshot,
  getEmailForIntake,
} from "../../lib/db";
import { sendReportReadyEmail } from "../../lib/email";

export const maxDuration = 300;

const MODEL = "claude-haiku-4-5-20251001";
// Bump whenever the prompt or scoring method changes — scores are only
// comparable within a prompt_version.
const PROMPT_VERSION = "2.0.0-evidence";

const SYSTEM_PROMPT = `You are a senior AEO/GEO strategist and AI visibility analyst at 6Signal — a firm that helps contractors and local service businesses become the recommended answer across AI search surfaces including ChatGPT, Perplexity, Google AI Mode, Google AI Overviews, Gemini, and voice assistants.

Your job is to produce a deep, specific, intelligence-grade visibility audit. This is NOT a generic scorecard. It reads like a Graphite.io-level strategic brief — persona-driven, buyer-journey mapped, citation-source aware, and content-gap specific.

You are analyzing a real business. Think like a senior strategist who has audited hundreds of contractor and local service businesses. Every insight must be specific to THIS business, THIS trade, THIS city, THIS buyer.

CRITICAL LENGTH CONSTRAINT: Every text field must be 1–2 sentences maximum. No field may exceed 2 sentences. Wherever the schema says "2-3 sentences", write 2. Wherever it says "3-4 sentences", write 2. One precise sentence is better than two vague ones. Violating this constraint causes generation to time out.

SCORING RULES — READ CAREFULLY:
- Score each of the six signals (GEO, AEO, LEO, VEO, PEO, IEO) on a scale of 0–100. Not 0–10. Never exceed 100.
- The overall score is the average of all six signal scores, rounded to the nearest whole number.
- Grade thresholds: 90-100 = A, 75-89 = B, 60-74 = C, 45-59 = D, below 45 = F.
- Scores for most contractor businesses will fall between 10 and 65. A score above 80 is rare and must be justified.

CRITICAL RULES:
- Never use generic language. Every sentence must be specific to this business.
- Reference real buyer behaviors for this trade and market.
- Name the actual types of sources that win citations in this category (Angi, Yelp, HomeAdvisor, local blogs, Reddit, YouTube, etc.)
- Map the actual buyer journey stages for this trade — what does a buyer in this city actually ask when they have this problem?
- Identify specific content types and topics this business is likely missing.
- Be honest and direct. If a business is AI-invisible, say so clearly and explain exactly why.
- The output must be actionable enough that a client could hand it to a developer and a writer and they'd know exactly what to build.

Return ONLY valid JSON. No markdown fences. No explanation text. Exactly this structure:

{
  "business": {
    "name": "string",
    "url": "string",
    "trade": "string",
    "city": "string",
    "market_context": "2-3 sentences: what the competitive AI search landscape looks like for this trade in this city. Who are the dominant types of sources winning AI citations here? What does a buyer in this market typically do when they need this service?",
    "critical_finding": "one sentence starting with 'Critical:' — state the single most damaging AI visibility gap for this specific business. Example: 'Critical: [Business Name] does not appear in any AI response when buyers search for [trade] in [city].'"
  },

  "executive_summary": {
    "headline": "one sharp, specific verdict sentence — name the business, state the problem clearly",
    "situation": "3-4 sentences: what is this business's current AI visibility situation? What are they likely doing right? What is the structural problem holding them back? What is the business cost of this gap?",
    "bottom_line": "one sentence: what happens if nothing changes in the next 12 months?",
    "cost_of_invisibility": "one sentence estimating the lead volume or revenue impact. Example: 'A plumbing business in Fort Worth operating at this visibility level is losing an estimated 15-25% of in-market lead volume annually to AI-visible competitors.'"
  },

  "overall": {
    "score": 0,
    "grade": "A/B/C/D/F",
    "risk_level": "CRITICAL / HIGH / MODERATE / STRONG",
    "visibility_status": "AI-INVISIBLE / WEAK / PARTIAL / COMPETITIVE / DOMINANT"
  },

  "buyer_journey": {
    "persona": "name and describe the primary buyer for this trade in this city",
    "stages": [
      {
        "stage": 1,
        "label": "Problem Awareness",
        "buyer_question": "the exact question a buyer asks at this stage",
        "what_they_need": "what information resolves their anxiety at this stage",
        "who_answers_now": "what type of source is currently answering this",
        "is_business_present": false,
        "gap": "specific gap for this business at this stage"
      },
      {
        "stage": 2,
        "label": "Provider Research",
        "buyer_question": "string",
        "what_they_need": "string",
        "who_answers_now": "string",
        "is_business_present": false,
        "gap": "string"
      },
      {
        "stage": 3,
        "label": "Trust Verification",
        "buyer_question": "string",
        "what_they_need": "string",
        "who_answers_now": "string",
        "is_business_present": false,
        "gap": "string"
      },
      {
        "stage": 4,
        "label": "Decision & Contact",
        "buyer_question": "string",
        "what_they_need": "string",
        "who_answers_now": "string",
        "is_business_present": false,
        "gap": "string"
      }
    ]
  },

  "signals": {
    "geo": {
      "label": "Generative Engine Optimization",
      "score": 0,
      "what_it_measures": "one sentence",
      "finding": "2-3 specific sentences",
      "evidence": "specific signals",
      "gap": "specific named gap"
    },
    "aeo": {
      "label": "Answer Engine Optimization",
      "score": 0,
      "what_it_measures": "one sentence",
      "finding": "2-3 specific sentences",
      "evidence": "specific signals",
      "gap": "specific named gap"
    },
    "leo": {
      "label": "Local Entity Optimization",
      "score": 0,
      "what_it_measures": "one sentence",
      "finding": "2-3 specific sentences",
      "evidence": "specific signals",
      "gap": "specific named gap"
    },
    "veo": {
      "label": "Voice Engine Optimization",
      "score": 0,
      "what_it_measures": "one sentence",
      "finding": "2-3 specific sentences",
      "evidence": "specific signals",
      "gap": "specific named gap"
    },
    "peo": {
      "label": "Prompt Engine Optimization",
      "score": 0,
      "what_it_measures": "one sentence",
      "finding": "2-3 specific sentences",
      "evidence": "specific signals",
      "gap": "specific named gap"
    },
    "ieo": {
      "label": "Index Engine Optimization",
      "score": 0,
      "what_it_measures": "one sentence",
      "finding": "2-3 specific sentences",
      "evidence": "specific signals",
      "gap": "specific named gap"
    }
  },

  "citation_landscape": {
    "summary": "2-3 sentences",
    "sources_winning": [
      { "source_type": "string", "why_they_win": "string", "threat_level": "HIGH" },
      { "source_type": "string", "why_they_win": "string", "threat_level": "HIGH" },
      { "source_type": "string", "why_they_win": "string", "threat_level": "MEDIUM" }
    ],
    "what_it_takes_to_win": "2-3 sentences"
  },

  "content_gap_analysis": {
    "summary": "2 sentences",
    "missing_content": [
      { "content_type": "string", "buyer_stage": "string", "why_it_matters": "string", "priority": "HIGH" },
      { "content_type": "string", "buyer_stage": "string", "why_it_matters": "string", "priority": "HIGH" },
      { "content_type": "string", "buyer_stage": "string", "why_it_matters": "string", "priority": "HIGH" },
      { "content_type": "string", "buyer_stage": "string", "why_it_matters": "string", "priority": "MEDIUM" },
      { "content_type": "string", "buyer_stage": "string", "why_it_matters": "string", "priority": "MEDIUM" }
    ]
  },

  "priority_roadmap": [
    { "rank": 1, "timeframe": "Week 1-2", "category": "string", "action": "string", "expected_impact": "string", "effort": "LOW" },
    { "rank": 2, "timeframe": "Week 2-4", "category": "string", "action": "string", "expected_impact": "string", "effort": "LOW" },
    { "rank": 3, "timeframe": "Month 2", "category": "string", "action": "string", "expected_impact": "string", "effort": "MEDIUM" },
    { "rank": 4, "timeframe": "Month 2-3", "category": "string", "action": "string", "expected_impact": "string", "effort": "MEDIUM" },
    { "rank": 5, "timeframe": "Month 3", "category": "string", "action": "string", "expected_impact": "string", "effort": "HIGH" }
  ],

  "retainer_case": {
    "hook": "one sentence",
    "what_6signal_builds": "2-3 sentences",
    "cost_of_inaction": "one sentence"
  }
}`;

export async function POST(req: NextRequest) {
  console.log("[generate-audit] request received");

  let body: Record<string, string> | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, url, trade, city, competitors, intakeId } = body ?? {};
  // Send the buyer their brief by email only on a genuine first generation
  // (the client sets notify=false on recovery/permalink re-views).
  const notify = (body as Record<string, unknown> | null)?.notify === true;
  if (!name || !url || !trade || !city) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log("[generate-audit] API key present:", !!apiKey);

  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured on this server." }, { status: 500 });
  }

  // Real crawl evidence: deterministic IEO checklist, observed facts for the
  // prompt. Best-effort — if the crawl fails entirely, that itself is evidence.
  const evidence = await collectSiteEvidence(url).catch(() => null);

  // Persist the run before streaming so a record exists even if the client
  // disconnects mid-generation.
  const auditId = randomUUID();
  const businessId = await upsertBusiness({ name, url, trade, city });
  await insertAuditRow({
    id: auditId,
    businessId,
    intakeId: intakeId || null,
    tier: "brief_27",
    model: MODEL,
    promptVersion: PROMPT_VERSION,
  });
  if (evidence) {
    void saveSiteSnapshot(auditId, {
      url: evidence.url,
      fetched: evidence.fetched,
      http_status: evidence.http_status,
      robots_allows_ai: evidence.robots_allows_ai,
      ai_bots_blocked: evidence.ai_bots_blocked,
      has_schema: evidence.has_schema,
      schema_types: evidence.schema_types,
      has_local_business: evidence.has_local_business,
      has_faq_schema: evidence.has_faq_schema,
      sitemap_ok: evidence.sitemap_ok,
      title: evidence.title,
      has_meta_description: evidence.has_meta_description,
      h1_count: evidence.h1_count,
      word_count: evidence.word_count,
      ieo_score: evidence.ieo_score,
      checks: evidence.checks,
    });
  }

  const userPrompt = `Run a full 6Signal AI Visibility Audit on this business:

Business Name: ${name}
Website URL: ${url}
Trade / Service Category: ${trade}
City / Market: ${city}
${competitors ? `Known Competitors: ${competitors}` : ""}

${evidence ? evidenceForPrompt(evidence) : ""}

Produce the complete audit JSON now. Be specific, deep, and strategic. Reference this business by name throughout.`;

  const enc = new TextEncoder();

  // Stream raw model text directly to client. Client collects the full text and
  // parses JSON itself — no server-side JSON.parse that can fail on truncation.
  const stream = new ReadableStream({
    async start(controller) {
      console.log("[generate-audit] stream start, calling Anthropic");

      try {
        const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 8192,
            stream: true,
            temperature: 0,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        console.log("[generate-audit] Anthropic status:", anthropicRes.status);

        if (!anthropicRes.ok) {
          const errText = await anthropicRes.text().catch(() => "unknown");
          console.error("[generate-audit] Anthropic error body:", errText);
          controller.enqueue(enc.encode(JSON.stringify({ error: `Anthropic API error ${anthropicRes.status}: ${errText}` })));
          controller.close();
          return;
        }

        if (!anthropicRes.body) {
          controller.enqueue(enc.encode(JSON.stringify({ error: "No body from Anthropic" })));
          controller.close();
          return;
        }

        const reader = anthropicRes.body.getReader();
        const dec = new TextDecoder();
        let sseBuf = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuf += dec.decode(value, { stream: true });
          const lines = sseBuf.split("\n");
          sseBuf = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const ev = JSON.parse(data);
              if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
                const chunk = ev.delta.text as string;
                fullText += chunk;
                controller.enqueue(enc.encode(chunk));
              }
            } catch { /* skip malformed SSE lines */ }
          }
        }

        console.log("[generate-audit] stream done, total chars streamed:", fullText.length);

        // Persist the completed brief + per-signal scores (best-effort).
        try {
          const clean = fullText.replace(/```json\n?|```\n?/g, "").trim();
          const parsed = JSON.parse(clean);
          const auditData = parsed.audit ?? parsed;
          const overall = Number(auditData?.overall?.score);
          await completeAudit({
            id: auditId,
            payload: auditData,
            overallScore: Number.isFinite(overall) ? overall : null,
          });
          const signals = auditData?.signals ?? {};
          await saveSignalScores(
            auditId,
            ["geo", "aeo", "leo", "veo", "peo", "ieo"].map((sig) => ({
              signal: sig,
              score: Number(signals?.[sig]?.score),
              evidence: sig === "ieo" && evidence ? evidence.checks : undefined,
            }))
          );

          // Email the buyer their finished brief (best-effort, once).
          if (notify && intakeId) {
            const to = await getEmailForIntake(intakeId);
            if (to) {
              await sendReportReadyEmail({
                to,
                kind: "brief",
                businessName: auditData?.business?.name ?? name,
                link: `https://6signal.co/audit-results?id=${auditId}`,
                score: Number.isFinite(overall) ? overall : null,
                grade: typeof auditData?.overall?.grade === "string" ? auditData.overall.grade : null,
                critical: auditData?.business?.critical_finding ?? null,
              });
            }
          }
        } catch (persistErr) {
          console.error("[generate-audit] persistence parse failed:", persistErr);
          await failAudit(auditId);
        }
      } catch (e) {
        console.error("[generate-audit] error:", e);
        controller.enqueue(enc.encode(JSON.stringify({ error: String(e) })));
        await failAudit(auditId);
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Audit-Id": auditId,
    },
  });
}
