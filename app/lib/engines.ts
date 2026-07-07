// Multi-engine AI-visibility probing. For a buyer-question prompt, get each AI
// engine's REAL web-grounded answer + cited sources, then use Claude (cheap) to
// judge whether the business is named, where, sentiment, and which competitors
// appear. Raw fetch per provider (matches the repo's no-SDK Claude pattern).
//
// Engine answers are live and non-deterministic — we store the raw answer +
// timestamp per probe so a result is reproducible-as-recorded, not re-runnable.

export type Engine = "chatgpt" | "claude" | "perplexity" | "gemini" | "google-ai" | "maps";
export const ENGINES: Engine[] = ["chatgpt", "claude", "perplexity", "gemini", "google-ai", "maps"];

export interface EngineAnswer {
  engine: Engine;
  ok: boolean;
  text: string;
  sources: string[];
  error?: string;
}

export interface Verdict {
  mentioned: boolean;
  position: number | null; // rank in the answer when mentioned (1 = first)
  sentiment: "positive" | "neutral" | "negative" | null;
  competitors: string[];
}

function keyFor(engine: Engine): string | undefined {
  if (engine === "chatgpt") return process.env.OPENAI_API_KEY?.trim();
  if (engine === "claude") return process.env.ANTHROPIC_API_KEY?.trim();
  if (engine === "perplexity") return process.env.PERPLEXITY_API_KEY?.trim();
  if (engine === "gemini") return process.env.GEMINI_API_KEY?.trim();
  if (engine === "google-ai") return process.env.SERPAPI_KEY?.trim();
  return process.env.GOOGLE_PLACES_API_KEY?.trim(); // maps
}

export function enginesWithKeys(): Engine[] {
  return ENGINES.filter((e) => keyFor(e));
}

// ── Per-engine probes ────────────────────────────────────────────────────────
async function openAIOnce(prompt: string, key: string, model: string, signal?: AbortSignal): Promise<{ ok: boolean; status: number; errText: string; text: string; sources: string[] }> {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, tools: [{ type: "web_search" }], input: prompt, include: ["web_search_call.action.sources"] }),
    signal,
  });
  if (!res.ok) return { ok: false, status: res.status, errText: (await res.text().catch(() => "")).slice(0, 300), text: "", sources: [] };
  const data = await res.json();
  let text = "";
  const sources: string[] = [];
  for (const item of data.output ?? []) {
    if (item.type === "message") {
      for (const c of item.content ?? []) {
        if (c.type === "output_text" && c.text) text += c.text;
        for (const a of c.annotations ?? []) if (a.type === "url_citation" && a.url) sources.push(a.url);
      }
    }
    if (item.type === "web_search_call") for (const s of item.action?.sources ?? []) if (s.url) sources.push(s.url);
  }
  return { ok: true, status: 200, errText: "", text, sources };
}

async function probeOpenAI(prompt: string, key: string, signal?: AbortSignal): Promise<EngineAnswer> {
  const primary = process.env.OPENAI_MODEL?.trim() || "gpt-5.5";
  let r = await openAIOnce(prompt, key, primary, signal);
  // Model not available on this account → fall back to the stable workhorse.
  if (!r.ok && (r.status === 404 || /model/i.test(r.errText))) {
    r = await openAIOnce(prompt, key, "gpt-4.1", signal);
  }
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${r.errText}`);
  return { engine: "chatgpt", ok: true, text: r.text, sources: dedupe(r.sources) };
}

async function probeClaude(prompt: string, key: string, signal?: AbortSignal): Promise<EngineAnswer> {
  const model = process.env.CLAUDE_ENGINE_MODEL?.trim() || "claude-sonnet-4-6";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
      messages: [{ role: "user", content: prompt }],
    }),
    signal,
  });
  if (!res.ok) throw new Error(`Claude ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json();
  let text = "";
  const sources: string[] = [];
  for (const block of data.content ?? []) {
    if (block.type === "text" && block.text) text += block.text;
    if (block.type === "web_search_tool_result") {
      for (const r of block.content ?? []) if (r.url) sources.push(r.url);
    }
  }
  return { engine: "claude", ok: true, text, sources: dedupe(sources) };
}

// Google AI Overviews via SerpAPI: the actual AI Overview block Google shows
// for this query (env-gated by SERPAPI_KEY). "No AI Overview" is itself a
// meaningful answer — nobody is being named there.
async function probeGoogleAI(prompt: string, key: string, signal?: AbortSignal): Promise<EngineAnswer> {
  const params = new URLSearchParams({ engine: "google", q: prompt, api_key: key, gl: "us", hl: "en" });
  const res = await fetch(`https://serpapi.com/search.json?${params}`, { signal });
  if (!res.ok) throw new Error(`SerpAPI ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json();
  const ai = data.ai_overview;
  if (!ai || (!ai.text_blocks && !ai.answer)) {
    return { engine: "google-ai", ok: true, text: "No AI Overview appeared for this query.", sources: [] };
  }
  const parts: string[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    if (typeof n.snippet === "string") parts.push(n.snippet);
    if (typeof n.answer === "string") parts.push(n.answer);
    if (typeof n.title === "string" && n.snippet) parts.push(String(n.title));
    for (const v of Object.values(n)) if (Array.isArray(v)) v.forEach(walk);
  };
  walk(ai);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sources = ((ai.references ?? []) as any[]).map((r) => r.link).filter(Boolean);
  return { engine: "google-ai", ok: true, text: parts.join("\n").slice(0, 6000) || "AI Overview present but empty.", sources: dedupe(sources) };
}

// Google Maps ranking via the existing Places key: the ranked local results a
// buyer sees for this query. The judge reads the ordered list for position.
async function probeMaps(prompt: string, signal?: AbortSignal): Promise<EngineAnswer> {
  void signal;
  const { placesTextSearch } = await import("./places");
  const results = await placesTextSearch(prompt, 10);
  if (!results.length) return { engine: "maps", ok: true, text: "No Google Maps results for this query.", sources: [] };
  const lines = results.map((p, i) => {
    const name = p.displayName?.text ?? "?";
    const rating = typeof p.rating === "number" ? `${p.rating}★` : "no rating";
    const reviews = typeof p.userRatingCount === "number" ? `${p.userRatingCount} reviews` : "";
    return `${i + 1}. ${name} — ${rating}${reviews ? ` (${reviews})` : ""}`;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sources = results.map((p: any) => p.googleMapsUri).filter(Boolean);
  return { engine: "maps", ok: true, text: `Google Maps results for this query, in ranked order:\n${lines.join("\n")}`, sources: dedupe(sources) };
}

async function probePerplexity(prompt: string, key: string, signal?: AbortSignal): Promise<EngineAnswer> {
  const model = process.env.PERPLEXITY_MODEL?.trim() || "sonar";
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, temperature: 0, messages: [{ role: "user", content: prompt }], web_search_options: { search_context_size: "low" } }),
    signal,
  });
  if (!res.ok) throw new Error(`Perplexity ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sources = (data.search_results ?? []).map((s: any) => s.url).filter(Boolean).concat(data.citations ?? []);
  return { engine: "perplexity", ok: true, text, sources: dedupe(sources) };
}

async function probeGemini(prompt: string, key: string, signal?: AbortSignal): Promise<EngineAnswer> {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], tools: [{ google_search: {} }] }),
    signal,
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  const data = await res.json();
  const cand = data.candidates?.[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (cand?.content?.parts ?? []).map((p: any) => p.text).filter(Boolean).join("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sources = (cand?.groundingMetadata?.groundingChunks ?? []).map((c: any) => c.web?.uri).filter(Boolean);
  return { engine: "gemini", ok: true, text, sources: dedupe(sources) };
}

function dedupe(a: string[]): string[] { return Array.from(new Set(a)); }

export async function probeEngine(engine: Engine, prompt: string, signal?: AbortSignal): Promise<EngineAnswer> {
  const key = keyFor(engine);
  if (!key) return { engine, ok: false, text: "", sources: [], error: "no API key" };
  try {
    if (engine === "chatgpt") return await probeOpenAI(prompt, key, signal);
    if (engine === "claude") return await probeClaude(prompt, key, signal);
    if (engine === "perplexity") return await probePerplexity(prompt, key, signal);
    if (engine === "gemini") return await probeGemini(prompt, key, signal);
    if (engine === "google-ai") return await probeGoogleAI(prompt, key, signal);
    return await probeMaps(prompt, signal);
  } catch (e) {
    console.error(`[engines] ${engine} probe failed:`, e);
    return { engine, ok: false, text: "", sources: [], error: String(e).slice(0, 300) };
  }
}

export async function probeAllEngines(prompt: string, signal?: AbortSignal): Promise<EngineAnswer[]> {
  return Promise.all(ENGINES.map((e) => probeEngine(e, prompt, signal)));
}

// ── Claude-based judgment of each engine's answer ────────────────────────────
const ANALYZE_SYSTEM = `You judge AI-engine answers for brand visibility. Given a business and an AI engine's answer to a buyer question, decide, for EACH engine answer: is the business explicitly named/recommended? If so, its rank among named providers (1 = listed first). The sentiment toward the business if named. And the names of competing businesses the answer recommends. Be strict — only "mentioned" if the business name actually appears. Return ONLY JSON, no prose:
{ "results": { "<engine>": { "mentioned": false, "position": null, "sentiment": null, "competitors": [] } } }
sentiment is one of "positive" | "neutral" | "negative" | null. position is an integer or null.`;

export async function analyzePrompt(
  business: { name: string; trade: string; city: string },
  prompt: string,
  answers: EngineAnswer[],
  signal?: AbortSignal
): Promise<Record<Engine, Verdict>> {
  const fallback = (): Record<Engine, Verdict> => {
    const o = {} as Record<Engine, Verdict>;
    for (const e of ENGINES) o[e] = { mentioned: false, position: null, sentiment: null, competitors: [] };
    return o;
  };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const usable = answers.filter((a) => a.ok && a.text);
  if (!apiKey || usable.length === 0) return fallback();

  const block = usable.map((a) => `### ${a.engine} answer:\n${a.text.slice(0, 4000)}`).join("\n\n");
  const user = `Business: ${business.name} (${business.trade} in ${business.city})
Buyer question asked to each engine: "${prompt}"

${block}

For each engine answer above, judge whether ${business.name} is named. Return the JSON.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5", max_tokens: 1024, temperature: 0, system: ANALYZE_SYSTEM, messages: [{ role: "user", content: user }] }),
      signal,
    });
    if (!res.ok) return fallback();
    const data = await res.json();
    const text: string = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
    const m = text.replace(/```json\n?|```\n?/g, "").match(/\{[\s\S]*\}/);
    if (!m) return fallback();
    const parsed = JSON.parse(m[0]);
    const results = parsed.results ?? {};
    const out = fallback();
    for (const e of ENGINES) {
      const r = results[e];
      if (r) out[e] = {
        mentioned: r.mentioned === true,
        position: Number.isFinite(Number(r.position)) ? Number(r.position) : null,
        sentiment: ["positive", "neutral", "negative"].includes(r.sentiment) ? r.sentiment : null,
        competitors: Array.isArray(r.competitors) ? r.competitors.map(String).slice(0, 8) : [],
      };
    }
    return out;
  } catch (e) {
    console.error("[engines] analyzePrompt failed:", e);
    return fallback();
  }
}
