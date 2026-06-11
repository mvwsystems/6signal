# CLAUDE.md — 6 Signal

Business + technical context for every Claude Code session in this repo. Verified against the
codebase on 2026-06-11. Where stated business facts conflict with the repo, the conflict is
flagged inline — do not silently resolve them.

---

## 1. Company

**6 Signal** (formal: "6 Signal", brand: "6Signal" / "SIXSIGNAL") — a specialized **AI visibility
practice** for residential and commercial contractors: HVAC, plumbing, roofing, electricians,
remodelers, garage doors, landscaping, tree service, pest control, foundation/concrete, and
commercial GCs. Based in Dallas–Fort Worth; serves DFW and select markets beyond Texas.

- Owner/operator: **Matt Vincent Walker** (always full name, never "Matt Walker"). One operator
  per account, one client per market per trade (exclusivity model).
- Site: https://6signal.co · GitHub: `mvwsystems/6signal` · Contact: hello@6signal.co
- Calendly: https://calendly.com/mvw-mattvincentwalker/ai-audit
- **Stated goal:** become #1 globally for AI visibility in residential construction and home
  services. (This is the owner's ambition — the claim does not appear on the site, and the site
  deliberately avoids unverifiable claims; see §5.)

## 2. Methodology — the six-signal stack

The **current, canonical** six signals (used in the audit engine, homepage, /method,
/visibility-check, trade pages, and the layout JSON-LD):

| Signal | Name | What it measures |
|---|---|---|
| GEO | Generative Engine Optimization | Whether ChatGPT/Gemini/Claude/Perplexity name the business in recommendations |
| AEO | Answer Engine Optimization | Citations in Google AI Overviews / direct answers |
| LEO | Local Entity Optimization | GBP strength + citation consistency across Maps/Yelp/directories |
| VEO | Voice Engine Optimization | What Siri/Alexa/Google Assistant answer for the trade + city |
| PEO | Prompt Engine Optimization | Surfacing inside the real query language buyers type/ask |
| IEO | Index Engine Optimization | Whether AI crawlers can access, parse, and extract the site (schema, structure) |

Canonical definitions live in [app/page.tsx](app/page.tsx) (~lines 12–50, duplicated verbatim in
[app/method/page.tsx](app/method/page.tsx), [app/visibility/page.tsx](app/visibility/page.tsx))
and in the audit prompt in [app/api/generate-audit/route.ts](app/api/generate-audit/route.ts).

**⚠️ Inconsistent definitions exist across the repo — flag, don't propagate:**
- [6SIGNAL_BRAND_BRIEF.md](6SIGNAL_BRAND_BRIEF.md) §1 defines a *different* six: Search / AI /
  Local / Trust / Content / Conversion signals. The free-check page
  [app/ai-visibility-check/page.tsx](app/ai-visibility-check/page.tsx) also uses this older set.
- [content/blog/the-6signal-audit-what-we-check.mdx](content/blog/the-6signal-audit-what-we-check.mdx)
  defines yet another six: Website clarity / Local SEO / AI visibility / Conversion flow /
  Reputation / Revenue leakage.
- [content/blog/the-6signal-visibility-audit-what-we-measure-and-why.md](content/blog/the-6signal-visibility-audit-what-we-measure-and-why.md)
  uses a fourth variant (Search visibility / AI answer / Local entity / Service clarity / Proof /
  Conversion path).

When writing new content or code, use **GEO/AEO/LEO/VEO/PEO/IEO**. The brand brief's voice/design
sections remain authoritative; its six-signal list and "free 30-minute audit" entry offer are stale.

## 3. Funnel & pricing (verified in code)

```
Free check (/ai-visibility-check)  — simulated AI answer + email capture (email send: TODO, not built)
  → $27  AI Visibility Brief       (/visibility-check → Stripe → /audit-results)
  → $97  Full Strategy Brief       (upsell on /audit-results → Stripe → /strategy-brief)
  → $197 1-Hour Strategy Call      (Calendly; includes the Strategy Brief free)
  → $1,250/month retainer          (90-day minimum, one contractor per market per trade)
```

Other priced offers: website rebuild **$1,500 flat** ([app/websites/page.tsx](app/websites/page.tsx)),
website care plan **$97/month** ([app/care/page.tsx](app/care/page.tsx)).

Mechanics: form data → `localStorage` (`6sig_audit_data`, `6sig_audit_result`,
`6sig_strategy_result`, `6sig_free_check_data`) → external Stripe checkout links (no Stripe SDK;
success URLs configured in the Stripe dashboard) → results generated client-initiated via the API
routes below. **There is no server-side record of purchases, audits, or leads.**

**⚠️ Takeoff Copilot pricing ($197/job or $497/month founding rate, up to 8 jobs) is NOT in this
repo.** Takeoff Copilot appears on /capabilities and /services as a Labs item ("Beta · Active")
linking to TakeoffCopilot.com with no pricing. The second Labs product is named **"BidCore"** on
/capabilities but **"BidForge"** on /services — a live naming inconsistency (BidForge→BidCore
rename, commit `28cc6eb`, missed /services).

## 4. Positioning

- **Visibility first.** "Not a marketing agency — a specialized visibility practice." Not an SEO
  agency, not an ads agency, not a web design firm, not a software product.
- Five service systems on /capabilities and /services (identical content): **Build** (foundation),
  **Grow** (demand), **Capture** (response), **Automate** (operations), **Advise** (strategy).
- Voice: intelligence-briefing tone — direct, precise, economical, no hype, no exclamation points.
  See [6SIGNAL_BRAND_BRIEF.md](6SIGNAL_BRAND_BRIEF.md) §2 (still authoritative for voice).
- Note: /services and /capabilities are duplicate pages. CODEBASE_CONTEXT says /services 301s to
  /capabilities, but both page files exist with drifting content (the BidCore/BidForge split).

## 5. Proof

**⚠️ The X-Act Plumbing case study (page 2 → top 3 organic, Map Pack, Google AI Overview, ChatGPT,
Perplexity visibility in 3 weeks) is NOT in the repo.** "X-Act Plumbing" appears only as a form
placeholder in [app/ai-visibility-check/page.tsx](app/ai-visibility-check/page.tsx).
[app/proof-data.ts](app/proof-data.ts) contains **only placeholders**: 0 real testimonials, 0 real
case studies (cs-001/cs-002 marked "PLACEHOLDER — Document after 90 days"), 6 illustrative audit
examples marked "example". The homepage explicitly says "We don't publish outcomes we can't
verify." If the X-Act results are real, documenting them in proof-data.ts (with screenshots and
client permission per the protocol already defined there) is the single highest-leverage content
task in the repo.

## 6. Design system

- Background `#060606` (elevated `#0e0e0c`), text `#f5f5f3`, **accent `#E6FF00`** (electric
  yellow — migrated from signal-red 2026-05-04; legacy `--sr` vars alias to it). No other colors.
- Fonts: **Chakra Petch** (display), **Inter** (body), **JetBrains Mono** (labels/eyebrows).
- Border radius 0–2px, thin `rgba(255,255,255,0.07)` borders, no stock photos, no gradients.
- Full spec: [6SIGNAL_BRAND_BRIEF.md](6SIGNAL_BRAND_BRIEF.md) §3–6 (authoritative for design).
- Logo: `/6SIG_LOGO_FINAL_2.webp` — never recreate in code.
- No Superhuman Systems branding exists in this repo; keep it that way.

## 7. Tech stack (actual, verified)

| Layer | Reality |
|---|---|
| Framework | **Next.js 15.5.18, App Router**, React 19, TypeScript (README says Next 14 + "roofing operators" — stale) |
| Styling | Single ~7,000-line [app/globals.css](app/globals.css). Tailwind installed but **zero utility classes used** — never add them |
| Content | MDX/MD blog in `content/blog/` via gray-matter + next-mdx-remote, rendered at `/research/[slug]` |
| AI | Claude API (`claude-haiku-4-5`) called via **raw fetch** (no @anthropic-ai SDK) in 3 routes: [app/api/free-check/route.ts](app/api/free-check/route.ts), [app/api/generate-audit/route.ts](app/api/generate-audit/route.ts), [app/api/generate-strategy/route.ts](app/api/generate-strategy/route.ts). Requires `ANTHROPIC_API_KEY` |
| Hosting | Netlify (`@netlify/plugin-nextjs`), `main` auto-deploys |
| Payments | Stripe via external buy-links (no SDK) + webhook at [app/api/stripe-webhook/route.ts](app/api/stripe-webhook/route.ts) recording `checkout.session.completed` |
| Database | **Supabase** project `6signal` (ref `syysezikhdmqbagfaqrf`, us-east-2) via `@supabase/supabase-js`, server-side only ([app/lib/db.ts](app/lib/db.ts)). Tables: businesses, leads, intakes, purchases, audits, signal_scores, ai_probes, site_snapshots, gbp_snapshots. RLS on, no public policies — service role only. All writes best-effort: missing env = persistence off, funnel unaffected |
| Email | **Resend** via [app/lib/email.ts](app/lib/email.ts) (free-check results, purchase recovery links). Degrades to a logged warning without `RESEND_API_KEY` |
| Analytics | None found |

Required env vars are documented in [.env.example](.env.example) — set them in Netlify
(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`,
`STRIPE_WEBHOOK_SECRET`). The Stripe webhook endpoint must also be added in the Stripe dashboard.

**Audit engine grounding (partial — roadmap #2 in progress):** [app/lib/evidence.ts](app/lib/evidence.ts)
crawls the customer's site (homepage, robots.txt, sitemap, JSON-LD) and computes a
**deterministic IEO score** that is injected into the audit prompt and stored in
`site_snapshots`; generation runs at temperature 0 with a stamped `prompt_version`. The other
five signals are still model-estimated (no AI-engine probing, no GBP lookup yet — probe runners
land when OpenAI/Perplexity/Places keys exist; `ai_probes` and `gbp_snapshots` tables are ready).
The free check still *simulates* an AI answer — it is now labeled "Projected AI Response" with a
disclaimer, and every check persists a lead.

**Funnel persistence flow:** /visibility-check POSTs the form to `/api/intake` before the Stripe
redirect and appends the intake id as Stripe `client_reference_id`. The webhook links the
purchase to the intake and emails the buyer a recovery link (`/audit-results?intake=<id>`), which
regenerates the brief on any device. Completed briefs also get a permalink
(`/audit-results?id=<auditId>` via `/api/audit/[id]`).

## 8. Conventions

- App Router only; server components by default, `"use client"` only when needed.
- All CSS goes in `app/globals.css` — no new CSS files, no CSS modules, no Tailwind utilities.
- New trade page = add data to [app/trades/data.ts](app/trades/data.ts) + thin page importing
  `TradePage`. Blog post = `content/blog/[slug].mdx` with frontmatter (see
  [CODEBASE_CONTEXT.md](CODEBASE_CONTEXT.md) for fields); MDX heading anchors must use
  `<h2 id="...">` HTML, not `{#anchor}`.
- CTA copy for the funnel era: "Get the audit" / "Get My AI Visibility Brief — $27". (The brand
  brief's "Book the Visibility Audit" rules predate the $27 self-serve funnel.)
- JSON-LD: Person + Organization in root layout; trade pages add BreadcrumbList/Service/FAQPage.
- Author byline: always "Matt Vincent Walker".

## 9. Companion docs

- [CODEBASE_CONTEXT.md](CODEBASE_CONTEXT.md) — most current structural reference (routes, funnel, conventions)
- [6SIGNAL_BRAND_BRIEF.md](6SIGNAL_BRAND_BRIEF.md) — voice + design (authoritative); offer/signals sections stale
- [CONTENT_ARCHITECTURE.md](CONTENT_ARCHITECTURE.md) — blog pillar map, internal-link gaps, content roadmap
- [ANALYSIS.md](ANALYSIS.md) — strategic/engineering teardown (2026-06-11)
