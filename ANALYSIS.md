# ANALYSIS.md — 6 Signal Strategic & Engineering Teardown

**Date:** 2026-06-11 · **Scope:** audit engine, prompts, scoring, funnel, methodology docs.
**Findings only — no code changed.** Written against the goal: category-defining AI visibility
company, most advanced capabilities, most data-driven products.

---

## 1. Audit Engine Rigor

### The core finding: the engine measures nothing.

All three API routes ([free-check](app/api/free-check/route.ts),
[generate-audit](app/api/generate-audit/route.ts),
[generate-strategy](app/api/generate-strategy/route.ts)) send **only the form fields** —
`{name, url, trade, city, competitors}` — to Claude Haiku and ask it to invent the rest. There is:

- **No website fetch.** The customer's URL is passed as a string and never requested. The audit
  scores IEO ("whether AI crawlers can access, parse, and extract your site") without ever
  loading the site. A customer with perfect schema and a customer with a broken site get scores
  drawn from the same prior.
- **No AI-engine probing.** GEO/AEO/VEO scores claim to measure what ChatGPT, Perplexity, Google
  AI Overviews, Siri, and Alexa say — none are queried. Haiku guesses from training data.
- **No GBP / Maps / directory lookup.** LEO is scored with zero citations checked.
- **No SERP data.** Nothing from Google, Bing, or any rank source.

The system prompt even instructs the model to fake specificity: *"Every insight must be specific
to THIS business"* — with no information about this business beyond its name and city. The
model complies by writing plausible, confident, unverifiable prose. That is exactly the product
shape a competitor or a savvy customer can dismiss in one sentence: **"They charge $27 for a
hallucination with your name mail-merged in."**

### The free check is worse than unrigorous — it's misleading.

[/ai-visibility-check](app/ai-visibility-check/page.tsx) promises: *"We'll show you exactly what
ChatGPT returns when a customer asks for your trade in your city."* The
[free-check route](app/api/free-check/route.ts) does not call ChatGPT. It tells Claude to
**"simulate"** an AI answer, to *"name 2-3 real or plausible competitor businesses"*, to never
hedge, and to **default `found: false`** for any independent contractor. So the product shows a
fabricated AI response with potentially invented competitor names, presented as real output, with
a predetermined negative verdict that feeds the $27 upsell.

This is the single largest credibility risk in the business. For a company whose entire pitch is
"AI systems must be able to trust what you publish," publishing a simulated AI answer as if it
were real is self-disqualifying the day anyone screenshots it next to actual ChatGPT output
naming the business. The irony writes the competitor's takedown post for them.
**Fix:** either query a real engine (one OpenAI/Perplexity API call costs less than a cent — less
than the Stripe fee on the $27) or relabel honestly ("projected response based on your current
signal footprint").

### Scoring is structurally indefensible as published.

- **Scores are non-repeatable.** generate-audit and generate-strategy don't set temperature; the
  same business submitted twice gets different scores. A 0–100 scale implies precision the
  system doesn't have — a customer scoring 34 then 51 on a re-run has proof it's arbitrary.
- **The scale is prompt-folklore.** "Most businesses fall between 10 and 65" is an instruction to
  the model, not a property of a measurement. Grade thresholds (90=A …) attach letter-grade
  authority to noise.
- **Overall = unweighted mean of six guesses.** No rationale for equal weighting; VEO (a thin
  derivative of LEO in practice) counts the same as GEO (the headline promise).
- **The prompt optimizes for latency, not truth.** "CRITICAL LENGTH CONSTRAINT: every field 1–2
  sentences… violating this causes generation to time out." The deliverable's depth ceiling is a
  Netlify timeout. That's an infrastructure decision shaping the product's intelligence.
- **The competitors field is collected and barely used** — interpolated into one prompt line,
  never verified, never probed.

### What would make each signal measurable, repeatable, citable

| Signal | Measurable proxy (all automatable) | Source |
|---|---|---|
| **GEO** | N standardized prompts ("best {trade} in {city}", "who should I call for {problem} in {city}" …) run against ChatGPT, Perplexity, Gemini APIs; score = mention rate + rank position + sentiment, averaged over runs. Store raw transcripts as evidence. | OpenAI / Perplexity / Gemini APIs |
| **AEO** | Presence/citation in Google AI Overviews + featured snippets for the query set; SERP API snapshot. | SerpAPI / DataForSEO |
| **LEO** | Google Places API: rating, review count, review velocity, categories, hours completeness; NAP consistency across Yelp/BBB/Angi (scrape or Places + a citations API). Deterministic checklist → deterministic score. | Google Places, Yelp Fusion |
| **VEO** | Voice assistants mostly resolve to Maps/Bing local; score as a weighted function of LEO + Bing Places presence + speakable schema. Be honest that it's derived. | Bing Places, schema check |
| **PEO** | Coverage of a trade-specific query cluster (the question clusters already defined in the blog!) — does the site have a page/FAQ answering each of the top 25 buyer queries? Crawl + embed + match. | Own crawler + embeddings |
| **IEO** | Fully deterministic: fetch the site → robots.txt allows GPTBot/ClaudeBot/PerplexityBot? JSON-LD LocalBusiness present and valid? Sitemap? Render-blocking JS? Pages reachable? This can be a 20-point checklist with zero LLM involvement. | Own fetcher |

Rule of thumb: **LLM for narrative, never for numbers.** Every score should be computable from
stored evidence a customer (or skeptic) can be shown. That's what "proprietary measurement"
means; right now the proprietary asset is a prompt anyone can paste into claude.ai.

---

## 2. Data Moat

### Current state: there is no moat. There isn't even a database.

Zero persistence anywhere. No Supabase, no analytics, no CRM. Specifically:

- **Paid audits vanish.** Results live only in the buyer's `localStorage`. 6 Signal cannot see,
  re-send, aggregate, or learn from a single audit it has sold.
- **Leads vanish.** The free check requires an email, promises "your check gets emailed to you,"
  then POSTs to `/api/send-free-check-email` — **a route that does not exist**
  ([ai-visibility-check/page.tsx:224](app/ai-visibility-check/page.tsx)). Every free-check email
  ever collected has been dropped on the floor, after making a promise to the user.
- **Purchases are invisible.** Stripe checkout is an external link with no webhook; the only
  record of who bought is inside Stripe's dashboard, unlinked to any audit.

Every audit run today produces marketing-grade words and zero reusable data. The "#1 globally"
claim requires the opposite: every audit compounding into a dataset nobody else has.

### Proposed Supabase schema (the benchmark engine)

```sql
-- Who
create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  trade text not null,           -- enum-ish: hvac, plumbing, roofing, ...
  city text not null, region text, country text default 'US',
  place_id text,                 -- Google Place ID once resolved
  created_at timestamptz default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id),
  email text not null,
  source text not null,          -- free_check | visibility_check | contact
  created_at timestamptz default now()
);

-- What we measured (one row per audit run — free or paid)
create table audits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id),
  tier text not null,            -- free_check | brief_27 | strategy_97 | retainer_monitor
  stripe_session_id text,        -- set by webhook; proof of purchase
  overall_score numeric,
  model text, prompt_version text,  -- versioned prompts = comparable scores over time
  narrative jsonb,               -- the generated brief (display layer)
  created_at timestamptz default now()
);

create table signal_scores (
  audit_id uuid references audits(id),
  signal text not null check (signal in ('geo','aeo','leo','veo','peo','ieo')),
  score numeric not null,
  evidence jsonb not null,       -- the inputs the score was computed from
  primary key (audit_id, signal)
);

-- Raw evidence: the actual moat
create table ai_probes (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references audits(id),
  engine text not null,          -- chatgpt | perplexity | gemini | google_aio | bing
  prompt text not null, prompt_key text not null,   -- standardized query id
  response text not null,        -- full raw transcript
  business_mentioned boolean, mention_rank int,
  competitors_mentioned text[],  -- who IS winning — gold for sales and benchmarks
  run_at timestamptz default now()
);

create table site_snapshots (    -- IEO/PEO evidence
  audit_id uuid references audits(id) primary key,
  robots_allows_ai boolean, has_localbusiness_schema boolean,
  schema_types text[], sitemap_ok boolean,
  question_coverage jsonb,       -- {query: covered_bool} per trade question cluster
  raw_checks jsonb
);

create table gbp_snapshots (     -- LEO evidence
  audit_id uuid references audits(id) primary key,
  rating numeric, review_count int, review_velocity_90d int,
  categories text[], hours_complete boolean, photos_count int,
  nap_consistency jsonb
);

-- Aggregates (materialized view, refreshed nightly)
-- benchmarks: trade × metro × signal → p25/p50/p75 score, mention_rate
```

What this buys, concretely:

1. **"Your GEO score is 31. The median Fort Worth plumber scores 44."** — one query, instantly
   more credible than any adjective, impossible for a no-database competitor to copy.
2. **White papers that are actually data**: "We probed AI engines 12,000 times across 40 metros.
   Directories win 71% of plumbing recommendations." That's the category-defining publication.
3. **`competitors_mentioned` is a prospect list that names itself** — every probe reveals who's
   winning and who's losing in every market you've ever audited.
4. **Re-marketing**: every free check becomes a contactable lead with a stored result.

Effort: schema is a day; Stripe webhook + persisting existing outputs is 2–3 days. This is the
highest moat-per-effort item in the entire teardown.

---

## 3. Funnel Leaks ($27 → $97 → $197 → retainer, as a skeptical contractor)

**Leak 0 — before the funnel: the broken email promise.** Free check says "Your check gets
emailed to you. No spam." No email is ever sent (route missing). First impression with the exact
audience you're asking to trust you: a small broken promise. Severity: high, fix: small.

**Leak 1 — payment fulfillment rides on localStorage.** The $27 flow stores form data in
localStorage, bounces through an external Stripe page, and expects to land back in the same
browser. Pay on your phone after filling the form on desktop, use Safari private mode, or have
the in-app browser (Instagram/Facebook ads → in-app webview, the #1 way contractors will arrive)
drop storage — you've paid $27 and [audit-results](app/audit-results/page.tsx) says *"We couldn't
find your audit data."* No order record exists server-side, so support is "email hello@ and
hope." For a trust-first brand, a paid-and-got-nothing path is fatal. There is also **no refund
policy anywhere** to absorb that failure.

**Leak 2 — nothing is delivered, ever.** No receipt email, no link back to your brief, no PDF in
your inbox. Close the tab (or clear storage) and your $27 product is gone. Contractors forward
things to their office manager / business partner — there is nothing to forward. This also kills
the viral loop a good audit naturally has.

**Leak 3 — the $97 → $197 pricing order punishes the best buyers.** The $197 call *"includes the
Strategy Brief at no extra charge."* Both offers are shown side-by-side on /audit-results. A
buyer who takes the $97 brief and *then* wants the call pays $294 for what the next person gets
for $197 — and they'll notice, on the very page where you ask for the retainer. Either credit
the $97 toward the call or don't bundle the brief into the call on the same screen.

**Leak 4 — the chasm between $197 and $1,500/month.** The retainer is priced only on the
homepage; the strategy-brief page links vaguely to "the 6Signal retainer" (and to
`6signal.co/retainer`, which isn't a route — it's `/#pricing`). There's no intermediate offer:
no "we implement the 90-day plan for $X one-time," no monitoring tier (see §4). A contractor who
loved the $97 brief faces a 6.3× monthly jump with zero published proof (see Leak 6).

**Leak 5 — generation failure after payment.** If the Claude call fails or the JSON is
truncated, a paying customer sees "Generation Failed — contact hello@6signal.co." No retry queue,
no server-side regeneration, no automatic refund. Each occurrence manufactures a detractor at the
exact moment of maximum expectation.

**Leak 6 — the proof shelf is empty at the decision point.** /work says testimonials are
"Collecting. Carefully." and case studies are "In progress. Requires 90 days." Honest — and the
honesty framing is well-written — but the skeptical contractor evaluating the retainer has zero
external evidence. The X-Act Plumbing result (if documentable per the repo's own proof protocol)
is the cork in this leak, and it's sitting outside the repo.

**Leak 7 — two different "six signals" in the same funnel.** The free check shows
Search/AI/Local/Trust/Content/Conversion; the $27 page shows GEO/AEO/LEO/VEO/PEO/IEO. A buyer who
goes free → paid watches the methodology change names mid-funnel. For a "proprietary
measurement" brand, the measurement framework cannot have two names.

**Leak 8 — no follow-up machinery at all.** No email capture on the paid path, no sequence after
the free check (can't be — emails aren't stored), no abandoned-checkout recovery, no analytics to
even see where people drop. The funnel is a corridor with no lights: nobody knows where bodies
fall.

---

## 4. Product Gaps (vs. "most advanced, most data-driven")

1. **No monitoring — the biggest one.** Everything is one-shot. AI visibility is a *moving*
   target (the site's own copy says "the systems update constantly") — which is the textbook
   argument for a subscription monitor: monthly re-probes, score deltas, "you entered the
   ChatGPT answer set for 'emergency plumber fort worth' this month." Recurring revenue,
   retention, and the dataset all come from the same feature. Right now the product argues for
   monitoring and sells a snapshot.
2. **No competitor tracking.** The audit collects competitor names and does nothing real with
   them. "Benjamin Franklin Plumbing appears in 8 of 10 AI answers; you appear in 0" is the
   single most motivating sentence a contractor can read, and the probe infrastructure that
   produces it is the same one §1 requires.
3. **No alerting.** "Your GBP rating dropped below 4.5" / "a competitor displaced you in
   Perplexity" — alerts are what make a dashboard a habit instead of a login nobody repeats.
4. **No education/nurture layer wired in.** 28 quality blog posts exist, but no email list, no
   course, no sequence connects content → funnel. (CONTENT_ARCHITECTURE.md documents internal
   link gaps and 3 orphaned posts; that work is specced and unexecuted.)
5. **No client reporting.** Retainer clients ($1,500/mo) presumably get… something manual. No
   report generator, no dashboard (§5). At 10 clients this is an ops bottleneck; at 30 it caps
   the business.
6. **Labs are unpriced and inconsistently named.** Takeoff Copilot has no pricing in the repo
   (stated $197/job / $497-month founding rate appears nowhere); the second product is BidCore
   on one page and BidForge on another. Labs currently read as vapor next to an otherwise
   precise brand.
7. **No instrumentation.** Zero analytics. A "data-driven" company that cannot measure its own
   funnel conversion is the joke a competitor makes at a conference.
8. **Prompt/methodology versioning.** Scores aren't comparable across prompt edits because
   nothing records which prompt produced them. Versioning (one column, §2 schema) is what lets
   you publish "6 Signal Score™ v2" with a straight face.

---

## 5. Client Dashboard Spec (white-label, Supabase-backed)

No X-Act dashboard patterns exist in this repo to reference — this is greenfield. The brand brief
§4/§8 already contains dashboard-specific design rules (sidebar #0a0a08, yellow-only charts,
JetBrains Mono labels, Chakra Petch weight-200 data values); use those as the visual contract.

### Product shape

Per client: **AI visibility position over time, per signal, ranked against named local
competitors.** Three views:

1. **Overview** — overall score trend (sparkline, 12 months), six signal tiles with delta
   badges, "share of AI voice" (mention rate across the standardized probe set) vs. top 3
   competitors, latest alerts.
2. **Signal detail** (×6) — score time series; evidence panel (raw probe transcripts for
   GEO/AEO/VEO, GBP snapshot diffs for LEO, crawl checklist for IEO, question-coverage matrix
   for PEO); "what changed" annotations tied to work performed (retainer storytelling: *we
   shipped the schema fix → IEO +18*).
3. **Market view** — leaderboard of tracked competitors per probe query: who is named, at what
   rank, trend arrows. This is the page clients screenshot for their partners.

### Architecture

```
probe-runner (scheduled)            Supabase                      dashboard app
┌──────────────────────┐   ┌──────────────────────────┐   ┌─────────────────────────┐
│ Supabase Edge Func   │   │ Postgres (schema from §2) │   │ Next.js route group     │
│ (pg_cron, weekly per │ → │ + monitor_runs,           │ ← │ /dashboard (same repo)  │
│ client) runs:        │   │   competitor_probes,      │   │ Supabase Auth (magic    │
│ • AI engine probes   │   │   alerts                  │   │ link), RLS: client sees │
│ • Places API pull    │   │ RLS per client_org        │   │ only their org          │
│ • site crawl checks  │   │ Materialized benchmark    │   │ Charts: lightweight     │
│ • score computation  │   │ views (trade × metro)     │   │ (recharts/uPlot), brand │
│ (deterministic, §1)  │   │                           │   │ palette only            │
└──────────────────────┘   └──────────────────────────┘   └─────────────────────────┘
         │                                                        │
         └── alert rules → Resend email ──────────────────────────┘
```

Decisions and rationale:

- **Same Next.js repo, `/dashboard` route group** — reuses globals.css and the design system;
  no second deploy. White-labeling = `client_org.branding jsonb` (logo URL, accent override,
  custom subdomain via Netlify domain alias later). Keep 6 Signal branding as default;
  white-label is a retainer upsell, not v1 scope.
- **Probe runner in Supabase Edge Functions on pg_cron**, not Netlify functions — keeps compute
  next to the data, avoids the Netlify timeout that already shaped the audit prompt, and writes
  evidence rows transactionally. Weekly cadence per client (≈ 25 probes × 3 engines ≈ dollars/
  month per client at API prices — rounding error against $1,500/mo).
- **Scores computed in SQL/TypeScript from evidence, not by an LLM** (per §1). LLM generates the
  monthly narrative paragraph only.
- **RLS from day one**: `client_org_id` on every row; clients authenticated by magic link (no
  password support burden for contractors).
- **Alerts table + Resend**: score delta beyond threshold, lost/gained mention, review-velocity
  drop. Email first; SMS later via Twilio if clients ask.
- **The same runner powers everything**: paid audits (one-shot run), the monitoring product
  (scheduled runs), the dashboard (display), and the benchmark dataset (aggregation). One
  pipeline, four products.

Sequencing note: the dashboard is the *last* layer. It is unbuildable until §1 (real measurement)
and §2 (persistence) exist — a dashboard over hallucinated one-shot scores would chart noise.

---

## 6. Prioritized Roadmap — (revenue × credibility) ÷ effort

**Top 5 moves:**

| # | Move | Why it ranks here | Effort |
|---|---|---|---|
| 1 | **Persist everything + close the broken promises.** Supabase schema (§2), Stripe webhook → `audits.stripe_session_id`, build `/api/send-free-check-email` (Resend), email every paid brief with a permalink (`/audit-results?id=`), publish a refund policy. | Stops paying-customer data loss (Leak 1/2), stops dropping leads (Leak 0), and starts the moat — every audit from that day forward compounds. Highest (revenue×credibility)/effort in the document. | ~3–4 days |
| 2 | **Ground the engine in real evidence — minimum viable rigor.** v1: fetch the site (IEO checklist, deterministic), Google Places pull (LEO, deterministic), 5 real probes against ChatGPT + Perplexity APIs (GEO/AEO evidence), temperature 0, prompt_version stamped; Haiku writes narrative *from the evidence*, scores computed in code. Fix the free check to use one real probe and honest copy. | Converts the product from plausible fiction to defensible measurement; kills the screenshot-takedown risk (§1); makes the 0–100 score mean something. The entire category claim rests on this. | ~1–2 weeks |
| 3 | **Ship the monitoring tier (e.g., $197–$297/mo "Signal Monitor").** Scheduled re-runs of the §2 pipeline + monthly emailed delta report. No dashboard UI yet — email is the v1 dashboard. Bridges the $197 → $1,500 chasm (Leak 4) and creates recurring revenue + time-series data simultaneously. | Recurring revenue at funnel-native price; the dataset's time dimension; the natural retainer feeder. | ~1 week after #2 |
| 4 | **Document the proof.** Get the X-Act Plumbing results into [app/proof-data.ts](app/proof-data.ts) per the repo's own protocol (screenshots, identical prompts, client permission) — it is currently the only real outcome and it lives outside the repo. Fix the empty /work decision point (Leak 6). | Zero-to-one on external evidence; unblocks the retainer ask; cheap. | ~1 day + client sign-off |
| 5 | **Client dashboard (§5) + first benchmark report.** Build `/dashboard` over the accumulated monitor data; simultaneously publish the first data white paper from `ai_probes` aggregates ("Who AI recommends for home services in DFW: N=___"). | The category-defining artifacts — but only valuable after #1–#3 have generated real data. | ~3–4 weeks |

**Sub-week hygiene items (do alongside #1):** unify the six-signal naming on
/ai-visibility-check to GEO/AEO/LEO/VEO/PEO/IEO (Leak 7); fix BidCore/BidForge on /services;
de-duplicate /services vs /capabilities (real 301); fix the `6signal.co/retainer` dead reference;
add analytics (even Netlify Analytics) so funnel drop-off is visible; resolve the $97/$197
bundling order (Leak 3 — credit the $97 toward the call); update README (still says Next 14,
"roofing operators"); either price Takeoff Copilot publicly or label it "pricing on request."

**Explicitly deprioritized:** white-labeling (no clients asking yet), SMS alerts, more trade
landing pages and more blog volume (content is ahead of infrastructure — CONTENT_ARCHITECTURE.md
link fixes are fine as filler work), any new Labs products until BidCore has a consistent name.

### The one-paragraph verdict

6 Signal currently has a strong brand system, a precise voice, good content, a coherent funnel
shape — and no instrument. The company sells measurement and measures nothing; it sells data
positioning and stores no data; it sells trust to AI systems while its free product fabricates
an AI answer. None of these are hard to fix, and the fixes are mutually reinforcing: real probes
(#2) stored in real tables (#1) on a schedule (#3) *are* the moat, the monitoring product, the
dashboard, and the white papers. The brand is ready for the company it describes. Build the
instrument.
