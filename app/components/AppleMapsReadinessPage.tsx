"use client";

import Link from "next/link";
import Nav from "./Nav";
import Footer from "./Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import AuditPopupButton from "./AuditPopupButton";

/*
  ────────────────────────────────────────────────────────────────────────────
  BOOKING / CTA WIRING
  ────────────────────────────────────────────────────────────────────────────
  The primary CTA ("Buy Apple Business Setup") uses the site's
  existing booking flow — the Typeform popup rendered by <AuditPopupButton/>.

  To point this page at a DIFFERENT booking link (e.g. a dedicated Apple Maps
  Readiness intake form), do ONE of the following:

    1. Change the shared Typeform ID in:  app/lib/links.ts  (TYPEFORM_ID)
       — this affects every CTA across the whole site, OR
    2. Replace each <AuditPopupButton> below with a plain anchor pointing at
       your booking URL, e.g.:
         <a href="https://YOUR-BOOKING-URL" className="btn btn-primary btn-lg">…</a>

  The secondary CTA ("Ask About Full Visibility System") links to /contact.
  Replace that href if you want it to point somewhere else.
  ────────────────────────────────────────────────────────────────────────────
*/

const BASE_URL = "https://6signal.co";

// §04 — What we set up (offer cards)
const offerCards = [
  {
    num: "01",
    title: "Apple Business Connect claim & verification",
    body: "We claim or verify your business inside Apple Business Connect — the control panel behind your Apple Maps presence. No more relying on whatever Apple auto-generated about you.",
  },
  {
    num: "02",
    title: "Profile optimization",
    body: "Business name, location, hours, phone, website, and service information set correctly and completely — the fields Apple uses to decide when and where you surface.",
  },
  {
    num: "03",
    title: "Category & service alignment",
    body: "The right primary category and service tags so Apple Maps understands what you actually do — and shows you to the people searching for it.",
  },
  {
    num: "04",
    title: "Photo, logo & brand asset setup",
    body: "Logo, cover, and structured photos uploaded and organized so your listing looks like a real business, not an unclaimed pin on a map.",
  },
  {
    num: "05",
    title: "NAP consistency review",
    body: "Name, address, and phone checked against your Google Business Profile and website. Conflicting contact info quietly erodes local trust — we find it and flag it.",
  },
  {
    num: "06",
    title: "Google Business Profile comparison",
    body: "A side-by-side read of your Apple presence against your Google profile so the two reinforce each other instead of telling different stories.",
  },
  {
    num: "07",
    title: "Apple Maps Ads readiness checklist",
    body: "A clear checklist of what's in place and what's missing — so the moment Maps ads are available in your market, the account is ready to run, not scrambling to qualify.",
  },
  {
    num: "08",
    title: "Tracking & landing page recommendations",
    body: "Recommendations for the landing page and tracking setup behind the listing, so taps and calls can actually be measured — not guessed at.",
  },
];

// §05 — Before / After
const beforeItems = [
  "Unclaimed or weak Apple Maps listing",
  "Poor or missing photos",
  "Wrong or vague business category",
  "Inconsistent phone and address",
  "No tracking plan behind the listing",
  "Not ready for Apple Maps Ads",
];

const afterItems = [
  "Claimed and optimized Apple profile",
  "Clean, consistent business information",
  "Strong logo, cover, and structured photos",
  "Better local trust signals",
  "Prepared for Maps ad campaigns",
  "A clear next-step visibility plan",
];

// §06 — Who this is for
const forItems = [
  "Contractors who depend on local search to fill the calendar",
  "Home service businesses — roofing, plumbing, HVAC, electrical, excavation",
  "Commercial contractors working a defined geographic market",
  "Businesses already spending on Google or Meta who want the next surface",
  "Companies that want to be ready before competitors think about it",
];

const notForItems = [
  "Businesses expecting instant leads with no follow-up",
  "Companies with no website or a weak offer who refuse to fix the basics",
  "Owners who want a magic button instead of visibility infrastructure",
  "Anyone looking for guaranteed rankings or leads inside 30 days",
];

// §07 — Pricing
const systemIncludes = [
  "Everything in the Apple Maps Readiness Setup",
  "Google Business Profile optimization",
  "AI search visibility — ChatGPT, Gemini, Perplexity",
  "Citation and directory alignment",
  "Review strategy",
  "Service-page alignment",
  "Ongoing reporting and optimization",
];

// §08 — FAQ
const faqs = [
  {
    q: "Are Apple Maps Ads available right now?",
    a: "Apple has announced and begun rolling out advertising in Maps across the U.S. and Canada. Availability is expanding, not universal. This setup prepares your business profile and local visibility foundation so you're ready as the ad product reaches your market — rather than starting from zero when it does.",
  },
  {
    q: "Is this better than Google Ads?",
    a: "No. Google is still essential and isn't going anywhere. Apple Maps is an additional local discovery surface — another place high-intent buyers look. This complements your Google presence; it doesn't replace it.",
  },
  {
    q: "Will this get me leads immediately?",
    a: "No. There are no guaranteed leads. This is a readiness and visibility foundation. Leads depend on your market, demand, reviews, website, offer, and follow-up. What we control is making sure Apple Maps represents your business accurately and is ready for paid campaigns when you want them.",
  },
  {
    q: "Do I need this if I already have a Google Business Profile?",
    a: "Yes. Google Business Profile and Apple Business Connect are separate systems with separate data. Many businesses have never claimed their Apple presence at all — which means Apple is showing whatever it inferred, unedited and unverified.",
  },
  {
    q: "Can you manage Apple Maps Ads for us when they're available?",
    a: "Yes. This setup prepares the account and profile so paid campaigns can be launched cleanly when they're available in your market. Campaign management can be handled separately or as part of the larger AI + Local Visibility System.",
  },
  {
    q: "Is this included in your bigger visibility package?",
    a: "Yes. The Apple Maps Readiness Setup can be purchased on its own as a fast start, or bundled into the AI + Local Visibility System alongside Google, AI search, citations, reviews, and ongoing optimization.",
  },
];

function AppleMapsJsonLd() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Apple Maps Readiness Setup",
        item: `${BASE_URL}/apple`,
      },
    ],
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Apple Maps Readiness Setup",
    description:
      "6Signal claims, cleans up, and optimizes your Apple Business Connect / Apple Maps presence so your business is ready as Apple Maps Ads roll out across the U.S. and Canada.",
    provider: { "@type": "ProfessionalService", name: "6Signal", url: BASE_URL },
    areaServed: ["United States", "Canada"],
    serviceType: "Apple Maps / Apple Business Connect optimization",
    offers: {
      "@type": "Offer",
      price: "750",
      priceCurrency: "USD",
      description: "Apple Maps Readiness Setup — one-time setup",
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />
    </>
  );
}

export default function AppleMapsReadinessPage() {
  useMicroInteractions();

  return (
    <>
      <AppleMapsJsonLd />
      <Nav />

      {/* ── HERO ─────────────────────────────────────────── */}
      <header className="inner-hero">
        <div className="hero-glow" />
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">Apple Maps Readiness Setup</span>
            <h1 className="display reveal">
              Apple Maps is becoming a<br />
              local ad platform.<br />
              <em>Get found before it gets crowded.</em>
            </h1>
            <p className="hero-deck reveal">
              6Signal helps contractors and local service businesses claim, clean up, and
              optimize their Apple Maps presence — so they&rsquo;re ready for the next wave
              of local search before competitors notice it&rsquo;s happening.
            </p>
            <div className="hero-cta-row reveal">
              {/* PRIMARY CTA — replace booking link via app/lib/links.ts (TYPEFORM_ID) */}
              <AuditPopupButton className="btn btn-primary btn-lg">
                Buy Apple Business Setup
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </AuditPopupButton>
              <a href="#what-we-set-up" className="btn btn-ghost btn-lg">
                See what we set up
              </a>
            </div>
            <div className="hero-sig reveal">
              No hype · No lead guarantees · A clean, optimized Apple Maps foundation before the channel gets crowded
            </div>
          </div>
        </div>
      </header>

      {/* ── §01 PROBLEM ──────────────────────────────────── */}
      <section className="shift rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 01 — The shift</span>
              <h2 className="display">
                Your customers aren&rsquo;t only<br />
                <em>searching on Google anymore.</em>
              </h2>
            </div>
            <div className="right">
              Google still matters. But the way people find a local contractor has quietly
              fractured across the devices in their hands — and most of that traffic never
              touches a search box.
            </div>
          </div>
          <div className="shift-scene">
            <p>
              <strong>They search from iPhones. They ask Siri. They tap Maps.</strong> They
              compare the nearby businesses they see before they ever reach your website.
            </p>
            <p className="dim">
              By the time someone lands on your site, the shortlist is often already made —
              shaped by what Maps showed them, what the photos looked like, and whether the
              hours and phone number looked trustworthy.
            </p>
            <p>
              Google still matters. But Apple Maps is becoming harder to ignore — and{" "}
              <em>most contractors have never claimed or optimized their Apple presence at all.</em>
            </p>
          </div>
        </div>
      </section>

      {/* ── §02 WHY NOW ──────────────────────────────────── */}
      <section className="rule" style={{ paddingBottom: "100px" }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 02 — Why now</span>
              <h2 className="display">
                Apple Maps Ads are<br />
                <em>the warning shot.</em>
              </h2>
            </div>
            <div className="right">
              Apple is expanding advertising into Maps across the U.S. and Canada. That moves
              Maps from simple navigation toward paid local discovery — a surface businesses
              bid for.
            </div>
          </div>
          <div className="shift-flow">
            <div className="stage">
              <div className="n">Today</div>
              <h4>Maps is mostly navigation.</h4>
              <p>
                People use Apple Maps to get directions and glance at nearby options. Most
                contractor profiles are unclaimed, thin, or auto-generated.
              </p>
            </div>
            <div className="arrow-icon">→</div>
            <div className="stage">
              <div className="n">As ads roll out</div>
              <h4>Maps becomes paid discovery.</h4>
              <p>
                As Apple Maps Ads roll out, search results in Maps become a place businesses
                compete for attention — not just a list of pins.
              </p>
            </div>
            <div className="arrow-icon">→</div>
            <div className="stage">
              <div className="n">The cost</div>
              <h4>Weak profiles lose ground.</h4>
              <p>
                Incomplete profiles, weak photos, bad categories, inconsistent contact info,
                and poor landing pages will quietly cost businesses visibility.
              </p>
            </div>
          </div>
          <div className="safety-note" style={{ marginTop: "48px" }}>
            <span className="safety-note-label">Said plainly</span>
            <p>
              We won&rsquo;t pretend Apple Maps replaces Google, and we won&rsquo;t promise
              leads. The honest move is simple: get the business profile{" "}
              <strong>claimed, cleaned up, optimized, and ready</strong> — before local
              competitors start bidding for attention and before the market gets crowded.
            </p>
          </div>
        </div>
      </section>

      {/* ── §03 OFFER — WHAT WE SET UP ───────────────────── */}
      <section className="audit-reveals-section rule" id="what-we-set-up">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 03 — What we set up</span>
              <h2 className="display">
                Not just a listing.<br />
                <em>Local visibility infrastructure.</em>
              </h2>
            </div>
            <div className="right">
              The Apple Maps Readiness Setup gets your Apple Business Connect profile claimed,
              accurate, and structured for the next phase of local search — and ready for paid
              campaigns when you want them.
            </div>
          </div>
          <div className="reveals-grid">
            {offerCards.map((c) => (
              <div className="reveal-item reveal" key={c.num}>
                <span className="reveal-num">{c.num}</span>
                <div className="reveal-title">{c.title}</div>
                <div className="reveal-body">{c.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── §04 BEFORE / AFTER ───────────────────────────── */}
      <section className="fit-section rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 04 — Before & after</span>
              <h2 className="display">
                From invisible listing<br />
                <em>to local visibility asset.</em>
              </h2>
            </div>
            <div className="right">
              Same business. Same market. The difference is whether Apple Maps represents you
              accurately — and whether you&rsquo;re positioned to run when ads arrive.
            </div>
          </div>
          <div className="fit-grid">
            <div className="fit-col no">
              <div className="f-label">
                <span className="sym">–</span>Before
              </div>
              <ul>
                {beforeItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="fit-col yes">
              <div className="f-label">
                <span className="sym">+</span>After
              </div>
              <ul>
                {afterItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── MID-PAGE CTA ─────────────────────────────────── */}
      <section className="rule" style={{ paddingTop: "0", paddingBottom: "100px" }}>
        <div className="wrap" style={{ textAlign: "center" }}>
          <div className="hero-cta-row reveal" style={{ justifyContent: "center" }}>
            {/* MID-PAGE CTA — same booking flow as hero */}
            <AuditPopupButton className="btn btn-primary btn-lg">
              Buy Apple Business Setup
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </AuditPopupButton>
          </div>
          <div className="hero-sig reveal" style={{ marginTop: "20px" }}>
            One profile per business · Claimed, cleaned, and ready before the auction heats up
          </div>
        </div>
      </section>

      {/* ── §05 WHO THIS IS FOR ──────────────────────────── */}
      <section className="fit-section rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 05 — Honest fit</span>
              <h2 className="display">
                Who this is for.<br />
                <em>And who it isn&rsquo;t.</em>
              </h2>
            </div>
            <div className="right">
              This is for businesses that take their local market seriously and want the
              foundation right before the channel gets competitive.
            </div>
          </div>
          <div className="fit-grid">
            <div className="fit-col yes">
              <div className="f-label">
                <span className="sym">+</span>Built for
              </div>
              <ul>
                {forItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="fit-col no">
              <div className="f-label">
                <span className="sym">–</span>Not for
              </div>
              <ul>
                {notForItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── §06 PRICING ──────────────────────────────────── */}
      <section className="pricing-section rule" id="pricing">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 06 — Pricing</span>
              <h2 className="display">
                One fast start.<br />
                <em>One full system.</em>
              </h2>
            </div>
            <div className="right">
              Start with the Apple Maps Readiness Setup, or fold it into the full visibility
              system that covers Apple, Google, and AI search together.
            </div>
          </div>

          {/* Primary offer — fast start ($750). Same pattern as the home retainer block. */}
          <div className="pricing-core">
            <div className="p-eyebrow">Apple Maps Readiness Setup — fast start</div>
            <div className="p-number">
              <span className="dollar">$</span>750
              <span className="mo">/ one-time</span>
            </div>
            <div className="p-sub">
              Everything needed to claim, clean up, optimize, and prepare your Apple Maps
              presence.{" "}
              <em>Can also be bundled into a full AI + Local Visibility package.</em>
            </div>
            <div className="p-cta">
              {/* PRIMARY CTA — replace booking link via app/lib/links.ts (TYPEFORM_ID) */}
              <AuditPopupButton className="btn btn-primary btn-lg">
                Buy Apple Business Setup
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </AuditPopupButton>
            </div>
            <div className="p-guarantee">
              Apple Business Connect claim · Profile optimized · NAP review · Ads-ready checklist
            </div>
          </div>

          {/* Comprehensive offer — the full system ($2,500+). Uses the home pricing-detail grid. */}
          <div className="pricing-detail">
            <div className="pricing-note">
              <p>
                <span className="highlight">
                  AI + Local Visibility System — starting at $2,500 setup + monthly
                  optimization.
                </span>{" "}
                The comprehensive option: Apple Maps plus Google Business Profile, AI search
                visibility, citation alignment, review strategy, service-page alignment, and
                ongoing reporting.
              </p>
              <p className="italic" style={{ marginTop: "20px" }}>
                The Apple Maps Readiness Setup is the fast start. The full system is the
                ongoing visibility engine — custom-scoped to your market and current
                footprint.
              </p>
              <div style={{ marginTop: "28px" }}>
                {/* SECONDARY CTA — links to existing /contact route; replace href if needed */}
                <Link href="/contact" className="btn btn-ghost btn-lg">
                  Ask About Full Visibility System
                  <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M0 5h14M10 1l4 4-4 4" />
                  </svg>
                </Link>
              </div>
            </div>

            <div className="included">
              <h4>The full system includes</h4>
              {systemIncludes.map((item, i) => (
                <div key={i}>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── §07 FAQ ──────────────────────────────────────── */}
      <section className="faq-section page-faq" id="faq">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 07 — Straight answers</span>
              <h2 className="display">
                Questions about<br />
                <em>Apple Maps readiness.</em>
              </h2>
            </div>
            <div className="right">
              The questions contractors ask before booking — answered directly, without
              overclaiming.
            </div>
          </div>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q">
                  <span className="q-idx">{String(i + 1).padStart(2, "0")}</span>
                  <span className="q-text">{faq.q}</span>
                  <span className="q-icon" aria-hidden="true" />
                </div>
                <div className="faq-a">
                  <div className="faq-a-inner">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── §08 FINAL CTA ────────────────────────────────── */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Apple Maps Readiness Setup</div>
          <h2 className="display">
            Get ready before Apple Maps<br />
            becomes another crowded<br />
            <em>local ad auction.</em>
          </h2>
          <p className="f-deck">
            Claim it, clean it up, optimize it, and get the readiness checklist — so the moment
            Apple Maps Ads reach your market, your business is positioned instead of playing
            catch-up. No hype. No lead guarantees. Just a clean Apple Maps foundation.
          </p>
          <div className="f-cta">
            {/* FINAL CTA — replace booking link via app/lib/links.ts (TYPEFORM_ID) */}
            <AuditPopupButton className="btn btn-primary btn-lg">
              Buy Apple Business Setup
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </AuditPopupButton>
          </div>
          <div className="f-notes">
            <span>Apple Business Connect claim</span>
            <span>Profile optimized</span>
            <span>Ads-ready checklist</span>
            <span>$750 one-time</span>
          </div>
        </div>
      </section>

      <Footer />

      <div className="mobile-cta">
        {/* MOBILE STICKY CTA — same booking flow */}
        <AuditPopupButton>
          Buy Apple Business Setup
          <svg width="14" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M0 5h14M10 1l4 4-4 4" />
          </svg>
        </AuditPopupButton>
      </div>
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
    </>
  );
}
