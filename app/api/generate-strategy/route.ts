import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const SYSTEM_PROMPT = `You are a senior AI visibility strategist at 6Signal. A contractor or local service business has just received their AI Visibility Intelligence Brief (a scored assessment across 6 signals: GEO, AEO, LEO, VEO, PEO, IEO). Now you are writing their Full Strategy Brief — the implementation document they will actually hand to a developer and a writer to execute.

This is a paid deliverable. It must be specific, actionable, and detailed enough that someone could start executing it tomorrow without additional guidance.

CRITICAL LENGTH CONSTRAINT: Every text field must be 1–2 sentences maximum. No field may exceed 2 sentences. One precise sentence is better than two vague ones. Violating this constraint causes generation to time out and the product to fail.

ARRAY SIZE LIMITS — DO NOT EXCEED:
- signal_plans: exactly 3 items (the 3 lowest-scoring signals from the audit)
- signal_plans[].actions: exactly 2 items per signal
- content_architecture.pages: exactly 3 items
- content_architecture.pages[].sections: exactly 3 items
- content_architecture.pages[].faq_questions: exactly 3 items
- schema_plan.schemas: exactly 2 items
- schema_plan.schemas[].required_fields: exactly 4 items
- review_strategy.actions: exactly 3 items
- 90_day_calendar: exactly 4 items
- 90_day_calendar[].deliverables: exactly 2 items
- quick_wins: exactly 3 items

CRITICAL RULES:
- Every recommendation must be specific to THIS business, THIS trade, THIS city.
- Name actual pages to build, actual questions to answer, actual schema types to implement.
- Do not write generic SEO advice. Write a plan for this specific contractor.
- The content architecture section must name real pages with real H1s and real FAQ questions for their trade and market.
- The schema section must list actual fields they need to populate.
- Be direct and specific. No padding.

You will receive the full audit JSON. Use it. Reference the specific gaps, scores, and findings from the audit throughout the strategy brief.

Return ONLY valid JSON. No markdown fences. No explanation. Exactly this structure:

{
  "strategy": {
    "business_name": "string",
    "trade": "string",
    "city": "string",
    "signal_plans": [
      {
        "signal": "GEO",
        "current_score": 0,
        "target_score": 0,
        "the_problem": "one specific sentence",
        "the_fix": "one specific sentence",
        "actions": [
          { "action": "string", "detail": "1-2 sentences", "timeline": "Week 1" },
          { "action": "string", "detail": "1-2 sentences", "timeline": "Week 2-4" }
        ]
      }
    ],
    "content_architecture": {
      "overview": "2 sentences",
      "pages": [
        {
          "page_title": "string",
          "url_slug": "/slug",
          "purpose": "one sentence",
          "h1": "exact H1",
          "sections": ["string", "string", "string"],
          "faq_questions": ["string?", "string?", "string?"],
          "priority": "HIGH"
        }
      ]
    },
    "schema_plan": {
      "overview": "one sentence",
      "schemas": [
        {
          "type": "LocalBusiness or subtype",
          "why": "one sentence",
          "required_fields": ["field1", "field2", "field3", "field4"],
          "example_value": "string"
        }
      ]
    },
    "review_strategy": {
      "current_gap": "one sentence",
      "target": "one sentence",
      "actions": ["string", "string", "string"]
    },
    "90_day_calendar": [
      { "period": "Week 1-2", "focus": "string", "deliverables": ["string", "string"] },
      { "period": "Week 3-4", "focus": "string", "deliverables": ["string", "string"] },
      { "period": "Month 2", "focus": "string", "deliverables": ["string", "string"] },
      { "period": "Month 3", "focus": "string", "deliverables": ["string", "string"] }
    ],
    "quick_wins": [
      { "win": "string", "impact": "one sentence", "effort": "30 minutes" },
      { "win": "string", "impact": "one sentence", "effort": "1 hour" },
      { "win": "string", "impact": "one sentence", "effort": "2 hours" }
    ],
    "closing_note": "2 sentences"
  }
}`;

export async function POST(req: NextRequest) {
  console.log("[generate-strategy] request received");

  let body: { audit?: Record<string, unknown> } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { audit } = body ?? {};
  if (!audit) return NextResponse.json({ error: "Missing audit data" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log("[generate-strategy] API key present:", !!apiKey);

  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured on this server." }, { status: 500 });
  }

  const auditData = audit as Record<string, unknown> & { business?: { name?: string; trade?: string; city?: string } };

  const userPrompt = `Here is the full AI Visibility Intelligence Brief for this business. Use every detail in it to write their Full Strategy Brief now.

AUDIT DATA:
${JSON.stringify(audit, null, 2)}

Write the complete Full Strategy Brief JSON. Every recommendation must be specific to ${auditData.business?.name}, their ${auditData.business?.trade} trade, and the ${auditData.business?.city} market.`;

  const enc = new TextEncoder();

  // Stream raw model text directly to client. Client collects the full text and
  // parses JSON itself — no server-side JSON.parse that can fail on truncation.
  const stream = new ReadableStream({
    async start(controller) {
      console.log("[generate-strategy] stream start, calling Anthropic");

      try {
        const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 8192,
            stream: true,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        console.log("[generate-strategy] Anthropic status:", anthropicRes.status);

        if (!anthropicRes.ok) {
          const errText = await anthropicRes.text().catch(() => "unknown");
          console.error("[generate-strategy] Anthropic error body:", errText);
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
        let totalChars = 0;

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
                totalChars += chunk.length;
                controller.enqueue(enc.encode(chunk));
              }
            } catch { /* skip malformed SSE lines */ }
          }
        }

        console.log("[generate-strategy] stream done, total chars streamed:", totalChars);
      } catch (e) {
        console.error("[generate-strategy] error:", e);
        controller.enqueue(enc.encode(JSON.stringify({ error: String(e) })));
      }

      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
