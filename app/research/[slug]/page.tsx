import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import BlogPageClient from "../../components/BlogPageClient";
import AuditPopupButton from "../../components/AuditPopupButton";
import { getAllPosts, getPostBySlug, getRelatedPosts, formatDate } from "../../lib/blog";
import BlogCTA from "../../components/BlogCTA";

const BASE = "https://6signal.co";

// White papers with a downloadable PDF edition. The cover renders only in
// print (page 1 of the PDF); the button renders only on screen.
const WP_PDFS: Record<string, { cover: string; pdf: string }> = {
  "question-cluster-advantage": { cover: "/papers/covers/question-cluster-advantage.png", pdf: "/papers/question-cluster-advantage.pdf" },
  "local-entity-gap-ai-search": { cover: "/papers/covers/local-entity-gap-ai-search.png", pdf: "/papers/local-entity-gap-ai-search.pdf" },
  "aeo-field-manual-answer-engine-optimization": { cover: "/papers/covers/aeo-field-manual-answer-engine-optimization.png", pdf: "/papers/aeo-field-manual-answer-engine-optimization.pdf" },
  "ai-search-measurement-playbook": { cover: "/papers/covers/ai-search-measurement-playbook.png", pdf: "/papers/ai-search-measurement-playbook.pdf" },
  "the-connective-layer-ai-infrastructure-construction": { cover: "/papers/covers/the-connective-layer-ai-infrastructure-construction.png", pdf: "/papers/the-connective-layer-ai-infrastructure-construction.pdf" },
  "local-ai-infrastructure-blueprint": { cover: "/papers/covers/local-ai-infrastructure-blueprint.png", pdf: "/papers/local-ai-infrastructure-blueprint.pdf" },
};

// Research figures are dark plates on screen. Every /research-visuals/ SVG has
// a light `-print.svg` twin (scripts/make-print-visuals.py) so the PDF edition
// prints ink-light on white paper instead of a black block; CSS swaps them.
function Figure(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const src = typeof props.src === "string" ? props.src : "";
  if (!src.startsWith("/research-visuals/") || !src.endsWith(".svg")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" {...props} />;
  }
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" {...props} className="fig-screen" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        src={src.replace(/\.svg$/, "-print.svg")}
        alt=""
        aria-hidden="true"
        className="fig-print"
      />
    </>
  );
}

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

  const schemaGraph: object[] = [
    {
      "@type": "Article",
      headline: post.title,
      description: post.description,
      author: { "@type": "Person", name: post.author, url: "https://mattvincentwalker.com" },
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
  ];

  if (post.faq && post.faq.length > 0) {
    schemaGraph.push({
      "@type": "FAQPage",
      mainEntity: post.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }

  const articleSchema = { "@context": "https://schema.org", "@graph": schemaGraph };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <Nav />

      {/* PDF cover — print only; becomes page 1 of the downloadable PDF */}
      {WP_PDFS[post.slug] && (
        <div className="wp-print-cover" aria-hidden="true">
          <img src={WP_PDFS[post.slug].cover} alt="" />
        </div>
      )}

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
          {WP_PDFS[post.slug] && (
            <div className="post-download reveal">
              <a href={WP_PDFS[post.slug].pdf} download className="btn btn-primary">
                Download the white paper (PDF)
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </header>

      {/* ARTICLE */}
      <article className="post-body-section rule">
        <div className="wrap">
          <div className="post-body">
            <MDXRemote
              source={post.content}
              components={{ BlogCTA, img: Figure }}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </div>

          {/* MID-ARTICLE CTA */}
          <aside className="post-cta-mid">
            <div className="post-cta-mid-inner">
              <span className="idx post-cta-mid-label">6 Signal Visibility Audit</span>
              <p className="post-cta-mid-text">
                Want to see exactly where your company stands across all six visibility
                layers? Get the AI Visibility Audit for $27 — instant results,
                specific to your business, your trade, and your market.
              </p>
              <AuditPopupButton className="btn btn-primary">
                Get the AI Visibility Audit
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
              The AI Visibility Audit runs your company through all six layers
              and delivers instant results. $27. Specific to your business, trade, and market.
            </p>
            <div className="post-cta-btns">
              <AuditPopupButton className="btn btn-primary btn-lg">
                Get the AI Visibility Audit
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

      {/* PDF back page — print only; the screen CTA above is hidden in print
          because its full-bleed black panel splits across paper pages. */}
      {WP_PDFS[post.slug] && (
        <section className="wp-print-back" aria-hidden="true">
          <div className="wp-print-back-inner">
            <span className="idx wp-print-back-eyebrow">Next step</span>
            <h2 className="display wp-print-back-h2">
              See where you <em>actually stand.</em>
            </h2>
            <p className="wp-print-back-deck">
              The AI Visibility Audit runs your company through all six layers — GEO,
              AEO, LEO, VEO, PEO, IEO — and delivers instant results. $27. Specific to
              your business, your trade, and your market.
            </p>
            <div className="wp-print-back-cta">
              <span className="idx wp-print-back-cta-label">Get the audit</span>
              <span className="wp-print-back-cta-url">6signal.co/visibility-check</span>
            </div>
          </div>
          <div className="wp-print-back-foot">
            <span className="idx">6 Signal · {post.author}</span>
            <span className="idx">6signal.co · hello@6signal.co</span>
          </div>
        </section>
      )}

      <Footer />
      <BlogPageClient />
    </>
  );
}
