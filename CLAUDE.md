# CLAUDE.md — 6 Signal

Business + technical context for every Claude Code session in this repo. Verified against the
codebase on 2026-07-23. Where stated business facts conflict with the repo, the conflict is
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

**Taxonomy status (updated 2026-07-23):** the two blog posts that previously taught alternative
six-signal sets were rewritten onto the canonical spine on 2026-07-22/23. The only remaining
stale definition is [6SIGNAL_BRAND_BRIEF.md](6SIGNAL_BRAND_BRIEF.md) §1 (Search / AI / Local /
Trust / Content / Conversion) — flag, don't propagate. Canonical priority ordering (published in
both audit articles): LEO → IEO → AEO → GEO/PEO → VEO, with conversion framed as a revenue
multiplier, not a signal.

When writing new content or code, use **GEO/AEO/LEO/VEO/PEO/IEO**. The brand brief's voice/design
sections remain authoritative; its six-signal list and "free 30-minute audit" entry offer are stale.

## 3. Funnel & pricing (verified in code)

```
Free check (/ai-visibility-check)  — simulated AI answer + email capture (result emailed via /api/send-free-check-email)
  → $27  AI Visibility Audit       (/visibility-check → Stripe → /audit-results)
  → $97  Strategy Brief            (upsell on /audit-results → Stripe → /strategy-brief)
  → $197 Strategy Call             (Stripe → Calendly; includes the Strategy Brief free)
  → $1,500/month retainer          (90-day minimum, one contractor per market per trade)
```

Other priced offers: website rebuild **$1,500 flat** ([app/websites/page.tsx](app/websites/page.tsx)),
website care plan **$97/month** ([app/care/page.tsx](app/care/page.tsx)).

Mechanics: form data → `localStorage` (`6sig_audit_data`, `6sig_audit_result`,
`6sig_strategy_result`, `6sig_free_check_data`) → external Stripe checkout links (no Stripe SDK;
success URLs configured in the Stripe dashboard) → results generated client-initiated via the API
routes below. **There is no server-side record of purchases, audits, or leads.**

**⚠️ Takeoff Copilot pricing ($197/job or $497/month founding rate, up to 8 jobs) is NOT in this
repo.** Takeoff Copilot appears on /capabilities as a Labs item ("Beta · Active") linking to
TakeoffCopilot.com with no pricing. The second Labs product is "BidCore" (the old BidForge
naming is fully gone; /services was deleted 2026-07-22 and 301s to /capabilities).

## 4. Positioning

- **Visibility-led, not visibility-only (restructured 2026-07-24).** The public practice map is
  **The Climb** — four rungs: **Start** (brand + web → /websites, /care), **Stabilize**
  (front-office AI: receptionist, booking, email triage → /stabilize), **Scale** (visibility-led
  growth; the six signals live here, SEO/ads are amplifiers → the funnel), **Systemize** (AI
  infrastructure for internal ops → /systemize). /capabilities is the ladder overview ("The
  Climb"); the old five-bucket framing (Build/Grow/Capture/Automate/Advise) is retired. Two
  further rungs (Segment, Sell/M&A) were deliberately dropped — outside operator competence.
- **Premium anti-agency framing:** "6 Signal is not an agency — a specialized practice run by
  one operator; the person you talk to is the person who does the work, at every rung." Never
  "agency," "packages," or account-manager language. Homepage hero stays visibility-led — the
  Climb is a progression, never a menu.
- **Stabilize/Systemize entry (paid-gate philosophy extended):** free on-site AI **team
  training** (60–90 min) as door-opener, qualified only (existing clients, referrals, ~$1M+
  revenue) → paid **scoping**: $500 remote / $1,000 on-site (DFW), 100% credited toward the
  build within 30 days → fixed-scope proposal from the dashboard proposal builder. Every rung
  prices as **build fee + monthly run fee**; project pricing never published.
- Voice: intelligence-briefing tone — direct, precise, economical, no hype, no exclamation points.
  See [6SIGNAL_BRAND_BRIEF.md](6SIGNAL_BRAND_BRIEF.md) §2 (still authoritative for voice).
- /services was deleted 2026-07-22 (was an unreachable duplicate of /capabilities behind a 301).

## 5. Proof

**X-Act Plumbing is documented and published (2026-07-22, client permission via owner).**
[app/proof-data.ts](app/proof-data.ts) `cs-xact-plumbing` is status `"real"`, with every number
pulled from the internal tracking system (629 probes, July 7–20 2026): Gemini 92%, ChatGPT 74%,
Perplexity 69% mention rates; Maps present at 25/25 grid points. Surfaced on the homepage
outcomes note, /visibility-check (docline strip), and /work. **Deliberately unpublished** (owner's
manual pre-tracking baseline, unrecorded): AI Overview citations, "Map Pack top 3", "page 2 →
top 3 organic", "in 3 weeks" — see the provenance comment in proof-data.ts; dated screenshots
would unlock them. Six real client website builds are featured on /websites (incl. Bennett Steel Supply at reelsteelusa.com — steel supplier, the one non-contractor build). Still placeholders:
testimonials, client logos, before/after screenshots, and the full 90-day case study.

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
| Analytics | **Plausible** (traffic + referrers/AI engines, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`), **Microsoft Clarity** (recordings/heatmaps), **Meta Pixel** (ads). Conversion events fan out to Meta + Plausible from `app/lib/fbq.ts`. First-touch attribution (`app/lib/attribution.ts`) rides every funnel POST into `leads.attribution` / `intakes.attribution` |

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
- **Every full page renders three shell components: `Nav`, `Footer`, and `BlogPageClient`** (after
  Footer). BlogPageClient provides the custom cursor and the reveal/micro-interaction hook — omit it
  and the page has no cursor and every `.reveal` element stays invisible at full height. Also: the
  reveal observer runs once at mount, so client components that re-mount `.reveal` elements after a
  state change must reveal them manually (see ResearchContent's filter-change effect).
- All CSS goes in `app/globals.css` — no new CSS files, no CSS modules, no Tailwind utilities.
- New trade page = add data to [app/trades/data.ts](app/trades/data.ts) + thin page importing
  `TradePage`. Blog post = `content/blog/[slug].mdx` with frontmatter (see
  [CODEBASE_CONTEXT.md](CODEBASE_CONTEXT.md) for fields); MDX heading anchors must use
  `<h2 id="...">` HTML, not `{#anchor}`.
- CTA copy for the funnel era: "Get the audit" / "Get My AI Visibility Audit — $27". Canonical
  tier names (locked 2026-07-21): $27 = "AI Visibility Audit", $97 = "Strategy Brief",
  $197 = "Strategy Call". Never call the $27 product a "brief" — the two-brief naming collision
  was deliberately eliminated. The funnel is fully self-serve until the paid $197 call; never
  write copy promising a free call, intake→readout flow, or "priced on your call". (The brand
  brief's "Book the Visibility Audit" rules predate the $27 self-serve funnel.)
- JSON-LD: Person + Organization in root layout; trade pages add BreadcrumbList/Service/FAQPage.
- Author byline: always "Matt Vincent Walker".

## 9. Companion docs

- [OFFER_TRUTH.md](OFFER_TRUTH.md) — the locked source of truth for the $27 AI Visibility Audit
  (name, price framing, deliverables, refund/exclusivity language, ladder position, canonical
  objection answers). Copy that contradicts it is wrong; change the doc first, then the copy.
- [WEBSITE_BUILD_PLAYBOOK.md](WEBSITE_BUILD_PLAYBOOK.md) — template CLAUDE.md for client website
  builds: copy into each new build folder as `CLAUDE.md`; the owner pastes the 🔥 intake email as
  the kickoff. Client builds NEVER happen in this repo.
- [CODEBASE_CONTEXT.md](CODEBASE_CONTEXT.md) — most current structural reference (routes, funnel, conventions)
- [6SIGNAL_BRAND_BRIEF.md](6SIGNAL_BRAND_BRIEF.md) — voice + design (authoritative); offer/signals sections stale
- [CONTENT_ARCHITECTURE.md](CONTENT_ARCHITECTURE.md) — blog pillar map, internal-link gaps, content roadmap
- [ANALYSIS.md](ANALYSIS.md) — strategic/engineering teardown (2026-06-11)
