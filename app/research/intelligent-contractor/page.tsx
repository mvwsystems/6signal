import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import BlogPageClient from "../../components/BlogPageClient";
import SeriesSubscribe from "../../components/SeriesSubscribe";
import { getAllPosts, formatDate } from "../../lib/blog";

const BASE = "https://6signal.co";

// Reading order — the series argument builds; dates are the weekly Thursday spine.
const SERIES_SLUGS = [
  "the-four-system-contractor",
  "construction-data-thrown-away",
  "what-ai-should-never-decide-on-a-construction-site",
  "from-bookkeeping-to-financial-intelligence",
  "margin-gone-before-the-job-closed",
  "work-you-did-but-never-billed",
  "the-ai-assisted-safety-system",
  "your-safety-program-lives-in-nine-places",
  "which-spec-governs",
  "an-answer-without-a-source-is-a-liability",
  "contract-and-risk-intelligence",
  "what-did-the-ai-do-and-who-approved-it",
  "the-company-that-learns-from-every-job",
  "equipment-and-rental-control-tower",
  "the-first-system-90-day-build-order",
];

export const metadata: Metadata = {
  title: "The Intelligent Contractor — a 15-part series | 6Signal Research",
  description:
    "How AI becomes the connective infrastructure of a construction company: revenue, operations, control, and learning. Fifteen essays on financial intelligence, safety scope, jurisdictional provenance, governance, and the 90-day build order.",
  openGraph: {
    title: "The Intelligent Contractor — a 15-part series",
    description:
      "AI as the connective infrastructure of a construction company: four systems, the control layer, and the 90-day build order.",
    type: "website",
    url: `${BASE}/research/intelligent-contractor`,
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "The Intelligent Contractor" }],
  },
  twitter: { card: "summary_large_image", images: ["/6SIG_SOCIAL_SHARE.png"] },
  alternates: { canonical: `${BASE}/research/intelligent-contractor` },
};

export default function IntelligentContractorPage() {
  const all = getAllPosts();
  const posts = SERIES_SLUGS.map((slug) => all.find((p) => p.slug === slug)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p)
  );

  const seriesSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "The Intelligent Contractor",
    description:
      "A 15-part series on AI as the connective infrastructure of a construction company.",
    url: `${BASE}/research/intelligent-contractor`,
    isPartOf: { "@type": "WebSite", name: "6Signal", url: BASE },
    hasPart: posts.map((p) => ({
      "@type": "Article",
      headline: p.title,
      url: `${BASE}/research/${p.slug}`,
      datePublished: p.date,
      author: { "@type": "Person", name: "Matt Vincent Walker" },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seriesSchema) }}
      />
      <Nav />

      <header className="tic-hero">
        <div className="wrap">
          <div className="tic-kicker">
            <span className="idx">Series · Operations Track · 15 parts</span>
          </div>
          <h1 className="display reveal">
            The Intelligent
            <br />
            <em>Contractor.</em>
          </h1>
          <p className="tic-deck reveal">
            Most AI-for-construction content is about tools. This series is
            about the company: four connected systems — finding work, doing it,
            protecting it, learning from it — and how AI becomes the
            infrastructure between them. Written for owners, argued from
            sourced numbers, and bounded by one rule throughout: AI prepares,
            humans decide.
          </p>
          <div className="tic-meta">
            <span className="idx">15 essays</span>
            <span className="blog-meta-sep">·</span>
            <span className="idx">April – July 2026</span>
            <span className="blog-meta-sep">·</span>
            <span className="idx">By Matt Vincent Walker</span>
          </div>
        </div>
      </header>

      <section className="tic-list-section rule">
        <div className="wrap">
          <div className="research-section-header">
            <span className="idx">Reading order</span>
            <span className="idx research-count">{posts.length} parts</span>
          </div>
          <ol className="tic-list">
            {posts.map((post, i) => (
              <li key={post.slug}>
                <Link href={`/research/${post.slug}`} className="tic-item">
                  <span className="tic-num idx">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="tic-item-main">
                    <span className="tic-item-title">{post.title}</span>
                    <span className="tic-item-desc">{post.description}</span>
                  </span>
                  <span className="tic-item-meta idx">
                    {formatDate(post.date)} · {post.readTime}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="tic-sub-section rule">
        <div className="wrap">
          <div className="tic-sub-inner reveal">
            <span className="idx blog-cta-eyebrow">Follow the track</span>
            <h2 className="display blog-cta-h2">
              New installments,
              <br />
              <em>no noise.</em>
            </h2>
            <p className="blog-cta-deck">
              The operations track continues — front-office systems, field
              notes from running these builds, and what changes as the tools
              do. One email when something new is published. Nothing else.
            </p>
            <SeriesSubscribe />
            <p className="tic-sub-alt">
              Or start where the series ends:{" "}
              <Link href="/research/the-first-system-90-day-build-order">
                The First System: A 90-Day Build Order
              </Link>
              . How 6 Signal runs these builds is at{" "}
              <Link href="/systemize">/systemize</Link>.
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <BlogPageClient />
    </>
  );
}
