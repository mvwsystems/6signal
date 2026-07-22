// ─────────────────────────────────────────────────────────────────────────────
// PROOF SYSTEM — 6 Signal
//
// STATUS KEY:
//   "needed"      = placeholder, no real content yet — do not publish
//   "anonymized"  = real finding, client identity removed — ok to publish
//   "example"     = illustrative format only, not a real audit — ok to publish with label
//   "real"        = real client, published with written permission — ok to publish
//
// REPLACING PLACEHOLDERS:
//   1. Change status from "needed" → "real" or "anonymized"
//   2. Fill in all fields
//   3. Remove placeholder copy
//   4. For real clients: confirm written permission before changing status to "real"
//
// See PROOF_NEEDED export at the bottom for a complete checklist.
// ─────────────────────────────────────────────────────────────────────────────

export type ProofStatus = "needed" | "anonymized" | "example" | "real" | "pending-assets";

export interface Testimonial {
  id: string;
  quote: string;
  clientName: string;
  company: string;
  trade: string;
  location: string;
  serviceUsed: string;
  status: ProofStatus;
}

export interface AuditExample {
  id: string;
  trade: string;
  market: string;
  issueFound: string;
  competitorAppearing: string;
  firstFixRecommended: string;
  status: ProofStatus;
  statusLabel: string;
}

export interface BeforeAfterSignal {
  id: string;
  beforeScreenshot: string | null;
  afterScreenshot: string | null;
  whatChanged: string;
  layer: string;
  status: ProofStatus;
}

export interface ClientLogo {
  id: string;
  name: string;
  logoSrc: string | null;
  trade: string;
  status: ProofStatus;
}

export interface CaseStudy {
  id: string;
  trade: string;
  market: string;
  headline: string;
  summary: string;
  results: string[];
  slug: string | null;
  status: ProofStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// PROOF NEEDED: Replace all "needed" entries with real client quotes.
// Best time to ask: after the first 30-day check-in or after 90-day mark.
// Ask for specificity: what they saw in the audit, what changed in the first
// 60–90 days. Generic quotes don't work.
// ─────────────────────────────────────────────────────────────────────────────
export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t-001",
    quote: "PLACEHOLDER — replace with real client quote after first 30-day check-in.",
    clientName: "Client Name",
    company: "Company Name",
    trade: "Roofing",
    location: "DFW, TX",
    serviceUsed: "6 Signal Visibility Retainer",
    status: "needed",
  },
  {
    id: "t-002",
    quote: "PLACEHOLDER — replace with real client quote.",
    clientName: "Client Name",
    company: "Company Name",
    trade: "HVAC",
    location: "Texas",
    serviceUsed: "Visibility Audit",
    status: "needed",
  },
  {
    id: "t-003",
    quote: "PLACEHOLDER — replace with real client quote.",
    clientName: "Client Name",
    company: "Company Name",
    trade: "Plumbing",
    location: "Texas",
    serviceUsed: "6 Signal Visibility Retainer",
    status: "needed",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT EXAMPLES
// These illustrate what the audit process finds. "example" entries are
// format demonstrations — they are NOT real client audits. They show the
// structure and type of finding, not a specific client's situation.
//
// PROOF NEEDED: After each paid audit, ask if you can document the finding
// (anonymized or named). Set status to "anonymized" or "real" when you have
// permission. Take screenshots during/before any remediation work begins.
// ─────────────────────────────────────────────────────────────────────────────
export const AUDIT_EXAMPLES: AuditExample[] = [
  {
    id: "ae-roofing-ai",
    trade: "Roofing",
    market: "Mid-size Texas metro",
    issueFound:
      "No local roofing company appeared when AI was asked for storm damage roofers in the market. A national lead aggregator filled the slot instead.",
    competitorAppearing:
      "HomeAdvisor listing — not a local competitor, but occupying the AI recommendation slot",
    firstFixRecommended:
      "GBP posts targeting storm-specific prompts, service-specific structured data, and answer-ready content for 'storm damage roofer [city]' queries.",
    status: "example",
    statusLabel: "Illustrative — common finding in roofing audits",
  },
  {
    id: "ae-hvac-maps",
    trade: "HVAC",
    market: "Suburban Texas market",
    issueFound:
      "Company appeared in Maps but not in any AI recommendation when asked for emergency AC repair. Two local competitors with more structured GBP data appeared instead.",
    competitorAppearing:
      "Local competitor with 340+ reviews and detailed service descriptions across GBP, Yelp, and HomeAdvisor",
    firstFixRecommended:
      "Emergency-service GBP attributes, service-specific schema markup, and answer-targeted content for 'emergency AC repair [city]' queries.",
    status: "example",
    statusLabel: "Illustrative — common finding in HVAC audits",
  },
  {
    id: "ae-plumbing-entity",
    trade: "Plumbing",
    market: "DFW metro",
    issueFound:
      "Three different phone numbers for the same company across Yelp, HomeAdvisor, and GBP. AI tools citing inconsistent entity data when asked about the company.",
    competitorAppearing:
      "Competitor with clean NAP consistency across all major directories appearing ahead in local pack and AI recommendations",
    firstFixRecommended:
      "Full entity cleanup — reconcile name, address, phone, and service area across all directory listings. Suppress duplicate entries.",
    status: "example",
    statusLabel: "Illustrative — entity inconsistency finding",
  },
  {
    id: "ae-electrical-voice",
    trade: "Electrical",
    market: "Texas suburban market",
    issueFound:
      "Voice search (Siri, Alexa) returned no result for 'licensed electrician near me' within the company's service area. Siri redirected to a competitor three cities away.",
    competitorAppearing:
      "Out-of-area competitor with voice-optimized GBP and structured service area data",
    firstFixRecommended:
      "Service area schema, Apple Maps listing verification, and structured data for licensed electrical services to improve voice-query matching.",
    status: "example",
    statusLabel: "Illustrative — voice search finding",
  },
  {
    id: "ae-commercial-schema",
    trade: "Commercial Contracting",
    market: "Texas commercial market",
    issueFound:
      "Company website had no structured data for commercial services, project types, bonding capacity, or service area. AI tools described the company using residential contractor language.",
    competitorAppearing:
      "Regional competitor with dedicated commercial service pages, structured capability schema, and D&B record",
    firstFixRecommended:
      "Commercial-specific service pages with structured schema, project-type schema, GBP commercial category optimization, and D&B record accuracy review.",
    status: "example",
    statusLabel: "Illustrative — commercial visibility finding",
  },
  {
    id: "ae-remodeling-reviews",
    trade: "Remodeling",
    market: "DFW metro",
    issueFound:
      "95% of reviews mentioned painting and small repairs. Company primarily does full kitchen and bathroom remodels. AI tools recommending them for handyman work, not remodels.",
    competitorAppearing:
      "Local remodeler with kitchen- and bathroom-specific review language and service-category schema",
    firstFixRecommended:
      "Review response strategy to reinforce remodel focus, service-specific GBP categories, and landing page content targeting remodel-specific queries.",
    status: "example",
    statusLabel: "Illustrative — review signal misalignment finding",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BEFORE/AFTER SIGNALS
// PROOF NEEDED: Screenshot the exact AI prompt and response BEFORE any work
// begins. Same screenshot 60–90 days later. Document the prompt exactly.
// No claims about rankings or leads — only show what AI says before vs. after.
// ─────────────────────────────────────────────────────────────────────────────
export const BEFORE_AFTER_SIGNALS: BeforeAfterSignal[] = [
  {
    id: "ba-001",
    beforeScreenshot: null,
    afterScreenshot: null,
    whatChanged:
      "PLACEHOLDER — Document ChatGPT recommendation response for '[trade] in [city]' before retainer work begins. Screenshot again after 60 days.",
    layer: "GEO",
    status: "needed",
  },
  {
    id: "ba-002",
    beforeScreenshot: null,
    afterScreenshot: null,
    whatChanged:
      "PLACEHOLDER — Document Maps listing accuracy before entity cleanup. Screenshot after cleanup is complete.",
    layer: "LEO",
    status: "needed",
  },
  {
    id: "ba-003",
    beforeScreenshot: null,
    afterScreenshot: null,
    whatChanged:
      "PLACEHOLDER — Document Google AI Overview response for key trade+city query before and after AEO work.",
    layer: "AEO",
    status: "needed",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT LOGOS
// PROOF NEEDED: Request from each client after onboarding.
// Format: white or light-color SVG preferred, PNG acceptable.
// Always confirm written permission before publishing.
// ─────────────────────────────────────────────────────────────────────────────
export const CLIENT_LOGOS: ClientLogo[] = [
  { id: "logo-001", name: "Client Company", logoSrc: null, trade: "Roofing", status: "needed" },
  { id: "logo-002", name: "Client Company", logoSrc: null, trade: "HVAC", status: "needed" },
  { id: "logo-003", name: "Client Company", logoSrc: null, trade: "Plumbing", status: "needed" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CASE STUDIES
// PROOF NEEDED: Document after 90+ days of retainer work.
// Required: starting audit findings, specific work done, measurable outcomes
// the client can verify. Written permission to publish.
// Never claim results you cannot attribute and verify directly.
// ─────────────────────────────────────────────────────────────────────────────
export const CASE_STUDIES: CaseStudy[] = [
  {
    // STATUS: real — published with client permission (Daniel Clayburn / X-Act
    // Plumbing, relayed by owner 2026-07-21; recommend confirming in writing).
    //
    // EVIDENCE: every number below comes from 6 Signal's own tracking system
    // (Supabase probe_results + maps_grid_scans, business 2ddd7f9c…) — 629
    // automated checks of 12 real buyer prompts across six engines, run daily
    // 2026-07-07 → 2026-07-20, plus 25-point Maps grid scans (2026-07-13/16).
    //
    // NOT PUBLISHED (owner-reported but not supported by tracking data — do not
    // re-add without direct evidence):
    //   - "Google AI Overview citations" — tracked at 0/72 checks in this window
    //   - "Map Pack top 3" — grid scans show avg position ~5.5, top-3 at ≤1/25 points
    //   - "Organic page 2 → top 3" — no ranking data collected
    //   - "in 3 weeks" — tracking began 2026-07-07; no before-baseline exists
    id: "cs-xact-plumbing",
    trade: "Plumbing",
    market: "Red Oak / DFW, TX",
    headline: "X-Act Plumbing: named in the answers when Red Oak asks AI for a plumber",
    summary:
      "6 Signal's tracking system ran 629 automated checks of 12 real buyer questions ('Who is the best plumber in Red Oak, TX?', 'I have a burst pipe — who can come out fast?') across six AI engines, daily, July 7–20, 2026. X-Act Plumbing was named in 92% of Gemini checks, 71% of ChatGPT checks, and 68% of Perplexity checks — and appeared in Google Maps results at all 25 points of a market-wide grid scan for 'best plumber red oak tx'. Published with client permission.",
    results: [
      "Gemini: named in 92% of tracked recommendation checks (103 of 112)",
      "ChatGPT: named in 71% of tracked recommendation checks (60 of 84)",
      "Perplexity: named in 68% of tracked recommendation checks (87 of 128)",
      "Google Maps: present at 25 of 25 grid points across the Red Oak market for 'best plumber red oak tx', average position ~5.5",
      "Method: 12 real buyer prompts, checked daily across six engines — 629 checks, July 7–20, 2026",
    ],
    slug: null,
    status: "real",
  },
  {
    id: "cs-001",
    trade: "Roofing",
    market: "DFW",
    headline: "PLACEHOLDER — Document after 90 days of retainer work",
    summary:
      "Starting position from the audit, specific work completed across six layers, what measurably changed — with client permission to publish.",
    results: [],
    slug: null,
    status: "needed",
  },
  {
    id: "cs-002",
    trade: "HVAC",
    market: "Texas",
    headline: "PLACEHOLDER — Document after 90 days of retainer work",
    summary:
      "Starting position from the audit, specific work completed across six layers, what measurably changed — with client permission to publish.",
    results: [],
    slug: null,
    status: "needed",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROOF WE NEED TO ADD
// Keep this current. Use it as a checklist before each quarterly review.
// ─────────────────────────────────────────────────────────────────────────────
export const PROOF_NEEDED = {
  summary: "6 Signal is a new practice. All proof sections currently use illustrative examples or placeholders. Replace as real client relationships develop.",

  testimonials: {
    haveReal: TESTIMONIALS.filter((t) => t.status === "real").length,
    target: 3,
    howToGet:
      "Ask retainer clients for a specific quote after the first 30-day check-in. Ask two things: (1) What did you see in the audit that surprised you? (2) What's changed in the first 60–90 days? Generic 'great to work with' quotes are not useful.",
    placeholdersActive: TESTIMONIALS.filter((t) => t.status === "needed").length,
  },

  auditExamples: {
    realOrAnonymized: AUDIT_EXAMPLES.filter(
      (a) => a.status === "real" || a.status === "anonymized"
    ).length,
    illustrativeOnly: AUDIT_EXAMPLES.filter((a) => a.status === "example").length,
    howToGet:
      "After each paid audit, ask the client if you can document what was found — anonymized (no company name, general market description) or named. Take screenshots before any remediation work begins.",
    note: "Current entries are illustrative format examples only — they demonstrate audit methodology but are not real client findings.",
  },

  beforeAfter: {
    haveReal: BEFORE_AFTER_SIGNALS.filter((b) => b.status === "real").length,
    howToGet:
      "Standard process: screenshot the AI prompt response for key queries at the start of every retainer. Screenshot the same queries at 30, 60, and 90 days. Document the exact prompt used so the comparison is apples-to-apples.",
    assetsNeeded: [
      "ChatGPT: '[trade] in [city]' recommendation response — before",
      "ChatGPT: '[trade] in [city]' recommendation response — after 60 days",
      "Perplexity: same query before/after",
      "Google AI Overview: '[trade] near me' before/after",
      "Google Maps: business listing before entity cleanup",
      "Google Maps: same listing after cleanup",
      "Voice query result (Siri/Alexa) before/after where applicable",
    ],
  },

  clientLogos: {
    haveReal: CLIENT_LOGOS.filter((l) => l.status === "real").length,
    howToGet:
      "Request at onboarding. Ask for: white or transparent-background SVG (preferred) or PNG at 2x. Confirm written permission to display on site before publishing.",
  },

  caseStudies: {
    haveReal: CASE_STUDIES.filter((c) => c.status === "real" || c.status === "anonymized").length,
    minRetainerDays: 90,
    howToGet:
      "After 90 days. Document: (1) what the starting audit found, (2) specific tasks completed in each layer, (3) measurable outcomes the client can verify — calls they tracked, Maps position changes they observed, AI responses they can screenshot. Never claim results you cannot directly attribute and verify.",
    template: {
      startingPosition: "Exact audit findings before any work began",
      workDone: "Specific tasks in each of the six layers (GEO, PEO, AEO, IEO, LEO, VEO)",
      outcomes: "Measurable changes verified by the client — not assumed, not extrapolated",
      permission: "Written or recorded confirmation to publish, naming or anonymized",
    },
  },

  assetsToGatherFromClients: [
    "Headshot or team photo (for testimonial attribution)",
    "Company logo — white/transparent SVG or PNG",
    "Written quote with permission to publish",
    "Screenshots from the client's own devices showing Maps, AI results — before and after",
    "Any inbound lead data they're willing to share (call volume, form submissions)",
    "Specific language they use about what changed — their words, not paraphrased",
  ],
};
