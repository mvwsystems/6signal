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
  // Transient 429/5xx/529s were killing whole generations (and the dashboard
  // only saw "failed"); retry those with backoff. 400s stay fatal.
  const RETRYABLE = new Set([429, 500, 502, 503, 529]);

  for (let turn = 0, attempt = 0; turn < 6; ) {
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
      if (RETRYABLE.has(res.status) && attempt < 3) {
        attempt++;
        const retryAfter = Number(res.headers.get("retry-after")) || attempt * 8;
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      throw new Error(`Anthropic ${res.status}: ${t.slice(0, 300)}`);
    }
    const data = (await res.json()) as Resp;
    for (const b of data.content ?? []) if (b.type === "text" && b.text) fullText += b.text;
    if (data.stop_reason === "pause_turn") {
      turn++;
      messages.push({ role: "assistant", content: data.content });
      continue;
    }
    if (data.stop_reason === "max_tokens") {
      throw new Error(`Output truncated at max_tokens (${opts.maxTokens ?? 4096}) — the article did not fit; raise maxTokens.`);
    }
    if (data.stop_reason === "refusal") {
      throw new Error("Model declined the request (refusal).");
    }
    break;
  }

  const m = fullText.replace(/```json\n?|```\n?/g, "").match(/\{[\s\S]*\}/);
  if (!m) throw new Error("No parseable JSON in model output.");
  return JSON.parse(m[0]) as Record<string, unknown>;
}

export const clampScore = (n: unknown): number => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

// Long-running dashboard work must STREAM or Netlify's gateway 504s the browser
// after ~2 minutes of silence (the lambda keeps running — the client just never
// hears back). This wraps a slow job in a heartbeat stream: a whitespace byte
// every few seconds keeps the connection alive, then the final JSON is the only
// non-whitespace content. Clients read the full text, trim, and JSON.parse.
export function streamedJSONResponse(
  work: (signal: AbortSignal) => Promise<Record<string, unknown>>,
  opts?: { timeoutMs?: number; pendingId?: string }
): Response {
  const enc = new TextEncoder();
  const abort = new AbortController();
  // 1KB padding forces intermediary buffers to actually flush — a single space
  // can sit in a proxy buffer forever, which reads as silence and gets killed.
  const HEARTBEAT = " ".repeat(1024);
  const stream = new ReadableStream({
    start(controller) {
      // First line = the pending id. If the connection dies mid-run, the client
      // polls /api/audit/<id> for the persisted result (the lambda keeps going).
      if (opts?.pendingId) {
        try { controller.enqueue(enc.encode(JSON.stringify({ pending: opts.pendingId }) + "\n")); } catch { /* closed */ }
      }
      const timer = setTimeout(() => abort.abort(), opts?.timeoutMs ?? 280_000);
      const heartbeat = setInterval(() => {
        try { controller.enqueue(enc.encode(HEARTBEAT)); } catch { /* stream closed */ }
      }, 4000);
      work(abort.signal)
        .then((result) => controller.enqueue(enc.encode(JSON.stringify(result))))
        .catch((e) => {
          console.error("[streamedJSON] work failed:", e);
          try { controller.enqueue(enc.encode(JSON.stringify({ error: String(e).slice(0, 300) }))); } catch { /* closed */ }
        })
        .finally(() => {
          clearInterval(heartbeat);
          clearTimeout(timer);
          try { controller.close(); } catch { /* closed */ }
        });
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
  });
}
