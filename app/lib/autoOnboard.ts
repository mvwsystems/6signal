// Auto-onboarding for continuous tracking: the moment a business gets a Battle
// Plan or a 90-Day Plan, seed its tracked prompts from real search demand and
// let the weekly cron take it from there — no manual prompt setup.
//
// Deliberately FAST (runs inline at the end of an already-long report route):
// Google Autocomplete (real queries, free, ~1s) + one Haiku call to convert
// them into conversational AI prompts (~5s, no web search). Best-effort — any
// failure just means prompts get added by hand later.

import { autocompleteMany } from "./keywords";
import { listTrackedPrompts, createTrackedPrompts } from "./db";

const TARGET_PROMPTS = 12;

export async function seedTrackingPrompts(
  businessId: string,
  biz: { name: string; trade: string; city: string }
): Promise<number> {
  try {
    // Idempotent: never duplicate an already-tracked business.
    const existing = await listTrackedPrompts(businessId);
    if (existing.length > 0) return 0;

    const seeds = [
      `${biz.trade} ${biz.city}`,
      `best ${biz.trade} in ${biz.city}`,
      `emergency ${biz.trade} ${biz.city}`,
      `${biz.trade} ${biz.city} cost`,
      `top rated ${biz.trade} ${biz.city}`,
    ];
    const completions = await autocompleteMany(seeds);
    const fallback = completions.slice(0, TARGET_PROMPTS);

    let prompts: string[] = fallback;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && completions.length) {
      const system = `You convert REAL Google Autocomplete completions (actual queries people type) into natural-language prompts a person would ask an AI assistant when looking for this service. Ground every prompt in the given evidence — do not invent demand. Include 2 brand-specific prompts using the business name. Return ONLY JSON: { "prompts": ["...", ...] } with exactly ${TARGET_PROMPTS} items.`;
      const user = `Business: ${biz.name}\nTrade: ${biz.trade}\nCity: ${biz.city}\n\nReal autocomplete completions:\n${completions.slice(0, 40).map((c) => `- ${c}`).join("\n")}`;
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-haiku-4-5", max_tokens: 1024, temperature: 0, system, messages: [{ role: "user", content: user }] }),
        });
        if (res.ok) {
          const data = await res.json();
          const text: string = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
          const m = text.replace(/```json\n?|```\n?/g, "").match(/\{[\s\S]*\}/);
          if (m) {
            const parsed = JSON.parse(m[0]);
            if (Array.isArray(parsed.prompts) && parsed.prompts.length) {
              prompts = parsed.prompts.map(String).slice(0, TARGET_PROMPTS);
            }
          }
        }
      } catch (e) {
        console.error("[autoOnboard] prompt conversion failed, using raw completions:", e);
      }
    }

    if (!prompts.length) return 0;
    const added = await createTrackedPrompts(businessId, prompts);
    if (added) console.log(`[autoOnboard] seeded ${added} tracked prompts for ${biz.name}`);
    return added;
  } catch (e) {
    console.error("[autoOnboard] failed:", e);
    return 0;
  }
}
