# CLAUDE.md — 6 Signal Client Website Build

> **TEMPLATE.** Master copy lives in the 6signal repo as `WEBSITE_BUILD_PLAYBOOK.md`.
> For every new build: create the client's project folder, copy this file in **as
> `CLAUDE.md`**, open the folder in VS Code with Claude Code, and paste the intake
> (see Kickoff). This file is the process — the session self-orients from it.

---

## 1. What this project is

One client contractor website, built by 6 Signal (operator: **Matt Vincent Walker** —
always full name in any byline/credit). Sold at **$1,500 flat — $750 deposit paid,
$750 due at launch**. Target: **live within 2–3 weeks of deposit**. The client
experience is premium and hands-on; the build should feel like it.

## 2. Kickoff — where the client's answers come from

The owner starts the session by pasting the **🔥 Website Build Intake email** from
hello@6signal.co — the client's full questionnaire (generated per-trade at
6signal.co/start), formatted by section. That paste is the build brief.

Kickoff prompt format:

```
New client website build: [Company] — [trade].
Stack: [static | next | your call].
Intake below. Start Phase 1.

[paste of the 🔥 Website Build Intake email body]
```

**If the intake includes a current website URL:** fetch and read it before
Phase 1. Mine it for seed material — real service lists, service areas, photos
worth keeping, license numbers, review quotes, phone/address. Treat it as a
source to verify against the intake, not a template to copy: the client is
paying to replace it. Where the old site and the intake conflict, the intake
(and the Phase 0 call) win.

**Truth rules (non-negotiable, same ethic as 6signal.co):**
- Never invent facts: no fabricated reviews, testimonials, years in business,
  license numbers, certifications, project claims, or service areas.
- Missing info → build with a visible `<!-- TODO: confirm with client -->` marker
  and surface the list of open questions to the owner at each review gate.
- Real reviews only, supplied by the client or pulled from their actual Google
  listing with the owner's confirmation.

## 3. Stack decision

**Default: static.** Files: `index.html`, `styles.css`, `script.js`,
`netlify.toml`, `README.md`, `images/`, plus one HTML page per core service and
`about` / `contact`. No frameworks, no build step, no page builders — clean,
fast, hand-quality code.

**Next.js (App Router, TypeScript)** only when the job genuinely needs it:
many service-area/city pages from data, a blog/content system, forms beyond
Netlify Forms, integrations, or a dashboard. When in doubt, ask the owner —
static is the default for a reason (speed, simplicity, $97/mo care margin).

## 4. Build standards — every site, both stacks

**Structure**
- Pages: homepage, one page per core service, about, contact. Service-area
  content on the homepage and service pages; dedicated city pages only if scoped.
- Footer on every page: NAP (name, address/service area, phone) exactly matching
  the client's Google Business Profile.

**Conversion**
- Click-to-call prominent on every page (sticky on mobile).
- One primary CTA sitewide, chosen from the intake ("What should visitors do
  first?") — call, quote form, or booking. Quote form via Netlify Forms on
  static builds.
- Proof placed near CTAs: reviews (real), project photos (real), licenses.

**Copy**
- Written in full from the intake answers — no lorem ipsum, no placeholders in
  final output. Plain, specific, local. The flagship service leads.
- Tone per the intake's tone answer. No hype, no exclamation points, unless the
  client's brand genuinely calls for it.

**AI-visibility-ready (this is a 6 Signal site — it must pass its own audit)**
- Schema: `LocalBusiness` (org-level), `Service` per service page, `FAQPage`
  where FAQs render, `BreadcrumbList` on inner pages. Markup describes only
  what's visibly true.
- 4–6 real buyer-question FAQs per service page (answer-engine ready).
- Unique title, meta description, single H1 per page; clean heading hierarchy.
- `robots.txt` (allow AI crawlers), `sitemap.xml`, canonical URLs.
- Alt text on every image; descriptive filenames.

**Performance**
- Mobile-first. Fast: optimized/lazy images, system or self-hosted fonts (max 2
  families), no render-blocking junk. A static build should score green on
  Lighthouse without trying.

**Brand**
- The client's brand, not 6 Signal's: their logo, one accent color drawn from
  it, neutral base. If the intake says "no logo," a clean wordmark treatment —
  flag logo design as an upsell to the owner, don't improvise a logo.

## 5. Process — three phases with review gates

**Phase 0 — The direction call (owner ↔ client, before any design work).**
Happens after the deposit clears; the client has been told at checkout and in
the confirmation email to expect it. The owner reads the full intake before
dialing — the call locks direction, resolves open questions, and adds anything
the questionnaire couldn't capture. Notes from this call get pasted into the
kickoff prompt alongside the intake; where call notes and intake answers
conflict, the call wins.

**Phase 1 — Design system + homepage.** Build the full homepage and the shared
design system (colors, type, components). Then STOP and serve it for the
owner's visual review — `npx serve` (static) or `npm run dev` (Next). This is
the "check it and make big changes" gate: direction, layout, color, tone.
Nothing else gets built until the owner approves.

**Phase 2 — Everything else.** Service pages, about, contact, forms, schema,
all copy. Surface the open-questions list (TODOs) at the end.

**Phase 3 — Polish + launch prep.** Favicon, OG image (1200×630), 404 page,
schema validation, Lighthouse pass, forms tested, `netlify.toml`, README
documenting structure and how to make small edits (the Care Plan inherits this).

## 6. Launch checklist

- [ ] Netlify site created, repo connected (or drag-drop for static), deploys green
- [ ] Client domain connected, DNS/nameservers confirmed, HTTPS live
- [ ] Forms submit and arrive (test each one)
- [ ] Schema validates (Google Rich Results test)
- [ ] Phone numbers are tap-to-call; every link works; 404 page exists
- [ ] OG/share image renders; favicon set
- [ ] README current

## 7. After launch — 6 Signal business hooks (tell the owner, every time)

1. **Collect the final $750.**
2. **Offer the Website Care Plan** — $97/month: hosting, monitoring, small
   updates (6signal.co/care).
3. **Add the site to the portfolio** — the owner tells the 6signal HQ session to
   add it to `recentBuilds` on 6signal.co/websites (name, trade, region, URL).
4. **Scale upsell** — suggest the client run the $27 AI Visibility Audit at
   6signal.co/visibility-check; a new site is the perfect moment to check what
   AI says about them. Their trade prompts can also join 6 Signal's tracking
   system as a baseline (day-one baseline = future case study).

## 8. Session conduct

- One build per folder, one folder per client. Never build inside the 6signal
  marketing repo.
- Commit early and often with clear messages; the owner may hand this repo to
  the Care Plan process later.
- When the intake conflicts with these standards, the standards win unless the
  owner says otherwise — and say so out loud rather than silently complying.
