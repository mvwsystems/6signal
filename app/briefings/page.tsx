import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import BlogPageClient from "../components/BlogPageClient";
import { listPublishedBriefings } from "../lib/db";
import { formatDate } from "../lib/blog";

// Public archive of the Intelligence Brief. Issues are written and sent from
// /dashboard; only ones with a published_at appear here. Revalidates rather
// than building static, since issues are published from the dashboard and not
// from a deploy.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Intelligence Brief",
  description:
    "Field notes on AI visibility for contractors — what the engines actually answer, what moves the numbers, and what does not. Published by Matt Vincent Walker.",
  alternates: { canonical: "https://6signal.co/briefings" },
};

export default async function BriefingsIndex() {
  const issues = await listPublishedBriefings();

  return (
    <>
      <Nav />

      <header className="inner-hero">
        <div className="wrap">
          <div className="research-hub-kicker">
            <span className="idx">6 Signal</span>
          </div>
          <h1 className="display reveal">Intelligence Brief</h1>
          <p className="hero-deck reveal">
            What the AI engines answered this week, what changed, and what it cost or earned the
            contractors we measure. Short, specific, and evidence-first.
          </p>
        </div>
      </header>

      <section className="research-grid-section rule">
        <div className="wrap">
          <div className="research-section-header">
            <span className="idx">Past issues</span>
            <span className="idx research-count">{issues.length}</span>
          </div>

          {issues.length === 0 ? (
            <div className="research-empty">
              <span className="idx">The first issue is on its way.</span>
            </div>
          ) : (
            <div className="blog-grid">
              {issues.map((issue) => (
                <Link key={issue.slug} href={`/briefings/${issue.slug}`} className="blog-card reveal">
                  <div className="blog-card-meta">
                    <span className="idx blog-category-label">Brief</span>
                  </div>
                  <h3 className="blog-card-title">{issue.subject}</h3>
                  {issue.preview && <p className="blog-card-desc">{issue.preview}</p>}
                  <div className="blog-card-footer">
                    {/* formatDate expects a date-only string; these are full timestamps. */}
                    <span className="idx">{formatDate(issue.published_at.slice(0, 10))}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <BlogPageClient />
    </>
  );
}
