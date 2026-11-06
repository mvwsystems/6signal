import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import BlogPageClient from "../components/BlogPageClient";
import AuditPopupButton from "../components/AuditPopupButton";
import { CASE_STUDIES } from "../proof-data";
import {
  BASE,
  DFW_CITIES,
  ORG_ID,
  breadcrumbNode,
  faqNode,
  graph,
  webPageNode,
} from "../lib/site";

// The local-intent page. Every competitor ranking for "AI visibility Dallas"
// has one; the homepage speaks to contractors everywhere, this one speaks to
// DFW specifically — cities, the one published proof, and the questions a
// local owner asks before the $27 audit.

const ROUTE = "/dallas-fort-worth";
const TITLE = "AI Visibility for Contractors in Dallas–Fort Worth";
const DESC =
  "6 Signal gets DFW contractors named when homeowners ask ChatGPT, Gemini, Google AI Overviews, Maps, and Siri who to call. One operator based in Dallas–Fort Worth, one contractor per market per trade. Documented proof from Red Oak, TX. Start with the $27 AI Visibility Audit.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${BASE}${ROUTE}` },
  openGraph: {
    title: `${TITLE} | 6 Signal`,
    description: DESC,
    url: `${BASE}${ROUTE}`,
    type: "website",
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "Be the contractor AI recommends — 6 Signal" }],
  },
  twitter: { card: "summary_large_image", title: `${TITLE} | 6 Signal`, images: ["/6SIG_SOCIAL_SHARE.png"] },
};

const prompts = [
  { q: "Who is the best plumber in Plano, TX?", sys: "ChatGPT" },
  { q: "Emergency AC repair Fort Worth open now", sys: "Google AI Overview" },
  { q: "Roofer for hail damage near Frisco", sys: "Gemini" },
  { q: "Hey Siri, find a licensed electrician near me", sys: "Siri" },
  { q: "Foundation repair companies in Arlington with good reviews", sys: "Perplexity" },
  { q: "Best plumber Red Oak TX", sys: "Google Maps" },
];

const whyRows = [
  {
    idx: "01 / 03",
    heading: "DFW is one of the most saturated contractor markets in the country.",
    body: "Thousands of licensed HVAC, plumbing, roofing, and electrical companies compete across the metroplex. The AI shortlist has three names. In most DFW suburbs those three names are not yet settled — which means the position is still open to whoever builds the signals first.",
  },
  {
    idx: "02 / 03",
    heading: "North Texas weather makes the search window urgent and short.",
    body: "Hail in spring, triple digits in summer, freezes in winter. Buyers search in compressed bursts, hands full, and take the first credible name AI or Maps surfaces. Being visible on the day the storm hits matters more than ranking well in the abstract.",
  },
  {
    idx: "03 / 03",
    heading: "The operator is here.",
    body: "6 Signal is run from Dallas–Fort Worth. The person reading your audit knows the difference between Southlake and South Dallas, which suburbs a Fort Worth plumber actually drives to, and what a Frisco homeowner means by \"near me.\" That local read is built into every signal.",
  },
];

const faqs = [
  {
    q: "Do you only work with contractors in Dallas–Fort Worth?",
    a: "DFW is home and the primary market. 6 Signal also takes select markets beyond Texas when the trade and market are a fit. The $27 AI Visibility Audit works for any US contractor; the retainer is accepted market by market.",
  },
  {
    q: "Which DFW cities do you cover?",
    a: "The full metroplex: Dallas, Fort Worth, Arlington, Plano, Irving, Garland, Frisco, McKinney, Denton, Grand Prairie, Mesquite, Carrollton, Richardson, Lewisville, Allen, Flower Mound, Mansfield, Southlake, Keller, Grapevine, Burleson, Rockwall, Waxahachie, Red Oak, Weatherford, and the suburbs between them. Exclusivity is set per market and trade, so a Plano HVAC client does not block a Fort Worth HVAC client.",
  },
  {
    q: "What does \"one contractor per market per trade\" mean in DFW?",
    a: "If 6 Signal is building a roofer into the AI shortlist for McKinney, it will not take a second McKinney roofer. Markets are defined by the service area a buyer would actually search — usually a city or a cluster of adjacent suburbs — not the whole metroplex. If your market is already taken, you are told before you spend anything beyond the audit.",
  },
  {
    q: "Is there any proof this works in a Texas market?",
    a: "Yes, published with client permission. X-Act Plumbing in Red Oak, TX was named in 92% of tracked Gemini checks, 74% of ChatGPT checks, and 69% of Perplexity checks across 629 automated checks of 12 real buyer questions, July 7–20, 2026, and appeared at 25 of 25 Google Maps grid points for \"best plumber red oak tx.\" The method and numbers are on the work page.",
  },
  {
    q: "Is this SEO?",
    a: "SEO is one input into one system. It does not touch ChatGPT, Gemini, Perplexity, Siri, or how Google decides which business an AI Overview cites. 6 Signal works six signals — GEO, AEO, LEO, VEO, PEO, IEO — and if you already have an SEO firm, this adds the five channels it does not reach.",
  },
  {
    q: "How do I start?",
    a: "Get the $27 AI Visibility Audit. It runs your company through all six signals instantly, no call required, and the ranked priority list is yours to keep. If the market is open and the audit shows a fit, the 90-day sprint is discussed on the paid Strategy Call — never before.",
  },
];

const schema = graph(
  webPageNode(ROUTE, TITLE, DESC, { breadcrumb: { "@id": `${BASE}${ROUTE}#breadcrumb` } }),
  breadcrumbNode(ROUTE, "Dallas–Fort Worth"),
  {
    "@type": "Service",
    "@id": `${BASE}${ROUTE}#service`,
    name: "AI Visibility for Contractors — Dallas–Fort Worth",
    serviceType: "AI visibility optimization (GEO, AEO, LEO, VEO, PEO, IEO)",
    provider: { "@id": ORG_ID },
    areaServed: DFW_CITIES.map((city) => ({ "@type": "City", name: city, containedInPlace: { "@type": "State", name: "Texas" } })),
    audience: { "@type": "BusinessAudience", audienceType: "Residential and commercial contractors" },
    offers: { "@type": "Offer", name: "AI Visibility Audit", price: "27", priceCurrency: "USD", url: `${BASE}/visibility-check` },
  },
  faqNode(ROUTE, faqs),
);

export default function DallasFortWorthPage() {
  const xact = CASE_STUDIES.find((c) => c.id === "cs-xact-plumbing" && c.status === "real");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Nav />

      {/* HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">6 Signal — Dallas–Fort Worth</span>
            <h1 className="display reveal">
              AI visibility for contractors<br />
              <em>in Dallas–Fort Worth.</em>
            </h1>
            <p className="hero-deck reveal">
              When a homeowner in Plano asks ChatGPT for a plumber, or a Fort Worth owner
              asks Siri for emergency AC repair, three names come back. 6 Signal is the
              practice that gets DFW contractors into those three — run by one operator,
              from here, one contractor per market per trade.
            </p>
            <div className="hero-cta-row reveal">
              <AuditPopupButton className="btn btn-primary btn-lg">
                Get My AI Visibility Audit — $27
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </AuditPopupButton>
              <Link href="/method" className="btn btn-ghost btn-lg">See the six signals</Link>
            </div>
            <div className="hero-sig reveal">
              Instant · No call required · Priority list yours to keep · One contractor per market
            </div>
          </div>
        </div>
      </header>

      {/* WHAT DFW BUYERS ASK */}
      <section className="engagement rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 01 — What DFW buyers actually ask</span>
              <h2 className="display">
                Six systems.<br />
                <em>Three names each.</em>
              </h2>
            </div>
            <div className="right">
              These are the kinds of questions North Texas homeowners put to AI and
              voice assistants every day. Each one returns a shortlist. Each shortlist
              is built from signals most contractors have never looked at.
            </div>
          </div>
          <div className="problem-bullets">
            {prompts.map((p) => (
              <div className="problem-bullet" key={p.q}>
                &ldquo;{p.q}&rdquo; <span className="dim">— {p.sys}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY DFW */}
      <section className="why rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 02 — Why this market</span>
              <h2 className="display">
                Saturated, seasonal,<br />
                <em>and still mostly unclaimed.</em>
              </h2>
            </div>
            <div className="right">
              Three dynamics make AI visibility more decisive in Dallas–Fort Worth than
              in almost any other metro.
            </div>
          </div>
          <div className="why-list">
            {whyRows.map((row) => (
              <div className="why-row" key={row.idx}>
                <div className="r-idx">{row.idx}</div>
                <div>
                  <h3>{row.heading}</h3>
                  <p>{row.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF */}
      {xact && (
        <section className="shift rule">
          <div className="wrap">
            <div className="sec-head">
              <div className="left">
                <span className="idx">§ 03 — Documented in a Texas market</span>
                <h2 className="display">
                  Red Oak, TX.<br />
                  <em>629 checks. Published with permission.</em>
                </h2>
              </div>
              <div className="right">{xact.summary}</div>
            </div>
            <div className="problem-bullets">
              {xact.results.map((r) => (
                <div className="problem-bullet" key={r}>{r}</div>
              ))}
            </div>
            <div className="safety-note" style={{ marginTop: "40px" }}>
              <span className="safety-note-label">Provenance</span>
              <p>
                Every number above comes from 6 Signal&rsquo;s own tracking system — real buyer
                prompts, checked daily across six engines. Nothing on this page is estimated.{" "}
                <Link href="/work" className="dim" style={{ textDecoration: "underline" }}>
                  Full method on the work page →
                </Link>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* CITIES */}
      <section className="engagement rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 04 — Cities served</span>
              <h2 className="display">
                The whole metroplex.<br />
                <em>One contractor per market per trade.</em>
              </h2>
            </div>
            <div className="right">
              Markets are set the way a buyer would search them — a city or a cluster of
              adjacent suburbs — so exclusivity in one does not block another. Trades:{" "}
              <Link href="/hvac">HVAC</Link>, <Link href="/plumbers">plumbing</Link>,{" "}
              <Link href="/roofers">roofing</Link>, <Link href="/electricians">electrical</Link>,{" "}
              <Link href="/remodelers">remodeling</Link>, <Link href="/garage-doors">garage doors</Link>,{" "}
              <Link href="/landscaping">landscaping</Link>, <Link href="/tree-service">tree service</Link>,{" "}
              <Link href="/pest-control">pest control</Link>,{" "}
              <Link href="/foundation-concrete">foundation and concrete</Link>, and{" "}
              <Link href="/commercial-contractors">commercial GCs</Link>.
            </div>
          </div>
          <div className="problem-bullets">
            {DFW_CITIES.map((city) => (
              <div className="problem-bullet" key={city}>{city}, TX</div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section" id="faq">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 05 — Straight answers</span>
              <h2 className="display">
                Questions DFW owners ask<br />
                <em>before the audit.</em>
              </h2>
            </div>
            <div className="right">
              Answered directly. The rest of the questions — and the rest of the answers — are
              on the <Link href="/#faq" style={{ textDecoration: "underline" }}>homepage</Link>.
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

      {/* FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Get the audit</div>
          <h2 className="display">
            Find out who DFW&rsquo;s AI<br />
            <em>is already recommending.</em>
          </h2>
          <p className="f-deck">
            Your $27 audit runs the six-signal read instantly — where contractors in your
            trade and city appear, where you get skipped, and what the competitors in the
            same read look like. If your market is already taken, we&rsquo;ll tell you. You
            keep the full findings either way.
          </p>
          <AuditPopupButton className="btn btn-primary btn-lg">
            Get My AI Visibility Audit — $27
            <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M0 5h14M10 1l4 4-4 4" />
            </svg>
          </AuditPopupButton>
        </div>
      </section>

      <Footer />
      <BlogPageClient />
    </>
  );
}
