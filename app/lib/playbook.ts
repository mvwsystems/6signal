// Deterministic playbook — the 6 Signal engagement standard as DATA.
//
// The dashboard used to generate plan_tasks from free-form LLM output, which
// produced duplicates, obsolete tasks (e.g. "Create the GBP" for a business
// that already had one), and policy-violating tasks (review gating). This module
// replaces that with a fixed, versioned catalog of task templates that are
// SELECTED against a structured snapshot of the client's real current state.
//
// Selection is a pure function: same state + same version → same task set,
// every time. Each emitted task carries a stable `task_key` so regeneration
// upserts the correct set instead of appending a fresh batch.
//
// The narrative 90-day plan document (content_plan, schema_plan, gbp_plan, …)
// is still written by the model in reports.ts — only the actionable task list
// is made deterministic here.

import type { SiteEvidence } from "./evidence";
import type { LocalLandscape } from "./places";
import type { PlanTaskInput } from "./db";

export const PLAYBOOK_VERSION = "1.0.0";

type Owner = "6Signal" | "Client";
type Signal = "GEO" | "AEO" | "LEO" | "VEO" | "PEO" | "IEO";

// The structured current-state a plan is computed from. Everything here is
// deterministic (site crawl + Google Places), never model-estimated. A field is
// `null` when genuinely unknown (no crawl / no Places key) so templates can
// stay silent instead of asserting a gap that may not exist.
export interface ClientState {
  hasSite: boolean;
  site: SiteEvidence | null;
  gbpFound: boolean | null; // null = unknown (Places unavailable)
  reviews: number | null;
  rating: number | null;
  ranksTop3: boolean | null;
}

export function buildClientState(
  evidence: SiteEvidence | null,
  local: LocalLandscape | null
): ClientState {
  const biz = local?.business ?? null;
  return {
    hasSite: !!evidence && evidence.fetched,
    site: evidence,
    gbpFound: biz ? biz.found === true : local ? false : null,
    reviews: biz && typeof biz.reviews === "number" ? biz.reviews : null,
    rating: biz && typeof biz.rating === "number" ? biz.rating : null,
    ranksTop3: local ? local.businessRanksInTop3 : null,
  };
}

interface Template {
  key: string; // stable task_key — NEVER reword once shipped
  phase: string;
  task: string;
  detail: string;
  owner: Owner;
  signal: Signal | null;
  dueDays: number;
  // Combined precondition + skip-if: return true only when the task genuinely
  // applies to this client's state. Unknown (null) fields must NOT trigger a task.
  applies: (s: ClientState) => boolean;
}

const P1 = "Days 1-30: Foundation";
const P2 = "Days 31-60: Authority";
const P3 = "Days 61-90: Dominance";
const QW = "Quick wins";

// The catalog. Order here is display/priority order.
const TEMPLATES: Template[] = [
  // ── Foundation ────────────────────────────────────────────────────────────
  {
    key: "leo-gbp-create",
    phase: P1, dueDays: 14, owner: "6Signal", signal: "LEO",
    task: "Create and verify the Google Business Profile",
    detail: "No verified profile was found for this business — create and verify it before any other local work.",
    applies: (s) => s.gbpFound === false,
  },
  {
    key: "leo-gbp-optimize",
    phase: P1, dueDays: 21, owner: "6Signal", signal: "LEO",
    task: "Optimize the existing Google Business Profile",
    detail: "Correct categories, service area, hours, phone and address; complete every field. Do not re-create — the profile already exists.",
    applies: (s) => s.gbpFound !== false, // true or unknown
  },
  {
    key: "leo-nap-standardize",
    phase: P1, dueDays: 30, owner: "6Signal", signal: "LEO",
    task: "Standardize NAP across Apple Maps, Bing, Yelp, BBB and data aggregators",
    detail: "Make name, address and phone identical to the canonical profile everywhere; correct any stale value.",
    applies: () => true,
  },
  {
    key: "ieo-schema-localbusiness",
    phase: P1, dueDays: 30, owner: "6Signal", signal: "IEO",
    task: "Add LocalBusiness schema to the website",
    detail: "The site is missing LocalBusiness structured data — add it so AI crawlers can extract NAP, hours and services.",
    applies: (s) => !!s.site && !s.site.has_local_business,
  },
  {
    key: "ieo-robots-unblock",
    phase: P1, dueDays: 21, owner: "6Signal", signal: "IEO",
    task: "Unblock AI crawlers in robots.txt",
    detail: "AI user-agents are currently blocked or not allowed — permit GPTBot, ClaudeBot, PerplexityBot and Google-Extended.",
    applies: (s) => !!s.site && (!s.site.robots_allows_ai || s.site.ai_bots_blocked.length > 0),
  },
  {
    key: "ieo-sitemap",
    phase: P1, dueDays: 30, owner: "6Signal", signal: "IEO",
    task: "Publish or repair the XML sitemap",
    detail: "No valid sitemap was detected — publish one and reference it in robots.txt.",
    applies: (s) => !!s.site && !s.site.sitemap_ok,
  },
  {
    key: "ieo-baseline-crawl",
    phase: P1, dueDays: 14, owner: "6Signal", signal: "IEO",
    task: "Establish the site AI-readiness baseline",
    detail: "No site crawl was available — run the technical AI-readiness crawl (schema, robots, sitemap, structure) to ground the plan.",
    applies: (s) => !s.hasSite,
  },

  // ── Authority ─────────────────────────────────────────────────────────────
  {
    key: "ieo-faq-schema",
    phase: P2, dueDays: 45, owner: "6Signal", signal: "IEO",
    task: "Add FAQPage schema to the service pages",
    detail: "Service pages lack FAQPage structured data — add it to win AI Overview and answer placements.",
    applies: (s) => !!s.site && !s.site.has_faq_schema,
  },
  {
    key: "geo-answer-content",
    phase: P2, dueDays: 50, owner: "6Signal", signal: "GEO",
    task: "Publish answer-optimized content for top buyer questions",
    detail: "Write pages that directly answer the highest-intent buyer questions for this trade and market.",
    applies: () => true,
  },
  {
    key: "aeo-faq-hub",
    phase: P2, dueDays: 55, owner: "6Signal", signal: "AEO",
    task: "Publish an FAQ hub targeting AI Overview questions",
    detail: "Consolidate buyer questions into an answer-first hub structured for Google AI Overviews.",
    applies: () => true,
  },
  {
    key: "leo-review-campaign",
    phase: P2, dueDays: 45, owner: "Client", signal: "LEO",
    task: "Launch a review-generation campaign to all recent customers",
    detail: "Ask every recent customer for a Google review — never a filtered or incentivized subset. Fewer than 25 reviews today.",
    applies: (s) => s.reviews !== null && s.reviews < 25,
  },
  {
    key: "leo-review-replies",
    phase: P2, dueDays: 40, owner: "Client", signal: "LEO",
    task: "Reply to every Google review",
    detail: "Respond to all reviews, positive and negative, in a natural voice — this lifts local trust signals.",
    applies: (s) => s.rating !== null && s.rating < 4.7,
  },

  // ── Dominance ─────────────────────────────────────────────────────────────
  {
    key: "leo-map-pack",
    phase: P3, dueDays: 75, owner: "6Signal", signal: "LEO",
    task: "Improve Map Pack ranking for the core keyword",
    detail: "The business is not ranking in the local top 3 — close the gap with proximity, reviews and on-profile relevance.",
    applies: (s) => s.ranksTop3 === false,
  },
  {
    key: "geo-gbp-cadence",
    phase: P3, dueDays: 80, owner: "6Signal", signal: "GEO",
    task: "Sustain weekly GBP posts and Q&A seeding",
    detail: "Publish one Google Business post per week and seed owner Q&A that mirrors real buyer questions.",
    applies: () => true,
  },
  {
    key: "peo-prompt-tracking",
    phase: P3, dueDays: 85, owner: "6Signal", signal: "PEO",
    task: "Track buyer-question prompts and close the content gaps they reveal",
    detail: "Monitor the real prompts buyers ask AI engines and produce content for the queries where the client is absent.",
    applies: () => true,
  },
  {
    key: "veo-voice-faq",
    phase: P3, dueDays: 88, owner: "6Signal", signal: "VEO",
    task: "Build conversational, voice-ready FAQ answers",
    detail: "Phrase key answers for voice assistants (Siri/Alexa/Google) in natural, spoken-question form.",
    applies: () => true,
  },
  {
    key: "leo-backlinks",
    phase: P3, dueDays: 90, owner: "6Signal", signal: "LEO",
    task: "Earn local backlinks and citations",
    detail: "Build relevant local mentions and links that AI engines treat as trust sources for this market.",
    applies: () => true,
  },

  // ── Quick wins ────────────────────────────────────────────────────────────
  {
    key: "qw-h1",
    phase: QW, dueDays: 14, owner: "6Signal", signal: "IEO",
    task: "Fix the homepage H1",
    detail: "The homepage does not have exactly one H1 — set a single, keyword-clear H1.",
    applies: (s) => !!s.site && s.site.h1_count !== 1,
  },
  {
    key: "qw-meta-description",
    phase: QW, dueDays: 14, owner: "6Signal", signal: "IEO",
    task: "Add a homepage meta description",
    detail: "The homepage is missing a meta description — add a concise, query-relevant one.",
    applies: (s) => !!s.site && !s.site.has_meta_description,
  },
  {
    key: "qw-gbp-media",
    phase: QW, dueDays: 14, owner: "Client", signal: "LEO",
    task: "Capture project and team photos for the profile",
    detail: "Shoot real photos (trucks, team, jobs) for the Google Business Profile and website — no stock imagery.",
    applies: (s) => s.gbpFound !== false,
  },
];

// ── Guardrails ───────────────────────────────────────────────────────────────
// Hard policy rules. The hand-authored templates above are compliant; this lint
// guards any FREE-TEXT task path (a future custom-task UI, or if LLM output is
// ever routed to tasks again). Returns a reason string when a task violates
// policy, or null when it is clean.
const GUARDRAILS: { id: string; test: RegExp; reason: string }[] = [
  { id: "no-review-gating", test: /\b(only\s+)?(happy|satisfied|positive|5[-\s]?star)\s+(customers?|clients?|reviewers?)\b/i, reason: "review gating — solicit ALL customers, not a filtered subset" },
  { id: "no-review-gating-filter", test: /\b(filter|screen|pre[-\s]?qualify)\b.{0,24}\breview/i, reason: "review gating — do not screen who is asked for a review" },
  { id: "no-incentivized-reviews", test: /\b(discount|gift[-\s]?card|coupon|free|prize|\$\s?\d+)\b.{0,28}\breview/i, reason: "incentivized reviews violate Google policy" },
  { id: "no-self-serving-rating", test: /\baggregate[-\s]?rating\b/i, reason: "self-serving review schema on the client's own site risks a manual action" },
];

export function lintTaskText(text: string): string | null {
  const t = text || "";
  for (const g of GUARDRAILS) if (g.test.test(t)) return g.reason;
  return null;
}

function dueDate(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

// Select the deterministic task set for a business. Emits stable task_keys so
// callers can upsert idempotently. Any template that trips a guardrail is
// dropped (defensive — the built-in catalog is clean).
export function selectPlaybookTasks(
  state: ClientState,
  businessId: string,
  auditId: string | null
): PlanTaskInput[] {
  const rows: PlanTaskInput[] = [];
  for (const t of TEMPLATES) {
    if (!t.applies(state)) continue;
    if (lintTaskText(`${t.task} ${t.detail}`)) continue;
    rows.push({
      business_id: businessId,
      plan_audit_id: auditId,
      task_key: t.key,
      playbook_version: PLAYBOOK_VERSION,
      phase: t.phase,
      task: t.task,
      detail: t.detail,
      owner: t.owner,
      signal: t.signal,
      due_date: dueDate(t.dueDays),
    });
  }
  return rows;
}
