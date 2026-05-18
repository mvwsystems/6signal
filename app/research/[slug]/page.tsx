import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import BlogPageClient from "../../components/BlogPageClient";
import AuditPopupButton from "../../components/AuditPopupButton";
import { getAllPosts, getPostBySlug, getRelatedPosts, formatDate } from "../../lib/blog";

const BASE = "https://6signal.co";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | 6 Signal`,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    alternates: { canonical: `${BASE}/research/${post.slug}` },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post.slug, post.category);

  const articleSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.description,
        author: { "@type": "Person", name: post.author },
        datePublished: post.date,
        publisher: {
          "@type": "Organization",
          name: "6 Signal",
          url: BASE,
          logo: { "@type": "ImageObject", url: `${BASE}/6SIGNAL2.png` },
        },
        url: `${BASE}/research/${post.slug}`,
        keywords: post.tags.join(", "),
        articleSection: post.category,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE },
          { "@type": "ListItem", position: 2, name: "Research", item: `${BASE}/research` },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: `${BASE}/research/${post.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <Nav />

      {/* POST HERO */}
      <header className="inner-hero post-hero">
        <div className="wrap">
          <nav className="post-breadcrumb reveal" aria-label="Breadcrumb">
            <Link href="/research" className="idx post-breadcrumb-link">Research</Link>
            <span className="post-breadcrumb-sep">/</span>
            <span className="idx">{post.category}</span>
          </nav>
          <div className="post-meta-bar reveal">
            <span className="idx post-category-label">{post.category}</span>
            <span className="post-meta-sep">·</span>
            <span className="idx">{post.readTime}</span>
            <span className="post-meta-sep">·</span>
            <span className="idx">{formatDate(post.date)}</span>
          </div>
          <h1 className="display post-title reveal">{post.title}</h1>
          <p className="hero-deck post-desc reveal">{post.description}</p>
          <div className="post-byline reveal">
            <span className="idx">By {post.author}</span>
            <span className="post-meta-sep">·</span>
            <span className="idx">6 Signal</span>
          </div>
        </div>
      </header>

      {/* ARTICLE */}
      <article className="post-body-section rule">
        <div className="wrap">
          <div className="post-body">
            <MDXRemote source={post.content} />
          </div>

          {/* MID-ARTICLE CTA */}
          <aside className="post-cta-mid">
            <div className="post-cta-mid-inner">
              <span className="idx post-cta-mid-label">6 Signal Visibility Audit</span>
              <p className="post-cta-mid-text">
                Want to see exactly where your company stands across all six visibility
                layers? The audit is free, takes 30 minutes, and you keep the findings
                regardless of what you decide.
              </p>
              <AuditPopupButton className="btn btn-primary">
                Book the Audit
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </AuditPopupButton>
            </div>
          </aside>
        </div>
      </article>

      {/* TAGS */}
      {post.tags.length > 0 && (
        <section className="post-tags-section rule">
          <div className="wrap">
            <div className="post-tags">
              {post.tags.map((tag) => (
                <span className="post-tag" key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RELATED */}
      {related.length > 0 && (
        <section className="post-related rule">
          <div className="wrap">
            <span className="idx post-related-label">Related posts</span>
            <div className="post-related-grid">
              {related.map((p) => (
                <Link href={`/research/${p.slug}`} className="post-related-card reveal" key={p.slug}>
                  <span className="idx">{p.category}</span>
                  <h4 className="post-related-title">{p.title}</h4>
                  <span className="idx">{formatDate(p.date)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BOTTOM CTA */}
      <section className="post-cta-bottom rule">
        <div className="wrap">
          <div className="post-cta-bottom-inner reveal">
            <span className="idx post-cta-eyebrow">Start here</span>
            <h2 className="display post-cta-h2">
              See where you<br /><em>actually stand.</em>
            </h2>
            <p className="post-cta-deck">
              The Visibility Audit runs your company through all six layers in 30 minutes.
              Free. No pitch. Yours to keep.
            </p>
            <div className="post-cta-btns">
              <AuditPopupButton className="btn btn-primary btn-lg">
                Book the Visibility Audit
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </AuditPopupButton>
              <Link href="/method" className="btn btn-ghost btn-lg">
                Explore the Method
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <BlogPageClient />
    </>
  );
}
