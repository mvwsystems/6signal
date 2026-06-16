import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/dashboard-auth";
import { upsertBusiness, listTrackedPrompts, createTrackedPrompts, deactivateTrackedPrompt } from "../../../../lib/db";
import { autocompleteMany, keywordVolume, volumeFor } from "../../../../lib/keywords";
import { runWebGroundedJSON } from "../../../../lib/aiScan";

export const maxDuration = 300;

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

  // Suggest prompts grounded in REAL demand: Google Autocomplete + web "People
  // Also Ask" + (optional) Google Ads search volume. Each suggestion is tagged
  // with its evidence source and volume when available — not model-invented.
  if (body?.suggest) {
    const { name, trade, city } = body as { name?: string; trade?: string; city?: string };
    if (!trade || !city) return NextResponse.json({ error: "trade and city required" }, { status: 400 });

    const seeds = [
      `${trade} ${city}`, `best ${trade} in ${city}`, `${trade} near me ${city}`,
      `emergency ${trade} ${city}`, `affordable ${trade} ${city}`, `${trade} ${city} cost`, `top rated ${trade} ${city}`,
    ];
    const completions = await autocompleteMany(seeds); // real queries people type
    const vol = await keywordVolume([...completions, ...seeds]); // real volume (env-gated)

    const fallback = () => completions.slice(0, 15).map((c) => ({ prompt: c, source: "autocomplete", volume: volumeFor(c, vol) }));
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ suggestions: fallback() });

    const system = `You convert REAL search-demand evidence into natural-language prompts a person would ask an AI assistant (ChatGPT/Perplexity/Gemini) when looking for this service. You are given actual Google Autocomplete completions (real queries people type). ALSO use web_search to find real "People Also Ask" / common questions for this trade + city. Produce conversational prompts grounded ONLY in this evidence — do not invent demand. Return ONLY JSON: { "prompts": [ { "prompt": "...", "source": "autocomplete" | "paa", "basis": "the underlying real query or question" } ] } with up to 15 items.`;
    const user = `Trade: ${trade}\nCity: ${city}${name ? `\nBusiness: ${name}` : ""}\n\nReal Google Autocomplete completions:\n${completions.slice(0, 40).map((c) => `- ${c}`).join("\n") || "(none returned)"}\n\nSearch for additional real questions, then return the JSON.`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 240_000);
    try {
      const parsed = await runWebGroundedJSON({ system, user, maxTokens: 2048, maxSearches: 4, signal: controller.signal });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = Array.isArray((parsed as any).prompts) ? (parsed as any).prompts : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const suggestions = raw.slice(0, 20).map((p: any) => ({
        prompt: String(p.prompt ?? "").trim(),
        source: p.source === "paa" ? "paa" : "autocomplete",
        volume: volumeFor(String(p.basis ?? p.prompt ?? ""), vol),
      })).filter((s: { prompt: string }) => s.prompt);
      return NextResponse.json({ suggestions: suggestions.length ? suggestions : fallback() });
    } catch (e) {
      console.error("[track/prompts] suggest failed:", e);
      return NextResponse.json({ suggestions: fallback() });
    } finally {
      clearTimeout(timer);
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
