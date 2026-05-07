# 6 Signal Blog — How to Add Posts

## Where posts live

All blog posts are `.mdx` files inside:

```
content/blog/
```

Each file is one post. The filename doesn't matter — the `slug` field in the frontmatter controls the URL.

---

## How to create a new post

1. Create a new file in `content/blog/` with a descriptive name:

```
content/blog/your-post-topic-here.mdx
```

2. Add the frontmatter block at the very top of the file:

```yaml
---
title: "Your Post Title Here"
slug: "your-post-url-slug-here"
description: "One or two sentences that appear in search results and on the blog index card. Make it specific and useful."
date: "2026-05-15"
category: "AI Visibility"
author: "Matt Walker"
readTime: "6 min read"
featured: false
tags: ["tag one", "tag two", "tag three"]
---
```

3. Write your post content below the frontmatter using standard Markdown.

---

## Frontmatter fields

| Field | Required | Description |
|---|---|---|
| `title` | Yes | Full post title. Appears in the hero, browser tab, and search results. |
| `slug` | Yes | URL path. Use lowercase, hyphens, no spaces. Example: `how-roofers-rank-in-ai`. |
| `description` | Yes | 1–2 sentence summary. Appears in search results and index cards. |
| `date` | Yes | Publication date in `YYYY-MM-DD` format. |
| `category` | Yes | One of: `AI Visibility`, `Local SEO`, `Lead Generation`, `Automation`, `Strategy`, `Case Study` |
| `author` | Yes | Usually `Matt Walker` |
| `readTime` | Yes | Estimate like `5 min read` or `8 min read`. |
| `featured` | Yes | `true` or `false`. Only one post should be featured at a time — it appears large at the top of the blog index. |
| `tags` | Yes | Array of lowercase strings. Used for display and future filtering. |

---

## Markdown reference

Standard Markdown works in all posts.

**Headings**
```markdown
## Section heading (H2)
### Subsection (H3)
#### Small label (H4 — styled as mono uppercase)
```

**Bold and italic**
```markdown
**This is bold** — renders as white/high-contrast
*This is italic* — renders in slightly dimmed white
```

**Lists**
```markdown
- Item one
- Item two
- Item three
```

Ordered lists:
```markdown
1. Step one
2. Step two
3. Step three
```

**Blockquote**
```markdown
> This renders with an electric yellow left border and is good for pull quotes or key takeaways.
```

**Inline code**
```markdown
Use `code` for technical terms, tool names, or field names.
```

**Code block**
````markdown
```
Multi-line code or config examples go here.
```
````

**Links**
```markdown
[Link text](/internal-page) — internal links
[Link text](https://external.com) — external links
```

**Horizontal rule**
```markdown
---
```
Use sparingly — adds a thin hairline divider between sections.

---

## Categories

Use one of these exactly (case-sensitive):

- `AI Visibility` — GEO, ChatGPT, Perplexity, AI Overviews, voice search
- `Local SEO` — Google Business Profile, Maps, citations, local rankings
- `Lead Generation` — ads, lead capture, conversion, response systems
- `Automation` — CRM, follow-up, missed calls, AI receptionist, workflows
- `Strategy` — owner-level thinking, market positioning, systems
- `Case Study` — real results with specific contractors

---

## Setting a featured post

Only one post should have `featured: true`. The featured post appears prominently at the top of `/blog` with a larger display. All other posts show in the card grid below.

To change the featured post:
1. Find the current `featured: true` post and change it to `featured: false`
2. Set `featured: true` on the new post you want to feature

---

## URL structure

Posts are available at:
```
https://6signal.co/blog/{slug}
```

The slug comes from your frontmatter, not the filename. Keep slugs:
- Lowercase
- Hyphen-separated
- Descriptive and keyword-rich
- No trailing slashes

Good: `how-hvac-contractors-rank-in-chatgpt`
Bad: `post-1`, `new-article`, `Blog Post April`

---

## After adding a post

The sitemap at `/sitemap.xml` is generated automatically and will include new posts on the next build/deploy.

No code changes are needed — just add the `.mdx` file and push to GitHub. Vercel will build and deploy automatically.

---

## CTAs inside posts

Every post automatically gets:
- A **mid-article CTA** after the main body (Book the Visibility Audit)
- A **bottom CTA** section after the article

You do not need to add CTAs manually in the post content. Write the content and the CTAs are injected automatically by the layout.

---

## Example post skeleton

```mdx
---
title: "How Roofers Can Dominate AI Search in Their Market"
slug: "how-roofers-dominate-ai-search"
description: "Most roofing companies are invisible in ChatGPT and Google AI Overviews. Here's the exact signal structure that gets you named."
date: "2026-05-20"
category: "AI Visibility"
author: "Matt Walker"
readTime: "7 min read"
featured: false
tags: ["roofers", "AI visibility", "GEO", "local SEO"]
---

Opening paragraph — set the context and the problem in plain language.

## First section heading

Body paragraph. Keep sentences short. Write for a contractor owner who is busy, skeptical of marketing fluff, and wants actionable information.

- Bullet point one
- Bullet point two
- Bullet point three

## Second section heading

More content here.

> Key takeaway or pull quote goes in a blockquote.

## What to do first

Prioritized action items work well as numbered lists:

1. First action
2. Second action
3. Third action

---

Closing paragraph that connects back to the audit or next step.
```
