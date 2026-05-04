"use client";

import Nav from "./Nav";
import Footer from "./Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import { TradeData, BASE_LAYERS } from "../trades/data";

const CALENDLY = "https://calendly.com/mvw-mattvincentwalker/business-growth-audit";

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
            <a
              href={CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg"
            >
              Book the visibility audit
              <svg
                className="arrow"
                viewBox="0 0 16 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </a>
            <a href="#layers" className="btn btn-ghost btn-lg">
              See how it works
            </a>
          </div>
          <div className="hero-sig reveal">
            Free · 30 minutes · No pitch, no deck, no follow-up chase
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
              specifically for {data.tradePlural}.
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
              Book the audit
            </div>
            <div className="e-body">
              We show you which of these gaps exist in your company, live on the
              call, before anything gets signed. You keep the read either way.
            </div>
          </div>
        </div>
      </section>

      {/* §06 PRICING */}
      <section className="pricing-section rule" id="pricing">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 06 — The retainer</span>
              <h2 className="display">
                One price.
                <br />
                <em>One market. Every month.</em>
              </h2>
            </div>
            <div className="right">
              Flat retainer. No tiers. No setup fees. No upsell path. One{" "}
              {data.tradePlural.toLowerCase()} per market — the position is
              exclusive once it&rsquo;s taken.
            </div>
          </div>

          <div className="pricing-core">
            <div className="p-eyebrow">The 6 Signal Visibility Retainer</div>
            <div className="p-number">
              <span className="dollar">$</span>1,500
              <span className="mo">/ month</span>
            </div>
            <div className="p-sub">
              One {data.tradePlural.toLowerCase()} per local market.{" "}
              <em>If your territory isn&rsquo;t taken yet, it should be yours.</em>
            </div>
            <div className="p-cta">
              <a
                href={CALENDLY}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
              >
                Claim your market
                <svg
                  className="arrow"
                  viewBox="0 0 16 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
            </div>
            <div className="p-guarantee">
              Month-to-month · Cancel anytime · Audit first — retainer only if
              you want to continue
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
          <div className="f-eyebrow">Book the audit</div>
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
            Thirty-minute call. We run your company through all six visibility
            layers, show you exactly where the gaps are, and tell you honestly
            whether 6 Signal is the right fit. If your market is already taken,
            you&rsquo;ll know in thirty seconds — and you still get the full read.
          </p>
          <div className="f-cta">
            <a
              href={CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg"
            >
              Book the audit
              <svg
                className="arrow"
                viewBox="0 0 16 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              >
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </a>
            <a
              href="mailto:mvw@mattvincentwalker.com?subject=%F0%9F%94%A5%206%20Signal%20%F0%9F%94%A5"
              className="btn btn-ghost btn-lg"
            >
              Email directly
            </a>
          </div>
          <div className="f-notes">
            <span>Free</span>
            <span>30 minutes</span>
            <span>No pitch</span>
            <span>One client per market</span>
          </div>
        </div>
      </section>

      <Footer />

      <div className="mobile-cta">
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer">
          Book the visibility audit
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
        </a>
      </div>
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
    </>
  );
}
