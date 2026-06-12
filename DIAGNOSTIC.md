# DIAGNOSTIC.md — 6Signal Full-Repo Audit
**Generated:** 2026-06-12  
**Purpose:** Assess readiness to turn on paid Meta ads. Every finding includes STATUS, EVIDENCE, SEVERITY, and EST. FIX.

---

## SECTION 7 — EXECUTIVE SUMMARY *(written last, placed first)*

**Meta Ads are currently blocked.** Two absolute blockers exist: no Meta Pixel in the codebase, and no conversion events firing anywhere. Until both are resolved, every ad dollar spent has no optimization signal, no ROAS measurement, and no Pixel audience building.

Beyond the ad blockers, three structural issues reduce conversion quality for cold traffic:

1. **Funnel split leak**: The homepage and /visibility page both have a mid-page CTA that sends users to `/audit` (the free Calendly booking flow) instead of `/visibility-check` (the paid funnel). This silently routes engaged visitors away from the $27 purchase. Two-line fix.

2. **Zero social proof for cold traffic**: Every testimonial, case study, and before/after signal in `app/proof-data.ts` is a placeholder (status: "needed" or "example"). Cold traffic from Meta ads will land on a page with no verifiable outcomes. The X-Act Plumbing result (documented elsewhere) is the single highest-leverage fix.

3. **Score display has no code-level clamping**: If the model returns a score above 100, it renders literally ("120 / 100"). The prompt says "never exceed 100" but there is no enforcement in code. Low probability, high embarrassment.

Everything else — the funnel mechanics, Stripe integration, Supabase persistence, Resend email delivery, and build health — is working correctly.

**Fix priority for ad launch:**
1. Add Meta Pixel + Purchase/Lead/InitiateCheckout events (BLOCKER, ~2 hrs)
2. Fix homepage and /visibility mid-CTA links from `/audit` → `/visibility-check` (BLOCKER, 5 min)
3. Add at least one real testimonial or case study outcome (HIGH, content task)
4. Add score clamping in API routes and display components (MEDIUM, 30 min)

---

## SECTION 1 — FUNNEL PAGES

### 1.1 /ai-visibility-check — Free Check

| Item | Status | Evidence | Severity | Est. Fix |
|---|---|---|---|---|
| Email capture | PASS | `app/ai-visibility-check/page.tsx` — email required before submit | — | — |
| Lead persistence | PASS | `/api/free-check` → `insertLead` + `insertAuditRow` best-effort | — | — |
| AI-generated result | PASS | Streams from `/api/free-check`, labeled "Projected AI Response" with disclaimer | — | — |
| Email send timing | NOTE | Email fires AFTER result display, fire-and-forget `.catch(()=>{})` — user sees result even if email fails | INFO | — |
| CTA → paid funnel | PASS | "Get the Full AI Visibility Brief" → `/visibility-check`, pre-populates localStorage | — | — |
| Secondary CTA | WARN | "Book a Free 15-Min Call" → Calendly; framing conflicts with the $197 Strategy Call on the same booking link | LOW | Relabel to "Schedule a Discovery Call" or route to a separate 15-min event |
| OG / SEO | PASS | Full OG + JSON-LD BreadcrumbList in `app/ai-visibility-check/layout.tsx` | — | — |
| Signal names | WARN | Free-check prompt does not constrain signal names to GEO/AEO/LEO/VEO/PEO/IEO — model may invent names | LOW | Add explicit signal list to free-check prompt |

### 1.2 /visibility-check — $27 AI Visibility Brief

| Item | Status | Evidence | Severity | Est. Fix |
|---|---|---|---|---|
| Form → Stripe | PASS | Intake POSTed to `/api/intake`, then `?client_reference_id=` appended to Stripe URL (`app/visibility-check/page.tsx:272`) | — | — |
| Stripe URL mode | PASS | Live-mode URL: `https://buy.stripe.com/28EeVebRQ3J1ghz6bf3ks0p` | — | — |
| All CTAs | PASS | Hero and section CTAs all scroll to form or hit Stripe | — | — |
| Meta Pixel | MISSING | Zero `fbq` calls, zero pixel script — no InitiateCheckout event fires on Stripe redirect | BLOCKER | Add Pixel + InitiateCheckout before `window.location.href = stripeUrl` |
| OG image | PASS | `/6SIG_SOCIAL_SHARE.png` (413 KB) referenced in `app/visibility-check/layout.tsx` | — | — |

### 1.3 /audit-results — $27 Brief Delivery

| Item | Status | Evidence | Severity | Est. Fix |
|---|---|---|---|---|
| Score display clamping | MISSING | `app/audit-results/page.tsx:213` renders `{s.score} / 100` directly — no `Math.min(100, ...)` guard | MEDIUM | `Math.min(100, Math.max(0, s.score))` in render |
| Status colors | WARN | Lines 79–95 use hardcoded hex (`#22c55e`, `#84cc16`, `#eab308`, `#f97316`, `#ef4444`) outside design system | LOW | Move to CSS vars in globals.css |
| $97 upsell CTA | PASS | Two CTAs (lines 369 + 729) both hit `https://buy.stripe.com/cNi3cw4pogvN6GZfLP3ks0q` | — | — |
| $197 call CTA | PASS | Both CTAs (lines 395 + 741) hit correct Calendly link | — | — |
| PDF back cover | WARN | Lines 670–677: logo + url + email only — no forward CTA for next step in funnel | LOW | Add "Get the Full Strategy Brief — $97" or Calendly link |
| noindex | PASS | `robots: { index: false, follow: false }` in layout | — | — |
| Permalink recovery | PASS | `?id=` fetches from `/api/audit/[id]`; `?intake=` regenerates via `/api/intake/[id]` | — | — |
| Meta Pixel | MISSING | No Purchase event fires after page load (even though purchase already completed via Stripe) | BLOCKER | Fire `fbq('track','Purchase',{value:27,currency:'USD'})` on page load when `!hasRecoveryParam` |

### 1.4 /strategy-brief — $97 Strategy Brief

| Item | Status | Evidence | Severity | Est. Fix |
|---|---|---|---|---|
| Score display clamping | MISSING | Lines 296/304: `${auditScores[sig]} / 100` — no clamp | MEDIUM | Same guard as /audit-results |
| Signal plan scores | MISSING | Line 361: `{s.current_score} / 100 now` — no clamp | MEDIUM | Same fix |
| Final CTA | PASS | Line 592: Calendly link correct | — | — |
| PDF back cover | PASS | Line 625: `6signal.co/#pricing` — correct (was previously `/retainer`) | — | — |
| OG image | MISSING | `app/strategy-brief/layout.tsx` has no `openGraph.images` field | LOW | Add `/6SIG_SOCIAL_SHARE.png` |
| noindex | PASS | `robots: { index: false, follow: false }` in layout | — | — |
| Meta Pixel | MISSING | No Purchase event fires | BLOCKER | Fire `fbq('track','Purchase',{value:97,currency:'USD'})` on page load |

---

## SECTION 2 — API ROUTES & BACKEND

### 2.1 /api/free-check

| Item | Status | Evidence | Severity | Est. Fix |
|---|---|---|---|---|
| Model | PASS | `claude-haiku-4-5-20251001`, `max_tokens:600`, `temperature:0` | — | — |
| Timeout | PASS | 25-second AbortController | — | — |
| Signal name constraint | WARN | Prompt does not enumerate GEO/AEO/LEO/VEO/PEO/IEO — model may output different signal names, breaking free-check→paid-funnel consistency | LOW | List exact six signal names in prompt |
| Persistence | PASS | upsertBusiness → insertLead → insertAuditRow → completeAudit, all best-effort with null-client guard | — | — |
| Email send | PASS | Fires async via `/api/send-free-check-email` (registered in build output) | — | — |

### 2.2 /api/generate-audit

| Item | Status | Evidence | Severity | Est. Fix |
|---|---|---|---|---|
| Model | PASS | `claude-haiku-4-5-20251001`, `temperature:0`, `max_tokens:8192`, streaming | — | — |
| IEO grounding | PASS | `evidenceForPrompt(evidence)` injected; prompt says "Use exactly this number for signals.ieo.score" | — | — |
| Score clamping | MISSING | `saveSignalScores` filters `Number.isFinite` but no `max(0,min(100,...))` guard (`app/lib/db.ts`) | MEDIUM | Add bound check in `saveSignalScores` |
| Scoring prompt | PASS | "Score each signal 0–100. Not 0–10. Never exceed 100." — prompt-level enforcement | INFO | — |
| `X-Audit-Id` header | PASS | Returned on successful generation | — | — |
| `prompt_version` stamp | PASS | Stored with every audit | — | — |

### 2.3 /api/generate-strategy

| Item | Status | Evidence | Severity | Est. Fix |
|---|---|---|---|---|
| Model | PASS | Same model + params as generate-audit | — | — |
| Score clamping | MISSING | Same gap — no code-level bound check | MEDIUM | Same fix |
| Scoring prompt | PASS | "Never exceed 100. Scores above 85 require strong justification." | INFO | — |

### 2.4 /api/stripe-webhook

| Item | Status | Evidence | Severity | Est. Fix |
|---|---|---|---|---|
| HMAC verification | PASS | Manual HMAC-SHA256, 5-min replay window (`app/api/stripe-webhook/route.ts`) | — | — |
| Amount mapping | PASS | 2700→brief_27, 9700→strategy_97, 19700→call_197 | — | — |
| Idempotency | PASS | `recordPurchase` uses `ignoreDuplicates:true` | — | — |
| Recovery email | PASS | Sent when `isNew && email && intakeId && (product === "brief_27" \|\| "strategy_97")` | — | — |
| $197 call handling | NOTE | Mapped and recorded but no recovery email sent for call_197 purchases — intentional since it leads to Calendly | INFO | — |

### 2.5 /api/intake + /api/intake/[id] + /api/audit/[id]

| Item | Status | Evidence | Severity | Est. Fix |
|---|---|---|---|---|
| UUID validation | PASS | Both GET routes validate UUID format before DB query | — | — |
| Intake → purchase link | PASS | `client_reference_id` flow in Stripe→webhook→intake | — | — |
| Build registration | PASS | All three routes appear in build output | — | — |

### 2.6 Supabase (app/lib/db.ts)

| Item | Status | Evidence | Severity | Est. Fix |
|---|---|---|---|---|
| Null-client guard | PASS | All functions return early if `supabase === null` | — | — |
| Env-gated | PASS | Client only created when `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` both present | — | — |
| Best-effort writes | PASS | Missing env = persistence off, funnel unaffected | — | — |
| RLS | PASS | Service role key bypasses RLS; no public policies needed | — | — |

### 2.7 Resend (app/lib/email.ts)

| Item | Status | Evidence | Severity | Est. Fix |
|---|---|---|---|---|
| API key guard | PASS | Logs warning and skips send without `RESEND_API_KEY` | — | — |
| Brand shell | PASS | `#060606` bg, `#E6FF00` accent in HTML email | — | — |
| From address | NOTE | Falls back to `onboarding@resend.dev` without `EMAIL_FROM` env — set in Netlify | LOW | Confirm `EMAIL_FROM=hello@6signal.co` is set |

---

## SECTION 3 — SERVICE STACK ALIGNMENT

### 3.1 What the site covers

The five service systems (Build / Grow / Capture / Automate / Advise) appear consistently on `/capabilities` and `/services`. Labs section shows Takeoff Copilot + BidCore on `/capabilities`.

### 3.2 Inconsistencies

| Issue | Evidence | Severity | Est. Fix |
|---|---|---|---|
| BidCore vs. BidForge | `/services/page.tsx` still says "BidForge"; `/capabilities/page.tsx` says "BidCore" | LOW | Update `/services` to "BidCore" |
| /services and /capabilities are duplicate pages | Both files exist with drifting content; CODEBASE_CONTEXT says /services 301s to /capabilities but no redirect found in code | LOW | Add redirect or merge |
| Six-signal definitions inconsistent across repo | `6SIGNAL_BRAND_BRIEF.md` §1, `app/ai-visibility-check/page.tsx`, and two blog posts each use a different set | MEDIUM | Align free-check page to GEO/AEO/LEO/VEO/PEO/IEO |

### 3.3 Expanded service stack not on site

The following offers exist in conversation context but not in the repo:
- Foundation / Growth / System pricing tiers — not present
- Programmatic local expansion as a standalone service — not present
- Reputation intelligence as standalone product — not present

These are out-of-scope for this audit but relevant if site is being used to sell the full stack.

### 3.4 Proof data (critical for cold traffic)

| Item | Status | Evidence |
|---|---|---|
| Real testimonials | 0 | `app/proof-data.ts` — all `status: "needed"` |
| Real case studies | 0 | cs-001, cs-002 both `status: "needed"` |
| Before/after signals | 0 | All `status: "needed"` |
| Audit examples | 6 illustrative | All `status: "example"` — not real client data |

**X-Act Plumbing result** (ChatGPT/Perplexity visibility in 3 weeks) exists as a stated outcome but is not in the repo. Documenting it in `proof-data.ts` with screenshots is the single highest-leverage content task before running cold traffic.

---

## SECTION 4 — INTERNAL COMMAND CENTER

| Item | Status | Notes |
|---|---|---|
| Admin dashboard | NOT PRESENT | No `/admin`, `/dashboard`, or operator UI in the repo |
| Lead viewer | NOT PRESENT | Leads exist in Supabase `leads` table but no read interface |
| Purchase log | NOT PRESENT | `purchases` table populated by webhook but no view |
| Audit history | NOT PRESENT | `audits` table exists, no browse UI |
| Signal score history | NOT PRESENT | `signal_scores` table exists, no viewer |
| Ops access | WORKAROUND | Supabase dashboard (supabase.com) provides table editor as a stopgap |

**Assessment:** Data infrastructure is complete. Operator access is limited to the Supabase web UI. This is acceptable for launch but will become a bottleneck at scale (following up with leads requires exporting CSVs or writing SQL).

---

## SECTION 5 — AD-READINESS BLOCKERS

### BLOCKER 1: No Meta Pixel

**STATUS: NOT PRESENT**  
**EVIDENCE:** Zero `fbq`, `_fbq`, `connect.facebook.net`, or `<FacebookPixel` in any file in the codebase. Confirmed with full-repo grep.  
**SEVERITY: ABSOLUTE BLOCKER** — Cannot run Meta ads without a Pixel. No audience building, no conversion optimization, no ROAS measurement.  
**EST. FIX: ~2 hours**

Implementation plan:
1. Create a `components/MetaPixel.tsx` client component that loads the base Pixel script via `next/script` (`strategy="afterInteractive"`).
2. Add `<MetaPixel pixelId="YOUR_PIXEL_ID" />` to `app/layout.tsx`.
3. Add `fbq('track', 'InitiateCheckout')` in `app/visibility-check/page.tsx` before the `window.location.href = stripeUrl` redirect.
4. Add `fbq('track', 'Purchase', { value: 27.00, currency: 'USD' })` at the top of `app/audit-results/page.tsx` (fire once, when not a recovery load).
5. Add `fbq('track', 'Purchase', { value: 97.00, currency: 'USD' })` similarly in `app/strategy-brief/page.tsx`.
6. Add `fbq('track', 'Lead')` in the free-check results handler in `app/ai-visibility-check/page.tsx`.

---

### BLOCKER 2: No Conversion Events

**STATUS: NOT PRESENT**  
**EVIDENCE:** No `fbq('track', ...)` calls anywhere. No `gtag('event', 'purchase', ...)`. No analytics events of any kind.  
**SEVERITY: ABSOLUTE BLOCKER** — Meta's ad algorithm cannot optimize for purchase without conversion signal.  
**EST. FIX:** Covered by Blocker 1 implementation above.

---

### HIGH: Homepage Funnel Leak

**STATUS: ACTIVE BUG**  
**EVIDENCE:** `app/page.tsx:273` — mid-page CTA `<a href="/audit">See Where You Get Skipped</a>` routes to the free Calendly booking page, not the $27 paid funnel.  
**SEVERITY: HIGH** — Engaged mid-page visitors who click this CTA are sent to a free booking flow, bypassing the $27 entry point entirely.  
**EST. FIX: 5 minutes** — Change `href="/audit"` to `href="/visibility-check"` and update copy to "Get the Audit — $27".

Same issue on `app/visibility/page.tsx` — mid-CTA `<a href="/audit">Find the Gaps</a>` → fix to `/visibility-check`.

---

### HIGH: No Analytics

**STATUS: NOT PRESENT**  
**EVIDENCE:** `app/layout.tsx` has no GA4, GTM, Plausible, Mixpanel, or any analytics script.  
**SEVERITY: HIGH** — Without analytics, there is no funnel visibility: no drop-off data, no page-level conversion rates, no source attribution.  
**EST. FIX: 30 minutes** — Add GA4 via `next/script` in root layout with Measurement ID.

---

### MEDIUM: Zero Social Proof for Cold Traffic

**STATUS: PLACEHOLDER DATA**  
**EVIDENCE:** `app/proof-data.ts` — 0 real testimonials, 0 real case studies, 6 illustrative examples.  
**SEVERITY: MEDIUM** — Cold traffic from Meta ads will hit pages with no verified outcomes. The homepage explicitly disclaims "We don't publish outcomes we can't verify." Without proof, cold traffic conversion rates will be low.  
**EST. FIX:** Content task — document X-Act Plumbing results in `proof-data.ts` per the protocol already defined there (screenshots, client permission).

---

### MEDIUM: Score Display Has No Code-Level Clamping

**STATUS: MISSING GUARD**  
**EVIDENCE:** `app/audit-results/page.tsx:213`, `app/strategy-brief/page.tsx:296/304/361`, `app/lib/db.ts` in `saveSignalScores` — all render or store scores without `Math.min(100, Math.max(0, score))`.  
**SEVERITY: MEDIUM** — Prompt instructs the model "Never exceed 100" but this is not enforced in code. A rogue response would render "120 / 100" directly to the user.  
**EST. FIX: 30 minutes** — Add clamp in `saveSignalScores` and in all score display expressions.

---

### LOW: /strategy-brief Missing OG Image

**STATUS: MISSING**  
**EVIDENCE:** `app/strategy-brief/layout.tsx` — no `openGraph.images` field.  
**SEVERITY: LOW** — If a strategy brief URL is ever shared (e.g., in a recovery email), the social preview will have no image.  
**EST. FIX: 5 minutes** — Add `images: ['/6SIG_SOCIAL_SHARE.png']` to openGraph config.

---

### LOW: Design System Border-Radius Violations

**STATUS: ACTIVE**  
**EVIDENCE:** `app/globals.css` contains `border-radius: 3px`, `border-radius: 4px`, and `border-radius: 8px` values. Spec (CLAUDE.md §6) says 0–2px.  
**SEVERITY: LOW** — Visual inconsistency, not functional.  
**EST. FIX: 30 minutes** — Audit and normalize to 0px or 2px.

---

### LOW: Free-Check Secondary CTA Framing Conflict

**STATUS: PRESENT**  
**EVIDENCE:** `app/ai-visibility-check/page.tsx` — secondary CTA labeled "Book a Free 15-Min Call" links to the same Calendly URL used for the $197 Strategy Call.  
**SEVERITY: LOW** — Buyers who paid $197 expecting something different from what the free check offers will be confused if they land on the same event type.  
**EST. FIX:** Create a separate 15-min discovery Calendly event type, or change the label to "Schedule a Strategy Call — $197" to be explicit.

---

## SECTION 6 — BUILD & DEPLOY HEALTH

### 6.1 Build

| Item | Status | Evidence |
|---|---|---|
| Build exit code | PASS | `npm run build` exits 0, no errors |
| All routes registered | PASS | 50 routes in build output — all funnel pages, API routes, trade pages, blog slugs present |
| API route bundle size | PASS | All API routes: 190 B (handler only, shared 103 kB chunk) |
| Page bundle sizes | PASS | Largest page: `/commercial-contractors` 7.76 kB + 119 kB shared — reasonable |
| TypeScript errors | PASS | No type errors during build |
| Missing `/api/audit/[id]` | NOTE | Not listed separately in build output — nested under `/api/audit` in output tree but registered at runtime as a dynamic route (confirmed by `[id]/route.ts` existence) |

### 6.2 Hosting & Config

| Item | Status | Evidence |
|---|---|---|
| Netlify plugin | PASS | `@netlify/plugin-nextjs` at `5.15.11` in `netlify.toml` |
| Auto-deploy | PASS | `main` branch triggers deploy on push |
| Build command | PASS | `npm run build` in netlify.toml |
| Publish dir | DEFAULT | Not set in netlify.toml — Netlify/Next.js plugin handles this |

### 6.3 Environment Variables

| Var | Required For | Risk if Missing |
|---|---|---|
| `ANTHROPIC_API_KEY` | All AI generation | Funnel breaks — audits/strategy/free-check all fail |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Lead/purchase persistence | Best-effort: funnel works, data not saved |
| `RESEND_API_KEY` | Recovery emails | Best-effort: funnel works, recovery emails not sent |
| `EMAIL_FROM` | Email sender address | Falls back to `onboarding@resend.dev` |
| `STRIPE_WEBHOOK_SECRET` | Webhook HMAC verification | Webhook rejects all events — no persistence, no recovery emails |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel (to be added) | Pixel not initialized |

### 6.4 Public Assets

| Asset | Status | Size |
|---|---|---|
| `/public/6SIG_SOCIAL_SHARE.png` | PRESENT | 413 KB |
| `/public/6SIG_LOGO_FINAL_2.webp` | PRESENT | 19 KB |

---

*End of diagnostic. Fix Blockers 1 and 2 plus the homepage CTA leak before enabling paid traffic.*
