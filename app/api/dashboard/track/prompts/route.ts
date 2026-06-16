import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/dashboard-auth";
import { upsertBusiness, listTrackedPrompts, createTrackedPrompts, deactivateTrackedPrompt } from "../../../../lib/db";

export const maxDuration = 60;

// GET  ?businessId=  → active tracked prompts
// POST { suggest:true, name, trade, city }            → AI-suggested starter prompts (not saved)
// POST { businessId?, name?, url?, trade?, city?, prompts:[...] } → save prompts (upserts business if needed)
// DELETE ?id=        → deactivate a prompt

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
  return NextResponse.json({ prompts: await listTrackedPrompts(businessId) });
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deactivateTrackedPrompt(id);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: Record<string, unknown> | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Suggest starter prompts (buyer questions) for a trade + city.
  if (body?.suggest) {
    const { name, trade, city } = body as { name?: string; trade?: string; city?: string };
    if (!trade || !city) return NextResponse.json({ error: "trade and city required" }, { status: 400 });
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ suggestions: [] });
    const system = `Generate natural-language buyer questions a potential customer would type into an AI assistant (ChatGPT/Perplexity/Gemini) when looking for this kind of business. Mix: a few brand-specific, several "best <trade> in <city>" category queries, several problem→solution queries, and a couple comparison queries. Real phrasing, not keywords. Return ONLY JSON: { "prompts": ["...", "..."] } with 15 items.`;
    const user = `Trade: ${trade}\nCity: ${city}${name ? `\nBusiness (for the brand-specific ones): ${name}` : ""}`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-haiku-4-5", max_tokens: 1024, temperature: 0, system, messages: [{ role: "user", content: user }] }),
      });
      if (!res.ok) return NextResponse.json({ suggestions: [] });
      const data = await res.json();
      const text: string = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
      const m = text.replace(/```json\n?|```\n?/g, "").match(/\{[\s\S]*\}/);
      const parsed = m ? JSON.parse(m[0]) : { prompts: [] };
      return NextResponse.json({ suggestions: Array.isArray(parsed.prompts) ? parsed.prompts.map(String).slice(0, 20) : [] });
    } catch {
      return NextResponse.json({ suggestions: [] });
    }
  }

  // Save prompts.
  const { prompts } = body as { prompts?: string[] };
  let businessId = (body as { businessId?: string }).businessId;
  if (!Array.isArray(prompts) || prompts.length === 0) return NextResponse.json({ error: "prompts required" }, { status: 400 });
  if (!businessId) {
    const { name, url, trade, city } = body as { name?: string; url?: string; trade?: string; city?: string };
    if (!name || !trade || !city) return NextResponse.json({ error: "businessId or (name, trade, city) required" }, { status: 400 });
    businessId = (await upsertBusiness({ name, url: url ?? null, trade, city })) ?? undefined;
  }
  if (!businessId) return NextResponse.json({ error: "Could not resolve business (persistence off?)" }, { status: 503 });
  const added = await createTrackedPrompts(businessId, prompts);
  return NextResponse.json({ ok: true, businessId, added });
}
