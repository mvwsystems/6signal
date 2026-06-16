// Shared web-search-grounded JSON runner for the internal dashboard tools
// (quick scan, battle plan, 90-day execution plan). Calls Claude Opus 4.8 with
// the server-side web_search tool, handles the pause_turn resume loop, and
// returns the parsed JSON object from the model's final text.
//
// Raw fetch to match the rest of the repo (no @anthropic-ai SDK).

export const SCAN_MODEL = "claude-opus-4-8";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Msg = { role: "user" | "assistant"; content: any };
interface Block { type: string; text?: string }
interface Resp { content?: Block[]; stop_reason?: string }

export async function runWebGroundedJSON(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  maxSearches?: number;
  signal?: AbortSignal;
}): Promise<Record<string, unknown>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");

  const messages: Msg[] = [{ role: "user", content: opts.user }];
  let fullText = "";

  for (let turn = 0; turn < 6; turn++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: SCAN_MODEL,
        max_tokens: opts.maxTokens ?? 4096,
        thinking: { type: "disabled" },
        system: opts.system,
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: opts.maxSearches ?? 5 }],
        messages,
      }),
      signal: opts.signal,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Anthropic ${res.status}: ${t.slice(0, 300)}`);
    }
    const data = (await res.json()) as Resp;
    for (const b of data.content ?? []) if (b.type === "text" && b.text) fullText += b.text;
    if (data.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: data.content });
      continue;
    }
    break;
  }

  const m = fullText.replace(/```json\n?|```\n?/g, "").match(/\{[\s\S]*\}/);
  if (!m) throw new Error("No parseable JSON in model output.");
  return JSON.parse(m[0]) as Record<string, unknown>;
}

export const clampScore = (n: unknown): number => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
