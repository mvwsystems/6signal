import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import BlogPageClient from "../../components/BlogPageClient";
import { getPublishedBriefing } from "../../lib/db";
import { formatDate } from "../../lib/blog";

export const revalidate = 300;

const BASE = "https://6signal.co";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const issue = await getPublishedBriefing(slug);
  if (!issue) return {};
  return {
    title: issue.subject,
    description: issue.preview ?? undefined,
    authors: [{ name: "Matt Vincent Walker" }],
    alternates: { canonical: `${BASE}/briefings/${issue.slug}` },
    openGraph: {
      title: issue.subject,
      description: issue.preview ?? undefined,
      type: "article",
      publishedTime: issue.published_at ?? undefined,
      authors: ["Matt Vincent Walker"],
    },
  };
}

export default async function BriefingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const issue = await getPublishedBriefing(slug);
  if (!issue) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: issue.subject,
        description: issue.preview ?? undefined,
        datePublished: issue.published_at,
        author: { "@type": "Person", name: "Matt Vincent Walker" },
        publisher: { "@type": "Organization", name: "6 Signal" },
        mainEntityOfPage: `${BASE}/briefings/${issue.slug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE },
          { "@type": "ListItem", position: 2, name: "Intelligence Brief", item: `${BASE}/briefings` },
          { "@type": "ListItem", position: 3, name: issue.subject, item: `${BASE}/briefings/${issue.slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <Nav />

      <header className="inner-hero post-hero">
        <div className="wrap">
          <nav className="post-breadcrumb reveal" aria-label="Breadcrumb">
            <Link href="/briefings" className="idx post-breadcrumb-link">Intelligence Brief</Link>
            <span className="post-breadcrumb-sep">/</span>
            {/* formatDate expects a date-only string; these are full timestamps. */}
            <span className="idx">{formatDate((issue.published_at ?? issue.created_at).slice(0, 10))}</span>
          </nav>
          <h1 className="display post-title reveal">{issue.subject}</h1>
          {issue.preview && <p className="hero-deck post-desc reveal">{issue.preview}</p>}
          <div className="post-byline reveal">
            <span className="idx">By Matt Vincent Walker</span>
            <span className="post-meta-sep">·</span>
            <span className="idx">6 Signal</span>
          </div>
        </div>
      </header>

      <article className="post-body-section rule">
        <div className="wrap">
          <div className="post-body">
            <MDXRemote source={issue.body} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
          </div>

          <aside className="post-cta-mid">
            <div className="post-cta-mid-inner">
              <span className="idx post-cta-mid-label">Get this in your inbox</span>
              <p className="post-cta-mid-text">
                The Intelligence Brief goes out to contractors who want to know what the AI engines
                actually say about their market — before their competitors do.
              </p>
              <Link href="/ai-visibility-check" className="btn btn-primary">
                Run a free AI visibility check
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </Link>
            </div>
          </aside>
        </div>
      </article>

      <Footer />
      <BlogPageClient />
    </>
  );
}
