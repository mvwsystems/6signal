import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import AuditPopupButton from "../../components/AuditPopupButton";
import { AI_VISIBILITY_TOOLS, TOOL_CATEGORIES } from "../../data/aiVisibilityTools";

const BASE = "https://6signal.co";

export const metadata: Metadata = {
  title: "The AI Visibility Tools Index | AEO, GEO, and AI Search Tools | 6Signal",
  description:
    "A field guide to AEO, GEO, and AI visibility tools for tracking brand mentions, citations, prompts, competitors, and answer-engine visibility.",
  openGraph: {
    title: "The AI Visibility Tools Index | AEO, GEO, and AI Search Tools | 6Signal",
    description:
      "A field guide to AEO, GEO, and AI visibility tools for tracking brand mentions, citations, prompts, competitors, and answer-engine visibility.",
    type: "website",
    url: `${BASE}/research/ai-visibility-tools`,
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "AI Visibility Tools Index" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The AI Visibility Tools Index | 6Signal",
    description:
      "A field guide to AEO, GEO, and AI visibility tools for tracking brand mentions, citations, prompts, and answer-engine visibility.",
    images: ["/6SIG_SOCIAL_SHARE.png"],
  },
  alternates: { canonical: `${BASE}/research/ai-visibility-tools` },
};

const ARROW = (
  <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M0 5h14M10 1l4 4-4 4" />
  </svg>
);

const CRITERIA = [
  "Models tracked (ChatGPT, Perplexity, Gemini, Claude, Google AI Overviews)",
  "Prompt tracking depth and library support",
  "Citation and source URL visibility",
  "Competitor benchmarking",
  "Brand sentiment",
  "Share of voice over time",
  "Geographic and local market support",
  "Google AI Overviews / AI Mode tracking",
  "Reporting and data export",
  "Optimization recommendations (beyond tracking)",
  "Source discovery — which third-party pages are cited",
  "Workflow fit for your team size",
  "Pricing transparency and contract flexibility",
  "Data freshness and monitoring frequency",
  "Support for agencies or multi-location businesses",
  "Explains what to fix, not just where you appear",
];

const WHEN_NOT = [
  "Your Google Business Profile is incomplete or inconsistent",
  "Your website has thin, vague, or misaligned service pages",
  "Your reviews are generic, stale, or missing location and service signals",
  "Your business data is inconsistent across directories and third-party sources",
  "You have no question clusters or answer-ready pages",
  "You do not know which prompts buyers actually use",
  "You have not yet run a prompt test or a Visibility Audit",
];

const WHEN_BUY = [
  "You are already tracking prompts manually and need scale",
  "You have multiple competitors or markets to monitor",
  "You need citation and source URLs — not just appearance counts",
  "You need share-of-voice trends over time",
  "You manage multiple brands, locations, or clients",
  "You need reporting for stakeholders or executives",
  "You have a team that can act on the findings",
];

export default function AIVisibilityToolsPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Research", item: `${BASE}/research` },
      {
        "@type": "ListItem",
        position: 3,
        name: "AI Visibility Tools Index",
        item: `${BASE}/research/ai-visibility-tools`,
      },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "The AI Visibility Tools Index",
    description:
      "A field guide to AEO, GEO, and AI visibility tools for tracking brand mentions, citations, prompts, competitors, and answer-engine visibility.",
    url: `${BASE}/research/ai-visibility-tools`,
    publisher: { "@type": "Organization", name: "6Signal", url: BASE },
    dateModified: "2026-05-19",
  };

  const fundedTools = AI_VISIBILITY_TOOLS.filter((t) => t.funding);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <Nav />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <header className="tindex-hero">
        <div className="wrap">
          <div className="tindex-hero-inner">
            <div className="tindex-label">
              <span className="tindex-label-dot" aria-hidden="true" />
              <span className="idx">Market Map</span>
            </div>
            <h1 className="display tindex-h1">
              The AI Visibility<br />
              <em>Tools Index</em>
            </h1>
            <p className="tindex-sub">
              A practical field guide to AEO, GEO, AI visibility, brand monitoring, prompt
              tracking, citation tracking, and answer-engine visibility tools.
            </p>
            <div className="tindex-meta-row">
              <span>Updated May 2026</span>
              <span className="tindex-meta-sep">·</span>
              <span>AEO</span>
              <span className="tindex-meta-sep">·</span>
              <span>GEO</span>
              <span className="tindex-meta-sep">·</span>
              <span>AI Visibility</span>
              <span className="tindex-meta-sep">·</span>
              <span>Tool Index</span>
            </div>
            <div className="tindex-cta-row">
              <AuditPopupButton className="btn btn-primary">
                Book a Visibility Audit
                {ARROW}
              </AuditPopupButton>
              <Link href="/contact" className="btn btn-ghost">
                Submit a Tool
                {ARROW}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── EXECUTIVE SUMMARY ────────────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">Executive Summary</span>
            </div>
            <h2 className="tindex-h2">The market is early.<br />Buy carefully.</h2>
          </div>
          <div className="tindex-body">
            <p>
              AI visibility tooling is growing quickly. New platforms are launching across a
              spectrum from free single-query checkers to enterprise-grade monitoring systems
              with multi-model coverage, share of voice, citation tracking, and historical
              reporting.
            </p>
            <p>
              Most tools currently focus on AI answer tracking — whether a brand appears in
              responses from ChatGPT, Perplexity, Google AI Overviews, Gemini, and Claude.
              Prompt monitoring, mention frequency, citation source URLs, competitor
              benchmarking, and sentiment are the features appearing across the category.
            </p>
            <p>
              Optimization features are emerging, but the category is still early. Most tools
              can tell you where you appear. Few can tell you why you appear — or why you
              do not. That distinction matters for buyers who need to act on the findings,
              not just report on them.
            </p>
            <p>
              This index exists to help operators understand the tool landscape without getting
              buried in vendor language. It is updated as new tools are verified. All pricing
              and funding data should be independently confirmed before purchase.
            </p>
          </div>

          {/* POV Box */}
          <div className="tindex-pov">
            <span className="tindex-pov-label">6Signal POV</span>
            <p className="tindex-pov-text">Tooling is not strategy.</p>
            <p className="tindex-pov-text">
              Most AEO tools can tell you where you appear. Fewer can tell you why. Even
              fewer can tell a local business which entity, review, service page, citation,
              or source gap to fix first.
            </p>
          </div>
        </div>
      </section>

      {/* ── RECOMMENDATION ───────────────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">6Signal Recommendation</span>
            </div>
            <h2 className="tindex-h2">Start with tracking.<br />Add complexity later.</h2>
          </div>
          <div className="tindex-body">
            <p>
              Most companies should start with tracking. Before paying for complex
              optimization features, choose the least expensive tool that reliably shows
              whether your brand appears, where it appears, which competitors are named,
              which sources are cited, and which prompts matter.
            </p>
          </div>

          <div className="tindex-rec-grid">
            <div className="tindex-rec-cell">
              <span className="tindex-rec-label">For Local Businesses &amp; Contractors</span>
              <p className="tindex-rec-body">
                Start with lightweight tracking, manual prompt tests, Google Business Profile
                cleanup, review specificity, source ecosystem work, and service-page clarity
                before paying for enterprise dashboards. Most local visibility problems are
                entity and content problems — not tool problems.
              </p>
            </div>
            <div className="tindex-rec-cell">
              <span className="tindex-rec-label">For Agencies</span>
              <p className="tindex-rec-body">
                Use a tool with prompt tracking, competitor benchmarking, citation and source
                URLs, data exports, and repeatable client reporting. Prioritize tools that
                support multi-brand or multi-location work. Verify pricing tiers before
                committing clients to a specific platform.
              </p>
            </div>
            <div className="tindex-rec-cell">
              <span className="tindex-rec-label">For Enterprise Brands</span>
              <p className="tindex-rec-body">
                Prioritize source and citation analysis, share of voice over time, sentiment
                tracking, workflow permissions, historical tracking, regional and model
                coverage, and structured reporting. Expect enterprise-tier pricing for the
                most capable platforms.
              </p>
            </div>
            <div className="tindex-rec-cell">
              <span className="tindex-rec-label">For SEO Teams</span>
              <p className="tindex-rec-body">
                Prefer tools that integrate with existing SEO workflows and can connect AI
                visibility back to pages, topics, sources, and technical issues. SEO suites
                adding AI features offer easier integration but often less depth than
                standalone AI monitoring platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW TO CHOOSE ────────────────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">Buyer Framework</span>
            </div>
            <h2 className="tindex-h2">How to choose an<br />AEO / AI visibility tool</h2>
          </div>
          <div className="tindex-body">
            <p>
              Evaluate tools across these criteria before purchasing. The weight of each
              criterion depends on your team size, use case, and current maturity.
            </p>
          </div>
          <div className="tindex-criteria">
            {CRITERIA.map((c) => (
              <div className="tindex-criterion" key={c}>
                <div className="tindex-criterion-check" aria-hidden="true">
                  <span />
                </div>
                <p className="tindex-criterion-text">{c}</p>
              </div>
            ))}
          </div>
          <p className="tindex-tagline">
            The best tool is the one that gives you decisions, not just dashboards.
          </p>
        </div>
      </section>

      {/* ── TOOL CATEGORIES ──────────────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">Tool Categories</span>
            </div>
            <h2 className="tindex-h2">Ten segments.<br />One market.</h2>
          </div>
          <div className="tindex-cat-grid">
            {TOOL_CATEGORIES.map((cat, i) => (
              <div className="tindex-cat-card" key={cat}>
                <span className="tindex-cat-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="tindex-cat-name">{cat}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNDING TABLE ────────────────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">Market Map · Funding</span>
            </div>
            <h2 className="tindex-h2">Funded companies<br />in the space</h2>
          </div>
          <div className="tindex-body">
            <p>
              Funding data is sourced from public records where available. All figures should
              be independently verified before purchase decisions. &ldquo;Not publicly
              listed&rdquo; means no confirmed public disclosure was found at time of review.
            </p>
          </div>
          <div className="tindex-table-wrap">
            <table className="tindex-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Amount Raised</th>
                  <th>Series</th>
                  <th>Lead Investor</th>
                  <th>Founder</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {fundedTools.map((tool) => (
                  <tr key={tool.name}>
                    <td className="t-name">{tool.name}</td>
                    <td>{tool.funding?.amount ?? "Not publicly listed"}</td>
                    <td>{tool.funding?.series ?? "Not publicly listed"}</td>
                    <td>{tool.funding?.leadInvestor ?? "Not publicly listed"}</td>
                    <td>{tool.funding?.founder ?? "Not publicly listed"}</td>
                    <td>{tool.funding?.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tindex-disclaimer">
            All funding data is provided for informational purposes only. Verify before use.
            6Signal makes no guarantee of accuracy. Submit corrections via{" "}
            <Link href="/contact" className="tindex-inline-link">
              /contact
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── MASTER TOOLS TABLE ───────────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">Master Table</span>
            </div>
            <h2 className="tindex-h2">All tools at a glance</h2>
          </div>
          <div className="tindex-table-wrap">
            <table className="tindex-table">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Entry Pricing</th>
                  <th>Category</th>
                  <th>Best For</th>
                  <th>AEO Features</th>
                  <th>Models Tracked</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {AI_VISIBILITY_TOOLS.map((tool) => (
                  <tr key={tool.name}>
                    <td className="t-name">{tool.name}</td>
                    <td style={{ minWidth: 180 }}>{tool.entryPricing ?? "—"}</td>
                    <td style={{ minWidth: 160 }}>
                      <span className="t-tag">{tool.category}</span>
                    </td>
                    <td style={{ minWidth: 200 }}>
                      {tool.bestFor.join(", ")}
                    </td>
                    <td style={{ minWidth: 240 }}>
                      {tool.aeoFeatures.join(", ")}
                    </td>
                    <td style={{ minWidth: 200 }}>
                      {tool.modelsTracked.join(", ")}
                    </td>
                    <td style={{ minWidth: 260 }}>{tool.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FEATURED PROFILES ────────────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">Tool Profiles</span>
            </div>
            <h2 className="tindex-h2">Individual tool<br />field notes</h2>
          </div>
          <p className="tindex-body tindex-body-narrow">
            These profiles are written from an operator perspective — not affiliate marketing.
            No tool is paid placement. All assessments are based on publicly available
            information and should be verified before purchase.
          </p>

          <div className="tindex-profiles">
            {AI_VISIBILITY_TOOLS.map((tool) => (
              <div className="tindex-profile" key={tool.name}>
                <div className="tindex-profile-left">
                  <div className="tindex-profile-name">{tool.name}</div>
                  <span className="tindex-profile-cat">{tool.category}</span>
                  <p className="tindex-profile-price">
                    {tool.entryPricing ?? "Pricing not listed"}
                  </p>
                  <p className="tindex-profile-verified">
                    Last verified: {tool.lastVerified ?? "See notes"}
                  </p>
                </div>
                <div className="tindex-profile-right">
                  <p className="tindex-profile-summary">{tool.notes}</p>
                  <div className="tindex-profile-grid">
                    <div className="tindex-profile-field">
                      <span className="tindex-profile-field-label">Models Tracked</span>
                      <p className="tindex-profile-field-val">
                        {tool.modelsTracked.join(" · ")}
                      </p>
                    </div>
                    <div className="tindex-profile-field">
                      <span className="tindex-profile-field-label">Best For</span>
                      <p className="tindex-profile-field-val">
                        {tool.bestFor.join(" · ")}
                      </p>
                    </div>
                    <div className="tindex-profile-field">
                      <span className="tindex-profile-field-label">Core Features</span>
                      <p className="tindex-profile-field-val">
                        {tool.aeoFeatures.slice(0, 3).join(", ")}
                        {tool.aeoFeatures.length > 3 ? ` +${tool.aeoFeatures.length - 3} more` : ""}
                      </p>
                    </div>
                    {tool.otherFeatures && tool.otherFeatures.length > 0 && (
                      <div className="tindex-profile-field">
                        <span className="tindex-profile-field-label">Other Features</span>
                        <p className="tindex-profile-field-val">
                          {tool.otherFeatures.slice(0, 2).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT TOOLS STILL DO POORLY ───────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-section-head">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">6Signal Assessment</span>
            </div>
            <h2 className="tindex-h2">What these tools<br />still do poorly</h2>
          </div>
          <div className="tindex-body">
            <p>
              Tracking visibility is not the same as diagnosing why visibility is weak. Most
              tools can tell you that a competitor appears and you do not. Few can tell you
              which entity gap, review problem, service-page issue, citation inconsistency,
              or source gap is the actual cause.
            </p>
            <p>
              The current generation of tools is also stronger for SaaS, DTC, and enterprise
              brands than for local service businesses and contractors. Most platforms were
              built for brands tracking AI mentions in a broad, category-wide sense — not
              for a plumber trying to understand why ChatGPT names a competitor in Fort Worth
              but not them.
            </p>
            <p>
              Local contractors still need entity cleanup, Google Business Profile
              optimization, reviews with specific service and location language, service-page
              clarity, and source ecosystem work before advanced dashboards create meaningful
              leverage. A dashboard that confirms you are invisible does not tell you how to
              fix the invisibility.
            </p>
            <p>
              A tool does not replace strategy. Tracking is the start, not the fix. The key
              question is not only whether you appear — it is what signal gap explains why
              you do or do not appear, and what can actually be changed.
            </p>
          </div>
        </div>
      </section>

      {/* ── WHEN TO / WHEN NOT TO ────────────────────────────────────── */}
      <section className="tindex-section rule">
        <div className="wrap">
          <div className="tindex-twin">
            {/* When not to buy */}
            <div>
              <div className="tindex-eyebrow">
                <span className="tindex-eyebrow-dot" aria-hidden="true" />
                <span className="idx">Fix These First</span>
              </div>
              <h2 className="tindex-h2" style={{ fontSize: "clamp(24px,2.4vw,36px)", marginBottom: 24 }}>
                When you should not<br />buy a tool yet
              </h2>
              <div className="tindex-check-list">
                {WHEN_NOT.map((item) => (
                  <div className="tindex-check-item" key={item}>
                    <svg
                      className="tindex-check-icon"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect x="0.5" y="0.5" width="19" height="19" rx="1.5" stroke="rgba(255,255,255,0.15)" />
                      <path d="M6 10l3 3 5-6" stroke="#555553" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="tindex-check-text">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* When to buy */}
            <div>
              <div className="tindex-eyebrow">
                <span className="tindex-eyebrow-dot" aria-hidden="true" />
                <span className="idx">Ready to Buy When</span>
              </div>
              <h2 className="tindex-h2" style={{ fontSize: "clamp(24px,2.4vw,36px)", marginBottom: 24 }}>
                When a tool<br />actually makes sense
              </h2>
              <div className="tindex-check-list">
                {WHEN_BUY.map((item) => (
                  <div className="tindex-check-item" key={item}>
                    <svg
                      className="tindex-check-icon"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect x="0.5" y="0.5" width="19" height="19" rx="1.5" stroke="rgba(230,255,0,0.3)" />
                      <path d="M6 10l3 3 5-6" stroke="#E6FF00" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="tindex-check-text">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUBMIT A TOOL ────────────────────────────────────────────── */}
      <section className="tindex-submit rule">
        <div className="wrap">
          <div className="tindex-submit-inner">
            <div>
              <h2 className="tindex-submit-h">Building an AI visibility tool?</h2>
              <p className="tindex-submit-body">
                Send it to 6Signal for review. We evaluate AEO, GEO, AI visibility, brand
                monitoring, prompt tracking, citation tracking, and answer-engine tools.
                No guaranteed placement. No affiliate relationships.
              </p>
            </div>
            <Link href="/contact" className="btn btn-ghost" style={{ whiteSpace: "nowrap" }}>
              Submit a Tool
              {ARROW}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section className="tindex-section rule" style={{ paddingBottom: 160 }}>
        <div className="wrap">
          <div className="tindex-final-cta">
            <div className="tindex-eyebrow">
              <span className="tindex-eyebrow-dot" aria-hidden="true" />
              <span className="idx">Start here</span>
            </div>
            <h2 className="display tindex-final-h2">
              Know where you appear<br />
              <em>before you buy a tool.</em>
            </h2>
            <p className="tindex-sub" style={{ marginBottom: 40, maxWidth: 600 }}>
              The Visibility Audit shows where your company appears, where competitors get
              named instead, which sources AI uses, and what signals need to be fixed first.
            </p>
            <AuditPopupButton className="btn btn-primary btn-lg">
              Book the Visibility Audit
              {ARROW}
            </AuditPopupButton>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
