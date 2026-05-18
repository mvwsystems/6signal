export type ToolFunding = {
  amount?: string;
  series?: string;
  leadInvestor?: string;
  founder?: string;
  notes?: string;
};

export type AIVisibilityTool = {
  name: string;
  website?: string;
  entryPricing?: string;
  category: string;
  bestFor: string[];
  aeoFeatures: string[];
  modelsTracked: string[];
  otherFeatures?: string[];
  funding?: ToolFunding;
  notes?: string;
  lastVerified?: string;
};

export const AI_VISIBILITY_TOOLS: AIVisibilityTool[] = [
  {
    name: "AEO Checker",
    website: "aeochecker.com",
    entryPricing: "Free",
    category: "Free / Lightweight Checkers",
    bestFor: ["Solo operators", "Quick manual checks", "First-time visibility testing"],
    aeoFeatures: [
      "Basic brand visibility check",
      "Manual prompt testing",
      "Single-query snapshots",
    ],
    modelsTracked: ["ChatGPT", "Perplexity"],
    otherFeatures: ["No account required for basic use"],
    notes:
      "Useful for a quick sanity check. Not a replacement for ongoing tracking. Limited model coverage and no historical data.",
    lastVerified: "May 2026",
  },
  {
    name: "HubSpot AI Search Grader",
    website: "hubspot.com/ai-search-grader",
    entryPricing: "Free",
    category: "Free / Lightweight Checkers",
    bestFor: ["Marketing teams", "Brand awareness check", "One-time baseline"],
    aeoFeatures: [
      "Brand appearance score",
      "ChatGPT visibility check",
      "Basic sentiment indicator",
    ],
    modelsTracked: ["ChatGPT"],
    otherFeatures: ["No ongoing tracking", "Single snapshot per query"],
    notes:
      "A lightweight entry point, not an ongoing monitoring tool. Useful for understanding whether your brand surfaces at all. Single model only.",
    lastVerified: "May 2026",
  },
  {
    name: "Profound",
    website: "withprofound.com",
    entryPricing: "Not publicly listed — enterprise pricing, contact for quote",
    category: "Enterprise Platforms",
    bestFor: ["Enterprise marketing teams", "Multi-brand organizations", "Share of voice reporting"],
    aeoFeatures: [
      "Prompt monitoring at scale",
      "Brand mention tracking",
      "Share of voice",
      "Citation / source URL tracking",
      "Competitor benchmarking",
      "Sentiment analysis",
    ],
    modelsTracked: ["ChatGPT", "Perplexity", "Google AI Overviews", "Gemini", "Claude"],
    otherFeatures: [
      "Historical tracking",
      "Reporting dashboard",
      "Workflow integrations",
      "Team permissions",
    ],
    funding: {
      amount: "Not publicly listed",
      series: "Verify before use",
      leadInvestor: "Not publicly listed",
      founder: "Verify before use",
      notes: "Publicly confirmed as VC-backed. Specific round details not confirmed.",
    },
    notes:
      "One of the more mature enterprise platforms in the space. Pricing is not publicly listed — budget for enterprise-tier. Most useful for brands already running structured tracking programs.",
    lastVerified: "May 2026",
  },
  {
    name: "Otterly AI",
    website: "otterly.ai",
    entryPricing: "Paid subscription — verify current pricing before purchase",
    category: "SMB AI Visibility Trackers",
    bestFor: ["SMBs", "Agencies", "Teams tracking multiple keywords"],
    aeoFeatures: [
      "Prompt tracking",
      "Brand mention monitoring",
      "Competitor benchmarking",
      "Citation tracking",
      "AI model coverage",
    ],
    modelsTracked: ["ChatGPT", "Perplexity", "Google AI Overviews", "Gemini"],
    otherFeatures: ["Reporting exports", "Keyword tracking"],
    funding: {
      amount: "Not publicly listed",
      notes: "Early-stage. Verify before committing to annual plan.",
    },
    notes:
      "Positioned toward SMBs and agencies. Good model coverage for a mid-tier tool. Data freshness and feature roadmap should be verified before purchase.",
    lastVerified: "May 2026",
  },
  {
    name: "Peec AI",
    website: "peec.ai",
    entryPricing: "Paid — verify current tiers before purchase",
    category: "Agency Tools",
    bestFor: ["Agencies", "Consultants", "Brands tracking AI share of voice"],
    aeoFeatures: [
      "Prompt tracking",
      "Share of voice",
      "Competitor monitoring",
      "Brand sentiment",
      "Citation discovery",
    ],
    modelsTracked: ["ChatGPT", "Perplexity", "Gemini", "Google AI Overviews"],
    otherFeatures: ["Client reporting", "Multi-brand support", "Data exports"],
    funding: {
      amount: "Not publicly listed",
      notes: "Verify current funding status before making long-term commitments.",
    },
    notes:
      "Agency-friendly with multi-brand support. Pricing not publicly listed at time of review. Good for teams that need repeatable reporting for clients.",
    lastVerified: "May 2026",
  },
  {
    name: "Scrunch AI",
    website: "scrunch.ai",
    entryPricing: "Paid — verify before purchase",
    category: "Brand Sentiment + Share of Voice Tools",
    bestFor: ["Brands monitoring AI mentions", "PR and content teams", "Competitive intelligence"],
    aeoFeatures: [
      "Brand monitoring in AI conversations",
      "Mention tracking",
      "Sentiment analysis",
      "Competitor comparison",
    ],
    modelsTracked: ["ChatGPT", "Perplexity", "Gemini"],
    otherFeatures: ["AI conversation analysis", "Share of voice metrics"],
    funding: {
      amount: "Not publicly listed",
      notes: "Early-stage. Verify before committing.",
    },
    notes:
      "Focused on AI brand mentions and sentiment. Less emphasis on technical SEO integrations. Best for teams prioritizing brand monitoring over page-level optimization insights.",
    lastVerified: "May 2026",
  },
  {
    name: "AthenaHQ",
    website: "athenahq.ai",
    entryPricing: "Not publicly listed — contact for pricing",
    category: "Enterprise Platforms",
    bestFor: ["Enterprise teams", "Agencies at scale", "Multi-market monitoring"],
    aeoFeatures: [
      "AI visibility tracking",
      "Prompt monitoring",
      "Brand citation tracking",
      "Share of voice",
      "Competitor benchmarking",
    ],
    modelsTracked: ["ChatGPT", "Perplexity", "Gemini", "Google AI Overviews", "Claude"],
    otherFeatures: ["Team workflow support", "Historical data", "Reporting"],
    funding: {
      amount: "Not publicly listed",
      notes: "Confirmed VC-backed. Specific details not publicly disclosed.",
    },
    notes:
      "Enterprise-positioned with broad model coverage. Pricing is opaque — expect enterprise-tier. Most relevant for marketing and SEO teams at funded brands.",
    lastVerified: "May 2026",
  },
  {
    name: "Ahrefs (Brand Radar)",
    website: "ahrefs.com",
    entryPricing: "Included in Ahrefs subscription — plans from ~$129/mo",
    category: "SEO Suites Adding AI Visibility",
    bestFor: ["SEO teams already using Ahrefs", "Brands tracking AI alongside traditional SEO"],
    aeoFeatures: [
      "AI mention tracking",
      "Brand visibility in AI answers",
      "Citation monitoring",
    ],
    modelsTracked: ["ChatGPT", "Perplexity", "Google AI Overviews"],
    otherFeatures: [
      "Full Ahrefs SEO suite included",
      "Keyword research",
      "Backlink analysis",
      "Site audit",
      "Content explorer",
    ],
    notes:
      "Best value for teams already in the Ahrefs ecosystem. AI features are newer and less mature than standalone AI visibility platforms, but SEO integration is strong. Verify current feature set — actively being developed.",
    lastVerified: "May 2026",
  },
  {
    name: "Semrush AI Toolkit",
    website: "semrush.com",
    entryPricing: "Included in Semrush plans — from ~$139/mo",
    category: "SEO Suites Adding AI Visibility",
    bestFor: ["SEO teams already on Semrush", "Agencies with existing Semrush workflows"],
    aeoFeatures: [
      "AI visibility tracking",
      "Brand mention monitoring",
      "AI Overviews tracking",
      "Position monitoring in AI results",
    ],
    modelsTracked: ["Google AI Overviews", "ChatGPT", "Perplexity"],
    otherFeatures: [
      "Full Semrush SEO suite",
      "Rank tracking",
      "Competitive research",
      "Content marketing tools",
      "Local SEO features",
    ],
    notes:
      "AI features are being actively expanded. Strong if you're already in the Semrush ecosystem. For pure AI visibility tracking, standalone tools offer more depth. Best used alongside traditional SEO reporting.",
    lastVerified: "May 2026",
  },
  {
    name: "Local Falcon",
    website: "localfalcon.com",
    entryPricing: "Paid — tiered by scan volume, plans from ~$24/mo",
    category: "Local SEO + AI Visibility Tools",
    bestFor: [
      "Local businesses",
      "Contractors",
      "Agencies managing local SEO",
      "Maps rank tracking",
    ],
    aeoFeatures: ["Google Maps grid tracking", "Local visibility heatmaps", "Business listing monitoring"],
    modelsTracked: ["Google Maps / Local Pack", "Google Business Profile"],
    otherFeatures: [
      "GBP rank grid scans",
      "Competitor grid comparison",
      "White-label reports",
      "Multi-location support",
    ],
    notes:
      "The leading tool for Google Maps rank grid tracking. Not an AI model monitor — it tracks local search visibility across geographic grids. Highly relevant for contractors and local service businesses. AI model tracking is not the focus.",
    lastVerified: "May 2026",
  },
  {
    name: "ZipTie",
    website: "ziptie.dev",
    entryPricing: "Verify before purchase — early-stage, pricing may change",
    category: "Prompt Tracking Platforms",
    bestFor: ["Early adopters", "Teams building AEO processes", "Prompt library management"],
    aeoFeatures: [
      "Prompt monitoring",
      "Brand visibility tracking",
      "AI response logging",
    ],
    modelsTracked: ["ChatGPT", "Perplexity"],
    otherFeatures: ["Prompt library organization", "Response comparison"],
    funding: {
      amount: "Not publicly listed",
      notes: "Very early stage. Verify product status before adopting.",
    },
    notes:
      "Early-stage tool focused on prompt organization and monitoring. Limited model coverage. Feature set and pricing are evolving. Worth watching but not yet suitable for production tracking programs.",
    lastVerified: "May 2026",
  },
];

export const TOOL_CATEGORIES = [
  "Free / Lightweight Checkers",
  "SMB AI Visibility Trackers",
  "Agency Tools",
  "Enterprise Platforms",
  "SEO Suites Adding AI Visibility",
  "Local SEO + AI Visibility Tools",
  "Source / Citation Discovery Tools",
  "Brand Sentiment + Share of Voice Tools",
  "Prompt Tracking Platforms",
  "Optimization / Recommendation Platforms",
];
