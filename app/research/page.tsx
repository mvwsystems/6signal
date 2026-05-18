import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import BlogPageClient from "../components/BlogPageClient";
import AuditPopupButton from "../components/AuditPopupButton";
import ResearchContent from "../components/ResearchContent";
import { getAllPosts, formatDate } from "../lib/blog";

const BASE = "https://6signal.co";

export const metadata: Metadata = {
  title: "6Signal Research | AI Visibility, AEO, GEO, and Contractor Search Intelligence",
  description:
    "Research, white papers, field notes, and insights on AI visibility, AEO, GEO, local SEO, and how contractors get found across search and AI answers.",
  openGraph: {
    title: "6Signal Research | AI Visibility, AEO, GEO, and Contractor Search Intelligence",
    description:
      "Research, white papers, field notes, and insights on AI visibility, AEO, GEO, local SEO, and how contractors get found across search and AI answers.",
    type: "website",
    url: `${BASE}/research`,
    images: [{ url: "/og-social.jpg", width: 1200, height: 630, alt: "6Signal Research" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-social.jpg"],
  },
  alternates: { canonical: `${BASE}/research` },
};

export default function ResearchIndexPage() {
  const posts = getAllPosts();

  // Most recent White Paper post for the hero
  const wpPost = posts.find((p) => p.category === "White Paper") ?? null;
  const titleParts = wpPost?.title.split(": ") ?? [];
  const wpMainTitle = titleParts[0] ?? wpPost?.title ?? "";
  const wpSubTitle = titleParts[1] ?? "";

  // First featured non-white-paper post
  const featuredInsight =
    posts.find((p) => p.featured && p.category !== "White Paper") ?? null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Research", item: `${BASE}/research` },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "6Signal Research",
    description:
      "Research, white papers, field notes, and insights on AI visibility, AEO, GEO, and contractor search intelligence.",
    url: `${BASE}/research`,
    publisher: { "@type": "Organization", name: "6Signal", url: BASE },
  };

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

      {/* ── PAGE HERO ──────────────────────────────────────────── */}
      <header className="research-hub-hero">
        <div className="wrap">
          <div className="research-hub-hero-inner">
            <div className="research-hub-kicker">
              <span className="idx">6Signal Research</span>
            </div>
            <h1 className="display reveal">
              Research &amp;<br />
              <em>Intelligence.</em>
            </h1>
            <p className="research-hub-deck reveal">
              Field notes, visibility studies, white papers, and tactical
              briefings on how companies get found across search, AI answers,
              Maps, directories, and voice.
            </p>
          </div>
        </div>
      </header>

      {/* ── FEATURED WHITE PAPER HERO ──────────────────────────── */}
      {wpPost && (
        <section className="wp-hero-section rule">
          <div className="wrap">
            <div className="wp-hero-eyebrow">
              <span className="idx">Featured White Paper</span>
            </div>
            <div className="wp-hero-card reveal">
              <div className="wp-hero-content">
                <div className="wp-hero-type-badge">
                  <span className="wp-hero-type-dot" />
                  White Paper
                </div>
                <h2 className="wp-hero-main-title">{wpMainTitle}</h2>
                {wpSubTitle && (
                  <p className="wp-hero-subtitle">{wpSubTitle}</p>
                )}
                <p className="wp-hero-desc">{wpPost.description}</p>
                <div className="wp-hero-meta">
                  <span className="idx">{wpPost.readTime}</span>
                  {wpPost.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="idx wp-hero-tag">
                      · {tag}
                    </span>
                  ))}
                </div>
                <div className="wp-hero-actions">
                  <Link
                    href={`/research/${wpPost.slug}`}
                    className="btn btn-primary"
                  >
                    Read the White Paper
                    <svg
                      className="arrow"
                      viewBox="0 0 16 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    >
                      <path d="M0 5h14M10 1l4 4-4 4" />
                    </svg>
                  </Link>
                  <AuditPopupButton className="btn btn-ghost">
                    Book the Visibility Audit
                  </AuditPopupButton>
                </div>
              </div>
              <div className="wp-hero-graphic-col" aria-hidden="true">
                <div className="wp-signal-dot" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED INSIGHT ───────────────────────────────────── */}
      {featuredInsight && (
        <section className="blog-featured-section rule">
          <div className="wrap">
            <div className="blog-featured-eyebrow">
              <span className="idx">Featured Insight</span>
            </div>
            <Link
              href={`/research/${featuredInsight.slug}`}
              className="blog-featured-card reveal"
            >
              <div className="blog-featured-left">
                <div className="blog-featured-meta">
                  <span className="idx blog-category-label">
                    {featuredInsight.category}
                  </span>
                  <span className="blog-meta-sep">·</span>
                  <span className="idx">{featuredInsight.readTime}</span>
                </div>
                <h2 className="blog-featured-title">{featuredInsight.title}</h2>
                <p className="blog-featured-desc">{featuredInsight.description}</p>
                <span className="blog-read-more">
                  Read article
                  <svg
                    viewBox="0 0 16 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <path d="M0 5h14M10 1l4 4-4 4" />
                  </svg>
                </span>
              </div>
              <div className="blog-featured-right">
                <div className="blog-featured-date">
                  <span className="idx">Published</span>
                  <span className="blog-date-val">
                    {formatDate(featuredInsight.date)}
                  </span>
                </div>
                {featuredInsight.tags.length > 0 && (
                  <div className="blog-tag-list">
                    {featuredInsight.tags.slice(0, 4).map((tag) => (
                      <span className="blog-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── AI VISIBILITY TOOLS INDEX CARD ────────────────────── */}
      <section className="tindex-research-section rule">
        <div className="wrap">
          <div className="tindex-research-eyebrow">
            <span className="idx">Market Map</span>
          </div>
          <Link href="/research/ai-visibility-tools" className="tindex-research-card">
            <div>
              <div className="tindex-research-card-meta">
                <span className="tindex-map-badge">Market Map</span>
                <span className="blog-meta-sep">·</span>
                <span className="idx">Tool Index</span>
                <span className="blog-meta-sep">·</span>
                <span className="idx">May 2026</span>
              </div>
              <h2 className="tindex-research-card-title">
                The AI Visibility Tools Index
              </h2>
              <p className="tindex-research-card-desc">
                A practical field guide to AEO, GEO, AI visibility, prompt tracking,
                citation tracking, brand monitoring, and answer-engine visibility tools.
                Includes funding data, tool profiles, and a buyer framework.
              </p>
              <span className="blog-read-more">
                View the Index
                <svg viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </span>
            </div>
            <div className="tindex-research-card-right">
              <p className="tindex-research-card-tools">
                11 tools reviewed
              </p>
              <p className="tindex-research-card-tools" style={{ color: "#222220" }}>
                AEO · GEO · Local · Enterprise
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* ── CATEGORY TABS + CATALOG ────────────────────────────── */}
      <ResearchContent posts={posts} />

      {/* ── BOTTOM CTA ─────────────────────────────────────────── */}
      <section className="blog-cta-section rule">
        <div className="wrap">
          <div className="blog-cta-inner reveal">
            <span className="idx blog-cta-eyebrow">See where you stand</span>
            <h2 className="display blog-cta-h2">
              See where your company
              <br />
              <em>stands right now.</em>
            </h2>
            <p className="blog-cta-deck">
              The Visibility Audit runs your company through all six layers —
              AI recommendations, Maps, answer engines, voice, indexing, and
              directories. Thirty minutes. Yours to keep.
            </p>
            <AuditPopupButton className="btn btn-primary btn-lg">
              Book the Visibility Audit
              <svg
                className="arrow"
                viewBox="0 0 16 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </AuditPopupButton>
          </div>
        </div>
      </section>

      <Footer />
      <BlogPageClient />
    </>
  );
}
