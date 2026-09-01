import { NextRequest, NextResponse } from "next/server";

// Generates the trade-specific website questionnaire for /start.
// Claude builds the question set live from the prospect's trade; if the API
// is unavailable for any reason, a solid generic fallback ships instead —
// the flow never dead-ends.

export const maxDuration = 60;

interface Question {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
  required?: boolean;
}
interface Section {
  title: string;
  questions: Question[];
}

const FALLBACK: Section[] = [
  {
    title: "The Business",
    questions: [
      { id: "current_site", label: "Current website (if any)", type: "text", placeholder: "https://yourbusiness.com — or 'none'" },
      { id: "services", label: "Every service you offer — flagship first", type: "textarea", required: true, placeholder: "The one you want to be known for, then the rest." },
      { id: "service_area", label: "Service area — cities/counties you actually work", type: "text", required: true, placeholder: "e.g., Fort Worth, Arlington, and 30 miles around" },
      { id: "story", label: "The company story — how it started, years in business, who runs it", type: "textarea", placeholder: "Plain words. We'll write the polish." },
      { id: "differentiator", label: "Why do customers pick you over the next name on the list?", type: "textarea", placeholder: "What do repeat customers say about you?" },
    ],
  },
  {
    title: "Proof & Trust",
    questions: [
      { id: "licenses", label: "Licenses, certifications, insurance, associations", type: "textarea", placeholder: "License numbers welcome — they build trust and help AI verify you." },
      { id: "reviews", label: "Where do your reviews live, and roughly how many?", type: "text", placeholder: "e.g., Google (120), Yelp (15)" },
      { id: "photos", label: "Do you have real project photos we can use?", type: "select", options: ["Yes, plenty", "Some — need to gather", "Very few or none"] },
      { id: "projects", label: "2–3 jobs you're proud of — what, where, outcome", type: "textarea" },
    ],
  },
  {
    title: "Brand & Style",
    questions: [
      { id: "logo", label: "Do you have a logo?", type: "select", options: ["Yes — good quality file", "Yes — but it's rough", "No logo yet"] },
      { id: "style", label: "Websites you like the look of (any industry)", type: "textarea", placeholder: "Links or names — and what you like about them." },
      { id: "tone", label: "How should the site sound?", type: "select", options: ["Straight and professional", "Friendly and local", "Premium and upscale", "Not sure — you decide"] },
    ],
  },
  {
    title: "Logistics",
    questions: [
      { id: "cta", label: "What should visitors do first?", type: "select", options: ["Call", "Request a quote (form)", "Book online", "Text"] },
      { id: "emergency", label: "Do you offer emergency / same-day service?", type: "select", options: ["Yes — 24/7", "Yes — business hours", "No"] },
      { id: "competitors", label: "Competitors whose web presence you envy (or hate)", type: "text" },
      { id: "anything", label: "Anything else we should know?", type: "textarea" },
    ],
  },
];

// The system prompt asks for at most 5 required questions; the model does not
// always obey it. A Custom Home Builder set came back with 14 of 30 required,
// which turns one submit click into a wall of validation and reads to the
// prospect as a broken button. Keep the first few, make the rest optional —
// an answered-later field is worth more than an abandoned questionnaire.
const MAX_REQUIRED = 5;

function capRequired(sections: Section[]): Section[] {
  let budget = MAX_REQUIRED;
  return sections.map((s) => ({
    ...s,
    questions: (s.questions ?? []).map((q) => {
      if (!q.required) return q;
      if (budget > 0) { budget -= 1; return q; }
      return { ...q, required: false };
    }),
  }));
}

export async function POST(req: NextRequest) {
  let body: { trade?: string; company?: string; currentSite?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const trade = body?.trade?.trim() || "general contracting";
  const company = body?.company?.trim() || "the company";
  const currentSite = body?.currentSite?.trim() || "";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 4000,
          temperature: 0.2,
          system: `You design website-intake questionnaires for 6Signal, a premium web studio for contractors. Given a trade, produce the question set whose answers let a developer build an upscale, conversion-focused, AI-visibility-ready website WITHOUT further back-and-forth.

Return ONLY JSON: {"sections":[{"title":"...","questions":[{"id":"snake_case","label":"...","type":"text"|"textarea"|"select","options":["..."] (select only),"placeholder":"..." (optional),"required":true (only for truly essential — max 5 total)}]}]}

Rules:
- 18–24 questions across 4–6 sections. Plain contractor language, no marketing jargon.
- MUST cover: current website URL; full service list with flagship; service area; company story/years/owner; differentiators; licenses+certifications+insurance; reviews (where + how many); project photo availability; 2–3 proud projects; logo status; style preferences; tone; primary CTA preference; emergency/same-day if relevant to the trade; competitors; final catch-all.
- PLUS one section of 4–6 questions specific to the ${trade} trade — the details that make a ${trade} website credible and complete (equipment, brands carried, warranties, financing, specific high-value services, seasonal work — whatever fits THIS trade).
- Placeholders should coach the answer ("License numbers welcome — they build trust").
- No questions about budget or price. No email/phone/name (already collected).`,
          messages: [
            {
              role: "user",
              content: `Trade: ${trade}\nCompany: ${company}\n${currentSite ? `Current website: ${currentSite} — already collected, do NOT ask for it. They have an existing site, so ask what they want kept, changed, or killed from it instead.` : "No current website provided."}\n\nGenerate the questionnaire JSON now.`,
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text: string = (data.content ?? [])
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("");
        const m = text.replace(/```json\n?|```\n?/g, "").match(/\{[\s\S]*\}/);
        if (m) {
          const parsed = JSON.parse(m[0]);
          if (Array.isArray(parsed?.sections) && parsed.sections.length > 0) {
            return NextResponse.json({ sections: capRequired(parsed.sections), generated: true });
          }
        }
      }
    } catch (e) {
      console.error("[website-questions] generation failed, using fallback:", e);
    }
  }

  return NextResponse.json({ sections: FALLBACK, generated: false });
}
