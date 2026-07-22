"use client";

import Link from "next/link";
import Nav from "./Nav";
import Footer from "./Footer";
import AuditExamplesSection from "./proof/AuditExamplesSection";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import { TradeData, BASE_LAYERS } from "../trades/data";
import AuditPopupButton from "./AuditPopupButton";

const BASE_URL = "https://6signal.co";

function TradeJsonLd({ data }: { data: TradeData }) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
      { "@type": "ListItem", position: 2, name: data.tradePlural, item: `${BASE_URL}/${data.slug}` },
    ],
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `AI Visibility Audit for ${data.tradePlural}`,
    description: `6Signal audits ${data.tradePlural.toLowerCase()} across six AI and search visibility layers — GEO, PEO, AEO, IEO, LEO, and VEO — delivering a prioritized fix list for your local market.`,
    provider: { "@type": "ProfessionalService", name: "6Signal", url: BASE_URL },
    areaServed: "Dallas-Fort Worth and North Texas",
    serviceType: "AI Visibility Audit",
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((faq) => ({
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

const sing = (s: string) =>
  s.toLowerCase().replace(/ies$/i, "y").replace(/s$/i, "");

interface TradePageProps {
  data: TradeData;
}

export default function TradePage({ data }: TradePageProps) {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* HERO */}
      <header className="inner-hero">
        <div className="hero-glow" />
        <div className="wrap hero-inner">
          <div className="hero-meta reveal">
            <span className="dot" />
            <span className="rail" />
            <span>{data.heroMeta}</span>
          </div>

          <h1 className="display reveal">
            <span className="line">{data.headline1}</span>
            <span className="line">
              <em>{data.headline2Em}</em>
            </span>
            {data.headline3Dim && (
              <span className="line dim">{data.headline3Dim}</span>
            )}
          </h1>

          <p className="hero-deck reveal">{data.heroDeck}</p>

          <div className="hero-cta-row reveal">
            <AuditPopupButton className="btn btn-primary btn-lg">
              Get the AI Visibility Brief
              <svg
                className="arrow"
                viewBox="0 0 16 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </AuditPopupButton>
            <a href="#layers" className="btn btn-ghost btn-lg">
              See how it works
            </a>
          </div>
          <div className="hero-sig reveal">
            Instant AI Visibility Brief — $27 · No call required · Priority list yours to keep
          </div>
        </div>
      </header>

      {/* §02 THE MOMENT */}
      <section className="shift rule">
        <div className="wrap">
          <div className="shift-scene">
            <div className="caption">{data.problemCaption}</div>
            <p>
              <strong>{data.problemStrong1}</strong>
            </p>
            <p className="dim">{data.problemDim}</p>
            <p>
              <strong>{data.problemStrong2}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* §03 WHY */}
      <section className="why rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">{data.whyIdx}</span>
              <h2 className="display">
                {data.whyLine1}
                <br />
                <em>{data.whyLine2Em}</em>
              </h2>
            </div>
            <div className="right">{data.whyDeck}</div>
          </div>

          <div className="why-list">
            {data.whyRows.map((row) => (
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

      {/* MID CTA */}
      <section className="mid-cta">
        <div className="wrap">
          <h3>
            Every day this runs,{" "}
            <em>
              three {data.tradePlural.toLowerCase()} get the calls you could be getting.
            </em>
            <br />
            The audit shows whether your company is one of them.
          </h3>
          <AuditPopupButton
            className="btn btn-primary"
          >
            Get the audit
            <svg
              className="arrow"
              viewBox="0 0 16 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            >
              <path d="M0 5h14M10 1l4 4-4 4" />
            </svg>
          </AuditPopupButton>
          <div className="sub">One {sing(data.tradePlural).toLowerCase()} per market · Market conflict check</div>
        </div>
      </section>

      {/* §04 THE SIX LAYERS */}
      <section className="layers-section" id="layers">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 04 — The six layers</span>
              <h2 className="display">
                Six systems decide.
                <br />
                <em>We work all six.</em>
              </h2>
            </div>
            <div className="right">
              Each one is a different channel where your name gets surfaced —
              or doesn&rsquo;t. Here&rsquo;s what each layer looks like
              specifically for {data.tradePlural}.{" "}
              <Link href="/method" className="dim" style={{ textDecoration: "underline" }}>
                Full methodology →
              </Link>
            </div>
          </div>

          {BASE_LAYERS.map((layer, i) => {
            const ex = data.layerExamples[i];
            return (
              <div className="layer-row" key={layer.num}>
                <div className="l-idx">{layer.num}</div>
                <div className="l-acro">{layer.acro}</div>
                <div className="l-body">
                  <h3>{layer.title}</h3>
                  <p>
                    {ex.body} <span className="dim">{ex.dim}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* §05 GAPS AUDIT */}
      <section className="engagement rule" id="audit">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 05 — The visibility audit</span>
              <h2 className="display">
                What we find
                <br />
                <em>in most {data.tradePlural.toLowerCase()}.</em>
              </h2>
            </div>
            <div className="right">{data.auditNote}</div>
          </div>

          <div className="problem-bullets">
            {data.gaps.map((gap, i) => (
              <div className="problem-bullet" key={i}>
                {gap}
              </div>
            ))}
          </div>

          <div className="engage-row" style={{ marginTop: "48px" }}>
            <div className="e-idx">→</div>
            <div className="e-title">
              <span className="phase">Next</span>
              Get the audit
            </div>
            <div className="e-body">
              Your $27 brief runs the six-layer read automatically — gap by gap,
              layer by layer — so you see exactly what exists before you spend a
              dollar more. No call, no waiting. Full findings are yours to keep
              whether or not you continue.
            </div>
          </div>
          <div className="safety-note" style={{ marginTop: "40px" }}>
            <span className="safety-note-label">How the audit works</span>
            <p>
              <strong>Your <Link href="/audit" className="dim" style={{ textDecoration: "underline" }}>six-layer read</Link> runs instantly, no call required.</strong> If
              you want to go further, a $97 brief turns it into an action plan,
              and a paid $197 call with Matt Vincent Walker walks through it live.
              If there&rsquo;s a fit for the retainer, we&rsquo;ll say so once. If
              it&rsquo;s not a fit, we&rsquo;ll say that first.{" "}
              <em>The full findings are yours either way.</em>
            </p>
          </div>
        </div>
      </section>

      <AuditExamplesSection
        maxItems={2}
        idx="What audits find"
        headlineTop="Illustrative findings."
        headlineEm="Common gaps across trades."
        deckRight="Format examples showing the types of visibility gaps that surface in a live audit read — across AI tools, Maps, entity data, and voice search."
      />

      {/* §06 PRICING */}
      <section className="pricing-section rule" id="pricing">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 06 — The engagement</span>
              <h2 className="display">
                One sprint.
                <br />
                <em>One market. Then you decide.</em>
              </h2>
            </div>
            <div className="right">
              One bounded engagement. No tiers. No setup fees. No open-ended contracts. One{" "}
              {sing(data.tradePlural)} per market — the position is exclusive
              once it&rsquo;s taken.
            </div>
          </div>

          <div className="pricing-core">
            <div className="p-eyebrow">The 90-Day Visibility Sprint</div>
            <div className="p-number" style={{ fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "-0.01em" }}>
              Discussed on the Strategy Call
            </div>
            <div className="p-sub">
              One {sing(data.tradePlural)} per local market.{" "}
              <em>If your territory isn&rsquo;t taken yet, it should be yours.</em>
            </div>
            <div className="p-cta">
              <AuditPopupButton
                className="btn btn-primary btn-lg"
              >
                Get My AI Visibility Brief — $27
                <svg
                  className="arrow"
                  viewBox="0 0 16 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </AuditPopupButton>
            </div>
            <div className="p-guarantee">
              90 days, scored before/after · Month-to-month retainer after — only if the results earn it · Audit first, always
            </div>
          </div>

          <div className="pricing-detail">
            <div className="pricing-note">
              <p>
                <span className="highlight">
                  One {sing(data.tradePlural)} per local market, per trade.
                </span>{" "}
                The engagement never competes against itself — your position is
                exclusive from the day you sign, and we don&rsquo;t take a
                second client in your market.
              </p>
              <p className="italic" style={{ marginTop: "20px" }}>
                Start with the $27 AI Visibility Brief — instant, no call
                required. If your market&rsquo;s open and the Sprint looks like
                a fit, it gets discussed on the paid Strategy Call, not before.
                If it&rsquo;s already taken, we&rsquo;ll tell you — and you keep
                the full read regardless.
              </p>
            </div>

            <div className="included">
              <h4>Included in the engagement</h4>
              <div>Full visibility audit across all six layers</div>
              <div>Local entity cleanup — Maps, listings, citations, directories</div>
              <div>Answer-ready content structure and schema</div>
              <div>Prompt and AI recommendation work</div>
              <div>Monthly signal report and 90-day roadmap</div>
              <div>Direct access to the operator running your account</div>
            </div>
          </div>
        </div>
      </section>

      {/* §07 FAQ */}
      <section className="faq-section" id="faq">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 07 — Straight answers</span>
              <h2 className="display">
                Honest questions.
                <br />
                <em>Answered honestly.</em>
              </h2>
            </div>
            <div className="right">
              The questions {data.tradePlural.toLowerCase()} ask before
              committing. All of them, answered directly.
            </div>
          </div>

          <div className="faq-list">
            {data.faqs.map((faq, i) => (
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

      {/* §08 FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Get the audit</div>
          <h2 className="display">
            {data.finalLine1}
            <br />
            <em>{data.finalLine2Em}</em>
            {data.finalLine3Dim && (
              <>
                <br />
                <span className="dim">{data.finalLine3Dim}</span>
              </>
            )}
          </h2>
          <p className="f-deck">
            Your $27 brief runs the six-layer read instantly — where{" "}
            {data.tradePlural.toLowerCase()} in your market appear, where you
            get skipped, and what your competitors look like in the same read.
            No call, no waiting. If your market is already taken, we&rsquo;ll
            tell you. You keep the full findings either way.
          </p>
          <div className="f-cta">
            <AuditPopupButton
              className="btn btn-primary btn-lg"
            >
              Get the audit
              <svg
                className="arrow"
                viewBox="0 0 16 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </AuditPopupButton>
          </div>
          <div className="f-notes">
            <span>AI Visibility Brief — $27</span>
            <span>Instant results</span>
            <span>No commitment required</span>
            <span>One client per market</span>
          </div>
        </div>
      </section>

      <Footer />

      <TradeJsonLd data={data} />

      <div className="mobile-cta">
        <AuditPopupButton>
          Get the audit
          <svg
            width="14"
            height="10"
            viewBox="0 0 16 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="M0 5h14M10 1l4 4-4 4" />
          </svg>
        </AuditPopupButton>
      </div>
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
    </>
  );
}
