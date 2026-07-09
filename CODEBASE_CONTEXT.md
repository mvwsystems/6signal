# 6Signal Codebase Context
> For use with Claude.ai to write prompts for Claude Code.

---

## Project Overview

**Site:** https://6signal.co  
**Owner:** Matt Vincent Walker  
**Business:** AI visibility practice for residential and commercial contractors. Helps contractors get named by ChatGPT, Google AI Overviews, Maps, voice search, and answer engines.  
**Framework:** 6-signal system — GEO, PEO, AEO, IEO, LEO, VEO  
**Location:** Dallas–Fort Worth, TX  

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5.18 (App Router) |
| Language | TypeScript 5.4 |
| React | 19.2.0 |
| Styling | Custom CSS (`app/globals.css`) — no Tailwind used in practice |
| Blog/Content | MDX files parsed with `gray-matter` + `next-mdx-remote` |
| Deployment | Netlify (via `@netlify/plugin-nextjs`) |
| Repo | GitHub → `mvwsystems/6signal` |
| Payment | Stripe (external checkout links, no SDK in codebase) |
| AI APIs | Claude API (Anthropic) via `/api/generate-audit` and `/api/generate-strategy` |
| Forms | Typeform (legacy — `AuditPopupButton` now replaced with Link to `/visibility-check`) |

---

## Repository Structure

```
app/
  layout.tsx              ← Root layout (fonts, Person + Org JSON-LD schema on every page)
  globals.css             ← All CSS (single large file, ~7000+ lines)
  page.tsx                ← Homepage
  
  ── Funnel Pages ─────────────────────────────────
  visibility-check/       ← $27 entry: form + Stripe redirect
  audit-results/          ← Audit brief output page (post-Stripe)
  strategy-brief/         ← $97 strategy document output page
  preview-funnel/         ← Internal test/preview page for funnel
  
  ── Marketing Pages ──────────────────────────────
  audit/                  ← Audit info/detail page
  visibility/             ← Visibility explainer landing page
  ai-visibility-check/    ← Market shift landing page (animated header)
  method/                 ← The 6Signal method explainer
  services/               ← Services overview
  capabilities/           ← Capabilities + lab products (BidCore, etc.)
  work/                   ← Work/case studies page
  contact/                ← Contact + inquiry form
  follow-up/              ← AI follow-up layer product page
  care/                   ← Care page
  websites/               ← Websites product page
  apple/                  ← Apple Maps Readiness Setup landing page
  
  ── Trade Landing Pages ──────────────────────────
  roofers/
  plumbers/
  hvac/
  electricians/
  remodelers/
  garage-doors/
  landscaping/
  tree-service/
  pest-control/
  foundation-concrete/
  commercial-contractors/
  
  ── Research / Blog ──────────────────────────────
  research/
    page.tsx              ← Research hub index
    [slug]/page.tsx       ← Individual post template (dynamic)
    ai-visibility-tools/  ← AI Visibility Tools Index (82 tools)
  
  ── API Routes ───────────────────────────────────
  api/
    generate-audit/       ← POST: generates AI Visibility Brief from form data
    generate-strategy/    ← POST: generates full strategy doc from audit data

  ── Components ───────────────────────────────────
  components/
    Nav.tsx               ← Site nav (with mobile overlay)
    Footer.tsx            ← Site footer
    AuditPopupButton.tsx  ← Now a Link to /visibility-check (was Typeform popup)
    BlogCTA.tsx           ← Inline CTA block for MDX content
    BlogPageClient.tsx    ← Client wrapper for blog pages (cursor + mobile CTA)
    TradePage.tsx         ← Shared template for all trade landing pages
    CommercialPage.tsx    ← Commercial contractors page component
    AppleMapsReadinessPage.tsx
    ResearchContent.tsx   ← Category tabs + post grid on /research
    KineticBand.tsx       ← Animated band component
    proof/                ← AuditExamplesSection and related proof components

  ── Lib / Data ───────────────────────────────────
  lib/
    blog.ts               ← getAllPosts(), getPostBySlug(), formatDate(), types
  trades/
    data.ts               ← TradeData type + all trade page data (metadata, copy, FAQs)
  data/
    aiVisibilityTools.ts  ← 82-tool dataset for /research/ai-visibility-tools
  hooks/
    useMicroInteractions.ts ← Cursor dot/ring, reveal animations, FAQ accordions

content/
  blog/                   ← 28 MDX/MD blog posts (frontmatter + content)
```

---

## Paid Funnel Flow

```
/visibility-check
  ↓ (user fills form: business name, URL, trade, city, competitors)
  ↓ (saves to localStorage: "6sig_audit_data")
  ↓ (redirects to Stripe — $27)
  
Stripe checkout
  ↓ (on success, redirects back to /audit-results)
  
/audit-results
  ↓ (reads localStorage, calls /api/generate-audit via POST)
  ↓ (streams response, renders 8-section AI Visibility Intelligence Brief)
  ↓ (saves result to localStorage: "6sig_audit_result")
  ↓ (shows two upsells)
  
  Upsell A → Stripe $97 → /strategy-brief
  Upsell B → Calendly → 1-Hour Strategy Call ($197)
  
/strategy-brief
  ↓ (reads localStorage, calls /api/generate-strategy via POST)
  ↓ (streams response, renders full written strategy document)
  ↓ Final CTA: Book the 1-Hour Strategy Call — $197 → Calendly
```

**localStorage keys:**
- `6sig_audit_data` — form inputs (business name, URL, trade, city, competitors)
- `6sig_audit_result` — generated audit JSON
- `6sig_strategy_result` — generated strategy JSON

**Cache-first pattern:** Both `/audit-results` and `/strategy-brief` check localStorage for pre-generated results before calling the API. The `/preview-funnel` page pre-generates both and caches them so results render instantly.

---

## Blog / Research System

**Content location:** `content/blog/*.md` and `content/blog/*.mdx`

**Frontmatter fields:**
```yaml
title: "Post Title"
slug: "url-slug"
description: "Meta description / deck"
date: "2026-05-25"          # ISO 8601
category: "AI Visibility"   # or "Training", "White Paper", "Insight", "Local Visibility"
author: "Matt Vincent Walker"
readTime: "10 min read"
featured: true              # optional — surfaces in featured sections
tags:
  - AI Visibility
  - AEO
faq:                        # optional — generates FAQPage JSON-LD schema
  - q: "Question?"
    a: "Answer."
```

**URL pattern:** `/research/[slug]`

**Post template** (`app/research/[slug]/page.tsx`):
- Renders MDX with custom components (`BlogCTA`)
- JSON-LD: Article + BreadcrumbList + optional FAQPage (from frontmatter `faq`)
- Mid-article CTA block
- Related posts
- Bottom CTA

**Custom MDX components available in posts:**
- `<BlogCTA label="" headline="" subheadline="" buttonText="" buttonHref="" />`

**Note:** MDX uses acorn parser — use `<h2 id="anchor">` HTML syntax for heading anchors, NOT `## Heading {#anchor}` (that causes parse errors).

---

## Schema / JSON-LD

**Root layout (every page):**
- Person schema: Matt Vincent Walker → mattvincentwalker.com
- Organization schema: 6 Signal → 6signal.co, founder: Matt Vincent Walker

**Trade pages:**
- BreadcrumbList
- Service schema
- FAQPage (from `data.faqs`)

**Research slug pages:**
- Article (headline, datePublished, author + url, publisher)
- BreadcrumbList
- FAQPage (optional, from frontmatter `faq` array)

**Commercial page:**
- BreadcrumbList + Service + FAQPage

---

## Trade Page System

All trade pages use the shared `TradePage` component fed by data from `app/trades/data.ts`.

**Trade slugs:** `/roofers`, `/plumbers`, `/hvac`, `/electricians`, `/remodelers`, `/garage-doors`, `/landscaping`, `/tree-service`, `/pest-control`, `/foundation-concrete`

Commercial contractors uses its own `CommercialPage` component at `/commercial-contractors`.

---

## CSS Architecture

Single file: `app/globals.css`

- No Tailwind utility classes in practice (package installed but not used)
- CSS custom properties defined in `:root`
- Key variables: `--accent: #E6FF00` (neon lime), `--bg: #060606`, `--text: #f5f5f3`
- Fonts: Chakra Petch (display), Inter (body), JetBrains Mono (idx/mono labels)
- `.idx` = small monospace eyebrow label class
- `.reveal` = scroll animation class (opacity + translateY, toggled to `.in` by useMicroInteractions)
- `.btn-primary` = neon lime fill button, `.btn-ghost` = outlined button

**Known specificity override needed:** `.post-body a` (specificity 11) overrides `.btn-primary` (10) — fixed with `.post-body .blog-cta-block a.btn-primary { color: #060606; }`

---

## API Routes

### `/api/generate-audit` (POST)
- Input: `{ formData: { name, url, trade, city, competitors } }`
- Calls Claude API (Haiku model for speed)
- Streams JSON response
- Returns: audit object with 8 sections (scores, findings, gaps per signal)
- Netlify 60s timeout constraint — model + prompt tuned for ~54s completion

### `/api/generate-strategy` (POST)
- Input: `{ audit: <audit object> }`
- Calls Claude API (Haiku model)
- Streams JSON response
- Returns: strategy object (signal_plans, content_architecture, schema_plan, review_strategy, 90_day_calendar, quick_wins, closing_note)
- ~41s completion

---

## Key People / Contacts

- **Owner/Operator:** Matt Vincent Walker
- **Contact email:** hello@6signal.co / mvw@mattvincentwalker.com
- **Calendly:** https://calendly.com/mvw-mattvincentwalker/ai-audit
- **Personal site:** https://mattvincentwalker.com

---

## Deployment

- **Host:** Netlify
- **Branch:** `main` → auto-deploys on push
- **Repo:** https://github.com/mvwsystems/6signal
- **Stripe success URLs** must be configured in Stripe Dashboard (not in code)

---

## Conventions for Prompting Claude Code

- All edits should target the App Router structure (`app/` directory)
- No new CSS files — all styles go in `app/globals.css`
- No Tailwind utility classes
- Trade pages: add data to `app/trades/data.ts`, create `app/[slug]/page.tsx` that imports `TradePage`
- Blog posts: create `content/blog/[slug].mdx` with correct frontmatter
- Server components by default; add `"use client"` only when hooks/interactivity needed
- `AuditPopupButton` is now just a `<Link href="/visibility-check">` wrapper — use it for all audit CTAs
- Button text convention: "Get the audit" / "Get the AI Visibility Brief" (not "Book the audit")
- Author name: always "Matt Vincent Walker" (not "Matt Walker")
- Commit message style: imperative, descriptive, include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
