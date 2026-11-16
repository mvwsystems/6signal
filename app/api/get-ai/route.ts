import { NextRequest, NextResponse } from "next/server";

// Powers two /get tools: TALK (toolbox talk generator) and BID (RFP pre-score).
// Prompts live here, server side, so the endpoint cannot be used as an open
// proxy: callers pass inputs only, every input is length-capped. Raw fetch,
// same as the other Claude routes. Requires ANTHROPIC_API_KEY.

export const dynamic = "force-dynamic";

const MODEL = process.env.GET_AI_MODEL || "claude-haiku-4-5-20251001";
const cap = (s: unknown, n: number) => String(s ?? "").slice(0, n);

type Body = {
  mode?: string;
  project?: string;
  date?: string;
  incidents?: string;
  activities?: string;
  weather?: string;
  trades?: unknown;
  rfp?: string;
  criteria?: unknown;
};

function talkPrompt(b: Body): string {
  const trades = Array.isArray(b.trades) ? b.trades.slice(0, 20).map((t) => cap(t, 40)).join(", ") : "";
  return `Write a five-minute toolbox talk for ${cap(b.project, 120) || "the project"}, ${cap(b.date, 60)}. Inputs: yesterday's incidents and near misses ${cap(b.incidents, 2000) || "none"}; today's scheduled activities ${cap(b.activities, 2000)}; weather ${cap(b.weather, 200) || "not provided"}; crews on site ${trades || "not provided"}.

Structure: 1 One sentence on what happened yesterday (or the nearest relevant hazard to today's work). 2 Today's top three hazards, specific to the activities and location. 3 Three controls, each one line, who does it. 4 One question to ask the crew. 5 Sign-in line.

Under 220 words. Plain language, eighth-grade reading level, no slogans. Reference the applicable OSHA subpart in brackets at the end of each hazard. Plain text only, no markdown symbols.`;
}

function bidPrompt(b: Body): string {
  const list = Array.isArray(b.criteria) ? (b.criteria as unknown[]).slice(0, 15) : [];
  const crit = list
    .map((c, i) => {
      const [name, weight] = Array.isArray(c) ? c : [c, 0];
      return `${i + 1}. ${cap(name, 120)} (${Number(weight) || 0})`;
    })
    .join("\n");
  return `Attached below is an RFP. Score it against the criteria below (weights in parentheses), 0–5 each, using only what the RFP states. Where the RFP does not say, use null for the score and write "Unknown: not stated in the RFP" as the evidence.

Criteria:
${crit}

Return JSON only, no prose, in exactly this shape, one entry per criterion in the same order:
{"scores":[{"criterion":"...","score":0,"evidence":"short quote or page reference"}],"recommendation":"Pursue | Discuss | Decline","drivers":["...","..."]}

RFP:
"""
${cap(b.rfp, 60000)}
"""`;
}

export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: "Generator not configured" }, { status: 503 });

  let b: Body;
  try {
    b = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let prompt: string;
  let maxTokens: number;
  if (b.mode === "talk") {
    if (!cap(b.activities, 2000).trim()) return NextResponse.json({ error: "activities required" }, { status: 400 });
    prompt = talkPrompt(b);
    maxTokens = 700;
  } else if (b.mode === "bid") {
    if (cap(b.rfp, 300).length < 200) return NextResponse.json({ error: "rfp text too short" }, { status: 400 });
    prompt = bidPrompt(b);
    maxTokens = 2000;
  } else {
    return NextResponse.json({ error: "unknown mode" }, { status: 400 });
  }

  let text = "";
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, temperature: 0.3, messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) {
      console.error("[get-ai] upstream", res.status, await res.text().catch(() => ""));
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }
    const j = (await res.json()) as { content?: { type: string; text?: string }[] };
    text = (j.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n").trim();
  } catch (e) {
    console.error("[get-ai] failed:", e);
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }

  if (b.mode === "talk") return NextResponse.json({ text });
  const m = text.match(/\{[\s\S]*\}/);
  try {
    return NextResponse.json(JSON.parse(m ? m[0] : text));
  } catch {
    return NextResponse.json({ error: "Could not parse scores" }, { status: 502 });
  }
}
