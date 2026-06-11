import { NextRequest, NextResponse } from "next/server";
import { upsertBusiness, insertLead, insertAuditRow, completeAudit } from "../../lib/db";

export const maxDuration = 30;

const MODEL = "claude-haiku-4-5-20251001";
const PROMPT_VERSION = "1.1.0";

const SYSTEM_PROMPT = `You are an AI visibility analyst for 6Signal. A contractor has submitted their business for a free AI visibility check.

Your job is to simulate what a major AI assistant (ChatGPT, Gemini, or Perplexity) would return if a homeowner asked: "Who is the best [trade] in [city]?"

Then assess whether the submitted business name would likely appear in that response based on what you know about AI recommendation patterns for local service businesses.

You must return a JSON object with exactly these fields:

{
  "ai_response": "A realistic 2-4 sentence simulation of what an AI assistant would return for this query. Name 2-3 real or plausible competitor businesses. Write it in the voice of an AI assistant giving a helpful recommendation. Do not mention 6Signal. Do not mention that this is a simulation.",

  "found": false,

  "signal_summary": [
    {
      "signal": "SIGNAL NAME IN CAPS",
      "finding": "One sentence describing a specific, realistic visibility gap for this trade in this city. Be specific to the trade and market — not generic."
    },
    {
      "signal": "SIGNAL NAME IN CAPS",
      "finding": "One sentence."
    },
    {
      "signal": "SIGNAL NAME IN CAPS",
      "finding": "One sentence."
    }
  ]
}

Rules:
- "found" should almost always be false unless the business name is a well-known regional chain you are highly confident appears in AI training data. Default to false for any local independent contractor.
- The ai_response must sound like a real AI assistant — confident, helpful, citing sources or review platforms. Do not say "I don't know" or hedge.
- The signal_summary must be specific to the submitted trade and city. Reference real platforms (Angi, HomeAdvisor, Google Business, Yelp, Nextdoor) and real AI behaviors. Do not give generic advice.
- Return only the JSON object. No preamble. No explanation. No markdown code fences.`;

export async function POST(req: NextRequest) {
  let body: { name?: string; trade?: string; city?: string; email?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, trade, city, email } = body ?? {};
  if (!name || !trade || !city || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API not configured" }, { status: 500 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: `Business Name: ${name}\nTrade: ${trade}\nCity: ${city}`,
        }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown");
      console.error("[free-check] Anthropic error:", errText);
      return NextResponse.json({ error: "Check failed. Please try again." }, { status: 500 });
    }

    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? "";

    // Try direct parse, then extract from string
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          return NextResponse.json({ error: "Check failed. Please try again." }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: "Check failed. Please try again." }, { status: 500 });
      }
    }

    // Persist: every free check becomes a contactable lead + a stored result
    // (best-effort; never blocks the response on failure).
    try {
      const businessId = await upsertBusiness({ name, url: null, trade, city });
      await insertLead({ businessId, email, source: "free_check" });
      const checkId = crypto.randomUUID();
      await insertAuditRow({
        id: checkId,
        businessId,
        intakeId: null,
        tier: "free_check",
        model: MODEL,
        promptVersion: PROMPT_VERSION,
      });
      await completeAudit({ id: checkId, payload: parsed, overallScore: null });
    } catch (persistErr) {
      console.error("[free-check] persistence failed:", persistErr);
    }

    return NextResponse.json(parsed);
  } catch (e) {
    clearTimeout(timeout);
    console.error("[free-check] error:", e);
    return NextResponse.json({ error: "Check failed. Please try again." }, { status: 500 });
  }
}
