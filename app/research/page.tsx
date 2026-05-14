import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import BlogPageClient from "../components/BlogPageClient";
import AuditPopupButton from "../components/AuditPopupButton";
import { getAllPosts, formatDate, type PostMeta } from "../lib/blog";

export const metadata: Metadata = {
  title: "Research — Growth Systems for Contractors | 6 Signal",
  description:
    "Field notes on AI visibility, local SEO, lead generation, and automation for contractors who want more booked jobs — not more marketing fluff.",
  openGraph: {
    title: "Growth Systems for Contractors — 6 Signal Research",
    description:
      "Field notes on AI visibility, local SEO, lead generation, and automation for contractors who want more booked jobs.",
    type: "website",
    images: [{ url: "/og-social.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Growth Systems for Contractors — 6 Signal Research",
    images: ["/og-social.jpg"],
  },
  alternates: { canonical: "https://6signal.co/research" },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p.slug !== featured?.slug);

  return (
    <>
      <Nav />

      {/* HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">Intelligence</span>
            <h1 className="display reveal">
              Growth Systems<br />
              <em>for Contractors.</em>
            </h1>
            <p className="hero-deck reveal">
              Practical field notes on AI visibility, local SEO, lead generation, and
              automation for contractors who want more booked jobs — not more marketing fluff.
            </p>
          </div>
        </div>
      </header>

      {/* FEATURED POST */}
      {featured && (
        <section className="blog-featured-section rule">
          <div className="wrap">
            <div className="blog-featured-eyebrow">
              <span className="idx">Featured</span>
            </div>
            <Link href={`/research/${featured.slug}`} className="blog-featured-card reveal">
              <div className="blog-featured-left">
                <div className="blog-featured-meta">
                  <span className="idx blog-category-label">{featured.category}</span>
                  <span className="blog-meta-sep">·</span>
                  <span className="idx">{featured.readTime}</span>
                </div>
                <h2 className="blog-featured-title">{featured.title}</h2>
                <p className="blog-featured-desc">{featured.description}</p>
                <span className="blog-read-more">
                  Read article
                  <svg viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M0 5h14M10 1l4 4-4 4" />
                  </svg>
                </span>
              </div>
              <div className="blog-featured-right">
                <div className="blog-featured-date">
                  <span className="idx">Published</span>
                  <span className="blog-date-val">{formatDate(featured.date)}</span>
                </div>
                {featured.tags.length > 0 && (
                  <div className="blog-tag-list">
                    {featured.tags.slice(0, 4).map((tag) => (
                      <span className="blog-tag" key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* POST GRID */}
      {rest.length > 0 && (
        <section className="blog-grid-section rule">
          <div className="wrap">
            <div className="blog-grid-eyebrow">
              <span className="idx">All posts</span>
            </div>
            <div className="blog-grid">
              {rest.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="blog-cta-section rule">
        <div className="wrap">
          <div className="blog-cta-inner reveal">
            <span className="idx blog-cta-eyebrow">Take the next step</span>
            <h2 className="display blog-cta-h2">
              See where your company<br />
              <em>stands right now.</em>
            </h2>
            <p className="blog-cta-deck">
              The Visibility Audit runs your company through all six layers — AI
              recommendations, Maps, answer engines, voice, indexing, and directories.
              Free. Thirty minutes. Yours to keep.
            </p>
            <AuditPopupButton className="btn btn-primary btn-lg">
              Book the Visibility Audit
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
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

function BlogCard({ post }: { post: PostMeta }) {
  return (
    <Link href={`/research/${post.slug}`} className="blog-card reveal">
      <div className="blog-card-meta">
        <span className="idx blog-category-label">{post.category}</span>
        <span className="blog-meta-sep">·</span>
        <span className="idx">{post.readTime}</span>
      </div>
      <h3 className="blog-card-title">{post.title}</h3>
      <p className="blog-card-desc">{post.description}</p>
      <div className="blog-card-footer">
        <span className="idx">{formatDate(post.date)}</span>
        <span className="blog-card-read">
          Read
          <svg viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M0 5h14M10 1l4 4-4 4" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
