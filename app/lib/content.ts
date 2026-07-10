// Content engine: writes AI-visibility articles for client sites and publishes
// them straight to the client's GitHub repo (static HTML sites — X-Act pattern:
// blog/<slug>.html at the same depth as services/, so the site's own nav/footer
// shell is reused verbatim). One publish = one atomic commit (post + blog index
// + sitemap.xml + llms.txt + netlify.toml redirect) → Netlify auto-deploys.
//
// Generation runs in the background worker (kind "content-generate"); publish
// is a few GitHub API calls and runs inline in the route.

import { runWebGroundedJSON } from "./aiScan";
import {
  getBusiness, getContentPost, updateContentPost, listPublishedPosts,
  listTrackedPrompts, getProbeResults,
} from "./db";
import { getRepoFile, listRepoPaths, commitFiles, getDefaultBranch, githubConfigured } from "./github";

// ── Topic suggestions: the prompts AI engines are NOT mentioning the client for ──

export interface TopicSuggestion {
  targetPrompt: string;
  mentionRate: number;      // 0-100 across recent probes
  enginesMissing: string[]; // engines that never mentioned the business
  probes: number;
}

export async function suggestTopics(businessId: string): Promise<TopicSuggestion[]> {
  const [prompts, results] = await Promise.all([
    listTrackedPrompts(businessId),
    getProbeResults(businessId, 30),
  ]);
  const byPrompt = new Map<string, { mentioned: number; total: number; missing: Set<string>; seen: Set<string> }>();
  for (const r of results as Array<{ prompt_id?: string; engine?: string; mentioned?: boolean }>) {
    if (!r.prompt_id || !r.engine) continue;
    let agg = byPrompt.get(r.prompt_id);
    if (!agg) { agg = { mentioned: 0, total: 0, missing: new Set(), seen: new Set() }; byPrompt.set(r.prompt_id, agg); }
    agg.total += 1;
    agg.seen.add(r.engine);
    if (r.mentioned) agg.mentioned += 1; else agg.missing.add(r.engine);
  }
  const out: TopicSuggestion[] = [];
  for (const p of prompts) {
    const agg = byPrompt.get(p.id);
    if (!agg || !agg.total) continue;
    const rate = Math.round((100 * agg.mentioned) / agg.total);
    // Only suggest where there's real ground to gain.
    if (rate >= 80) continue;
    const alwaysMissing = [...agg.missing].filter((e) => {
      const engineRows = (results as Array<{ prompt_id?: string; engine?: string; mentioned?: boolean }>)
        .filter((r) => r.prompt_id === p.id && r.engine === e);
      return engineRows.length > 0 && engineRows.every((r) => !r.mentioned);
    });
    out.push({ targetPrompt: p.prompt, mentionRate: rate, enginesMissing: alwaysMissing, probes: agg.total });
  }
  out.sort((a, b) => a.mentionRate - b.mentionRate);
  return out.slice(0, 12);
}

// ── Generation (background worker) ────────────────────────────────────────────

const CONTENT_SYSTEM = `You are 6Signal's senior content writer producing a publish-ready article page for a local contractor's STATIC HTML website. The article's job is to make AI engines (ChatGPT, Gemini, Perplexity, Google AI Overviews) cite and recommend this business for the target buyer query.

Use the web_search tool to ground every factual claim (local specifics, costs, code requirements, seasonal factors for this city/region). Never invent prices, review counts, or credentials beyond what you're told about the business.

Writing rules:
- Written for a homeowner/buyer, not for Google: direct, useful, specific to the trade and city. 1,000-1,500 words of body content.
- Answer-first structure: the opening paragraph directly answers the target query in 2-3 sentences (this is what AI engines extract), then the article earns depth.
- Name the business naturally 3-5 times, including once in the opening answer and once in the closing CTA. Include the city/service area repeatedly but naturally.
- No hype, no exclamation points, no "In today's world". Short paragraphs. Concrete numbers and specifics beat adjectives.

HTML rules — this is inserted into the site's existing shell as the page <main>:
- You are given a TEMPLATE SAMPLE from the site's own pages. Reuse its exact class names, CSS variables, and inline-style idioms so the article is indistinguishable from the site's hand-built pages.
- Structure: <section class="page-hero"> (with breadcrumb Home / Guides / <short label> and an h1 using the site's display classes) → article body sections inside the site's container/dark-panel pattern (use h2 headings the way the template styles section titles) → an FAQ section (4-5 questions, styled like the template's FAQ blocks) → a closing CTA section reusing the template's cta-section markup with the business phone number.
- Relative links: the page lives one directory deep (blog/), so ../index.html, ../contact.html, ../services/<page>.html, ../styles.css.
- Link to 2-3 relevant existing pages of the site in the body text.
- Do NOT include <html>, <head>, <body>, <nav>, or <footer> — main content only.

Return ONLY valid JSON, no prose or fences:
{
  "title": "SEO title, <=60 chars, includes trade + city",
  "slug": "kebab-case-url-slug",
  "meta_description": "<=155 chars, answer-flavored",
  "summary": "one sentence for the blog index and llms.txt",
  "faqs": [ { "q": "", "a": "2-3 sentence answer" } ],
  "article_html": "the full <main> inner HTML as described"
}
Limits: faqs 4-5 items. Escape the HTML properly for JSON.`;

export async function runContentGeneration(args: { postId: string; businessId: string }): Promise<void> {
  const { postId, businessId } = args;
  try {
    const [post, business] = await Promise.all([getContentPost(postId), getBusiness(businessId)]);
    if (!post || !business) throw new Error("post or business not found");
    const targetPrompt = String(post.target_prompt || `best ${business.trade} in ${business.city}`);

    // Ground the writer in the client site's own markup + existing content.
    let templateSample = "";
    let existing: string[] = [];
    if (business.github_repo) {
      try {
        const branch = await getDefaultBranch(business.github_repo).catch(() => "main");
        const paths = await listRepoPaths(business.github_repo, branch);
        const tpl = paths.find((p) => /^services\/.+\.html$/.test(p)) || paths.find((p) => p === "index.html");
        if (tpl) {
          const html = await getRepoFile(business.github_repo, tpl, branch);
          const main = html?.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? "";
          templateSample = main.slice(0, 6000);
        }
        existing = paths.filter((p) => p.endsWith(".html")).slice(0, 40);
      } catch (e) {
        console.warn("[content] template fetch failed (continuing unstyled):", e);
      }
    }
    const published = await listPublishedPosts(businessId);

    const user = `Write the article.

Business: ${business.name}
Trade: ${business.trade}
City / service area: ${business.city}
Website: ${business.url ?? "(unknown)"}

TARGET BUYER QUERY (the article must be the best answer on the internet to this):
"${targetPrompt}"

EXISTING SITE PAGES (link to the relevant ones with ../ paths):
${existing.join("\n") || "(unknown)"}

ALREADY-PUBLISHED GUIDES (do not duplicate these topics or slugs):
${published.map((p) => `${p.slug} — ${p.title}`).join("\n") || "(none yet)"}

TEMPLATE SAMPLE — the site's own <main> markup; mirror its classes and style idioms exactly:
${templateSample || "(no template available — use clean semantic HTML with minimal inline styles)"}

Search the web for local/technical grounding, then return the JSON.`;

    const doc = await runWebGroundedJSON({ system: CONTENT_SYSTEM, user, maxTokens: 16000, maxSearches: 4 });
    const slug = String(doc.slug || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
    if (!slug || !doc.title || !doc.article_html) throw new Error("model returned incomplete article");
    await updateContentPost(postId, {
      status: "draft",
      title: String(doc.title),
      slug,
      meta_description: String(doc.meta_description ?? ""),
      summary: String(doc.summary ?? ""),
      faqs: Array.isArray(doc.faqs) ? doc.faqs : [],
      article_html: String(doc.article_html),
    });
  } catch (e) {
    console.error("[content] generation failed:", e);
    await updateContentPost(postId, { status: "failed" });
  }
}

// ── Publish: assemble the full page in the site's own shell and commit ────────

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function siteBaseFrom(templateHtml: string, fallbackUrl: string | null): string {
  const canon = templateHtml.match(/<link rel="canonical" href="(https?:\/\/[^/"]+)/i)?.[1];
  if (canon) return canon;
  if (fallbackUrl) { try { return new URL(fallbackUrl).origin; } catch { /* fall through */ } }
  throw new Error("Cannot determine the site's base URL (no canonical tag, no business URL).");
}

interface Shell { nav: string; foot: string; favicon: string; base: string }

function extractShell(templateHtml: string, fallbackUrl: string | null): Shell {
  const body = templateHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1];
  if (!body) throw new Error("Template page has no <body>.");
  const mainStart = body.search(/<main[\s>]/i);
  const mainEnd = body.search(/<\/main>/i);
  if (mainStart < 0 || mainEnd < 0) throw new Error("Template page has no <main> to split on.");
  const nav = body.slice(0, mainStart).replace(/ class="active"/g, "");
  const foot = body.slice(mainEnd + "</main>".length);
  const favicon = templateHtml.match(/<link rel="icon"[^>]*>/i)?.[0] ?? "";
  return { nav, foot, favicon, base: siteBaseFrom(templateHtml, fallbackUrl) };
}

interface PostDoc {
  title: string; slug: string; meta_description: string; summary: string;
  article_html: string; faqs: Array<{ q: string; a: string }>;
}

function buildPostPage(shell: Shell, businessName: string, doc: PostDoc, publishedISO: string): string {
  const url = `${shell.base}/blog/${doc.slug}`;
  const blogPosting = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: doc.title, description: doc.meta_description,
    datePublished: publishedISO, dateModified: publishedISO,
    author: { "@type": "Organization", name: businessName },
    publisher: { "@type": "Organization", name: businessName },
    mainEntityOfPage: url,
  };
  const faqPage = doc.faqs?.length ? {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: doc.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  } : null;
  const breadcrumb = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${shell.base}/` },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${shell.base}/blog` },
      { "@type": "ListItem", position: 3, name: doc.title, item: url },
    ],
  };
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(doc.title)}</title>
  <meta name="description" content="${esc(doc.meta_description)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(doc.title)}">
  <meta property="og:description" content="${esc(doc.meta_description)}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${esc(doc.title)}">
  <meta name="twitter:description" content="${esc(doc.meta_description)}">
  <script type="application/ld+json">${JSON.stringify(blogPosting)}</script>
${faqPage ? `  <script type="application/ld+json">${JSON.stringify(faqPage)}</script>\n` : ""}  <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
  <link rel="stylesheet" href="../styles.css">
  ${shell.favicon}
</head>
<body>
${shell.nav}
  <main>
${doc.article_html}
  </main>
${shell.foot}
</body>
</html>
`;
}

function buildIndexPage(shell: Shell, businessName: string, posts: Array<{ slug: string; title: string; summary: string | null; published_at: string }>): string {
  const url = `${shell.base}/blog`;
  const cards = posts.map((p) => `        <a href="${esc(p.slug)}.html" style="display:block;background:var(--dark-2);border:1px solid var(--border);padding:1.5rem;margin-bottom:1rem;text-decoration:none;position:relative;">
          <div style="position:absolute;top:0;left:0;width:3px;height:100%;background:var(--red);"></div>
          <p style="font-family:var(--font-mono);font-size:.62rem;letter-spacing:.15em;text-transform:uppercase;color:var(--red);margin-bottom:.4rem;">${esc((p.published_at || "").slice(0, 10))}</p>
          <p style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;text-transform:uppercase;color:var(--white);margin-bottom:.4rem;">${esc(p.title)}</p>
          <p style="font-size:.88rem;color:var(--white-dim);line-height:1.6;">${esc(p.summary ?? "")}</p>
        </a>`).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guides &amp; Advice | ${esc(businessName)}</title>
  <meta name="description" content="Practical guides and local advice from ${esc(businessName)}.">
  <link rel="canonical" href="${url}">
  <link rel="stylesheet" href="../styles.css">
  ${shell.favicon}
</head>
<body>
${shell.nav}
  <main>
    <section class="page-hero">
      <div class="grid-overlay" aria-hidden="true"></div>
      <div class="container">
        <div class="page-hero-inner">
          <div>
            <nav class="page-hero-breadcrumb" aria-label="Breadcrumb">
              <a href="../index.html">Home</a>
              <span aria-hidden="true">/</span>
              <span>Guides</span>
            </nav>
            <h1 class="display-lg page-hero-title">Guides &amp; Advice</h1>
          </div>
        </div>
      </div>
    </section>
    <div style="background:var(--dark);padding:4rem 0;">
      <div class="container" style="max-width:760px;">
${cards}
      </div>
    </div>
  </main>
${shell.foot}
</body>
</html>
`;
}

function upsertSitemapUrls(sitemap: string, base: string, slugs: string[]): string {
  let out = sitemap;
  const entries = [`${base}/blog`, ...slugs.map((s) => `${base}/blog/${s}`)];
  for (const loc of entries) {
    if (out.includes(`<loc>${loc}</loc>`)) continue;
    out = out.replace(/<\/urlset>/i, `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n\n</urlset>`);
  }
  return out;
}

function upsertLlmsGuide(llms: string, base: string, title: string, slug: string, summary: string): string {
  const line = `- [${title}](${base}/blog/${slug}): ${summary}`;
  if (llms.includes(`${base}/blog/${slug})`)) return llms;
  if (/^## Guides$/m.test(llms)) {
    return llms.replace(/^## Guides$/m, `## Guides\n\n${line}`).replace(/\n{3,}/g, "\n\n");
  }
  // Insert the section before the closing indexing note (last paragraph) if present, else append.
  return `${llms.trimEnd()}\n\n## Guides\n\n${line}\n`;
}

function ensureBlogRedirect(toml: string): string {
  if (toml.includes('from = "/blog/*"') || toml.includes("from = '/blog/*'")) return toml;
  const block = `
# Guides (auto-added by 6Signal content engine)
[[redirects]]
  from = "/blog"
  to = "/blog/index.html"
  status = 200

[[redirects]]
  from = "/blog/*"
  to = "/blog/:splat.html"
  status = 200
`;
  // Redirects must precede the headers section if one exists; append before first [[headers]].
  const idx = toml.search(/\[\[headers\]\]/);
  return idx >= 0 ? `${toml.slice(0, idx)}${block}\n${toml.slice(idx)}` : `${toml}\n${block}`;
}

export async function publishContentPost(postId: string): Promise<{ url: string; commit: string }> {
  if (!githubConfigured()) throw new Error("GITHUB_TOKEN is not set in Netlify — add the fine-grained PAT (Contents: read/write) as a normal env var, then redeploy.");
  const post = await getContentPost(postId);
  if (!post) throw new Error("Post not found.");
  if (post.status !== "draft" && post.status !== "published") throw new Error(`Post is ${post.status} — only drafts can be published.`);
  const business = await getBusiness(String(post.business_id));
  if (!business) throw new Error("Business not found.");
  const repo = business.github_repo;
  if (!repo) throw new Error("This client has no GitHub repo configured.");

  const doc: PostDoc = {
    title: String(post.title ?? ""), slug: String(post.slug ?? ""),
    meta_description: String(post.meta_description ?? ""), summary: String(post.summary ?? ""),
    article_html: String(post.article_html ?? ""),
    faqs: (Array.isArray(post.faqs) ? post.faqs : []) as Array<{ q: string; a: string }>,
  };
  if (!doc.title || !doc.slug || !doc.article_html) throw new Error("Draft is incomplete (title/slug/body required).");

  const branch = await getDefaultBranch(repo);
  const paths = await listRepoPaths(repo, branch);
  const tplPath = paths.find((p) => /^services\/.+\.html$/.test(p)) || "index.html";
  const [tplHtml, sitemap, llms, toml] = await Promise.all([
    getRepoFile(repo, tplPath, branch),
    getRepoFile(repo, "sitemap.xml", branch),
    getRepoFile(repo, "llms.txt", branch),
    getRepoFile(repo, "netlify.toml", branch),
  ]);
  if (!tplHtml) throw new Error(`Could not read template page ${tplPath} from ${repo}.`);
  const shell = extractShell(tplHtml, business.url);

  const nowISO = new Date().toISOString();
  const already = await listPublishedPosts(String(post.business_id));
  const roster = [
    { slug: doc.slug, title: doc.title, summary: doc.summary, published_at: String(post.published_at ?? nowISO) },
    ...already.filter((p) => p.slug !== doc.slug),
  ];

  const files = [
    { path: `blog/${doc.slug}.html`, content: buildPostPage(shell, business.name, doc, String(post.published_at ?? nowISO)) },
    { path: "blog/index.html", content: buildIndexPage(shell, business.name, roster) },
  ];
  if (sitemap) files.push({ path: "sitemap.xml", content: upsertSitemapUrls(sitemap, shell.base, [doc.slug]) });
  if (llms) files.push({ path: "llms.txt", content: upsertLlmsGuide(llms, shell.base, doc.title, doc.slug, doc.summary) });
  if (toml) {
    const patched = ensureBlogRedirect(toml);
    if (patched !== toml) files.push({ path: "netlify.toml", content: patched });
  }

  const { sha } = await commitFiles(repo, `Publish guide: ${doc.title}\n\nGenerated by 6Signal content engine.`, files);
  const url = `${shell.base}/blog/${doc.slug}`;
  await updateContentPost(postId, {
    status: "published", repo, path: `blog/${doc.slug}.html`, url,
    commit_sha: sha, published_at: post.published_at ?? nowISO,
  });
  return { url, commit: sha };
}
