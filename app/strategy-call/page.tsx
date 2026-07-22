"use client";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

const STRIPE_197 = "https://buy.stripe.com/3cI00kcVUdjB8P76bf3ks0x";

// What we walk through on the call — adapted from the six-layer audit read.
const walkthrough = [
  {
    num: "01",
    title: "What AI tools say about your company",
    body: "The actual language ChatGPT, Gemini, and Perplexity use when asked for contractors in your trade and city. Most contractors have never seen this. Most of what the machines say is wrong, outdated, or missing entirely.",
  },
  {
    num: "02",
    title: "Whether you appear in recommendation prompts",
    body: "The exact queries your customers are typing and voice-searching. You see whether your name appears in the answer — and where a competitor is filling your spot instead.",
  },
  {
    num: "03",
    title: "Whether Google and Maps understand your business",
    body: "Your GBP listing, service area, categories, photos, posts, and reviews — reviewed for accuracy and machine-readability against what AI systems actually parse when building a shortlist.",
  },
  {
    num: "04",
    title: "Whether your reviews support the work you want to be known for",
    body: "Reviews are data. The right ones confirm your specialty. The wrong ones — or the absence of them — confuse every AI system that reads them and assigns you categories you don't want.",
  },
  {
    num: "05",
    title: "Which competitors are showing up instead",
    body: "The same six-layer read, run against your top local competitors. You see who's on the shortlist in your market, which layers they've covered, and where the gap is widest.",
  },
  {
    num: "06",
    title: "What to fix first — and in what order",
    body: "We pressure-test the priority list in your audit against your actual business: your capacity, your season, your market. You leave knowing the sequence, not just the list.",
  },
];

const leaveWith = [
  {
    num: "01",
    title: "A clear execution decision",
    desc: "Do it yourself with the Strategy Brief as your manual, hand it to your web person, or engage 6Signal. You leave knowing which — no ambiguity, no follow-up chase.",
  },
  {
    num: "02",
    title: "Your priorities, sequenced against your real business",
    desc: "The audit ranks your gaps. The call ranks them against your capacity, your season, and your market — the part no automated report can do.",
  },
  {
    num: "03",
    title: "The Strategy Brief — included",
    desc: "The $97 implementation plan comes with the call at no extra charge if you haven't bought it separately. Signal-by-signal actions, content specs, schema, and a 90-day calendar.",
  },
  {
    num: "04",
    title: "A straight answer on the retainer",
    desc: "If the 90-Day Visibility Sprint is a fit for your market, we'll say so once — clearly, without pressure. If it's not a fit, we'll say that instead. You paid for an hour of straight answers, not a sales pitch.",
  },
];

const notList = [
  "Not a discovery call disguised as a strategy session",
  "Not a website design review or a critique of your branding",
  "Not a pitch for paid search, PPC, or ad spend",
  "Not a software demo or a licensing upsell",
  "Not an AI hype session about how everything is going to change",
  "Not a call where someone reads a PDF back to you",
];

const faqs = [
  {
    q: "Do I need the $27 audit before booking?",
    a: "It's the best starting point — the call is built around walking through your results. If you book without one, we'll run your audit before the call and include the Strategy Brief at no extra charge, so the hour is spent on findings either way.",
  },
  {
    q: "Will you pitch me on the retainer?",
    a: "If there's a fit, it gets mentioned once — clearly, without pressure. If it's not a fit, we'll say that instead. Either way, the hour belongs to your results, not a sales script.",
  },
  {
    q: "Who is actually on the call?",
    a: "Matt Vincent Walker — the operator who runs every 6Signal account. No account managers, no junior staff. The person on your call is the person who would do the work.",
  },
  {
    q: "What if my market is already taken?",
    a: "We take one contractor per trade per market. If yours is already placed, we'll tell you — and the call still delivers the full walkthrough, the sequencing, and the Strategy Brief. The findings are yours regardless.",
  },
  {
    q: "I already pay an SEO company. Is this still useful?",
    a: "Probably. Most SEO companies work on blue-link rankings — that's one layer of six. The call shows you exactly which of the other five layers are covered, which aren't, and what to hand your SEO firm versus what needs different work.",
  },
  {
    q: "How do I book?",
    a: "Pay the $197 and the scheduling page appears immediately after checkout. Pick your time, answer four short prep questions, and you're set. The call is one hour on Zoom.",
  },
];

export default function StrategyCallPage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">The Strategy Call — $197</span>
            <h1 className="display reveal">
              One hour. Your results.<br />
              <em>The operator, live.</em>
            </h1>
            <p className="hero-deck reveal">
              Your AI Visibility Audit shows where you stand. The Strategy Call is
              where we pressure-test it together — layer by layer, against your
              actual business — and you leave with a clear execution decision.
            </p>
            <div className="hero-cta-row reveal">
              <a href={STRIPE_197} className="btn btn-primary btn-lg">
                Book the Strategy Call — $197
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
              <a href="#covered" className="btn btn-ghost btn-lg">What&rsquo;s covered</a>
            </div>
            <div className="hero-sig reveal">
              1 hour on Zoom · Includes the $97 Strategy Brief · Scheduling appears after checkout
            </div>
          </div>
        </div>
      </header>

      {/* §01 — WHAT WE WALK THROUGH */}
      <section className="audit-reveals-section rule" id="covered">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 01 — What we walk through</span>
              <h2 className="display">
                Six reads.<br />
                <em>Live. Against your business.</em>
              </h2>
            </div>
            <div className="right">
              Your audit generates the findings automatically. The call is where
              they get interrogated — your company, your competitors, your market,
              with the person who runs every 6Signal account.
            </div>
          </div>
          <div className="reveals-grid">
            {walkthrough.map((r) => (
              <div className="reveal-item reveal" key={r.num}>
                <span className="reveal-num">{r.num}</span>
                <div className="reveal-title">{r.title}</div>
                <div className="reveal-body">{r.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §02 — WHAT YOU LEAVE WITH */}
      <section className="rule" id="leave-with" style={{ paddingBottom: "100px" }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 02 — What you leave with</span>
              <h2 className="display">
                Four things.<br />
                <em>Yours after the hour.</em>
              </h2>
            </div>
            <div className="right">
              Not a recap email. Not a follow-up sequence. A decision, a sequence,
              the implementation plan, and a straight answer.
            </div>
          </div>
          <div className="deliverables-list">
            {leaveWith.map((d) => (
              <div className="deliverable-row reveal" key={d.num}>
                <div className="deliverable-num">{d.num}</div>
                <div className="deliverable-title">{d.title}</div>
                <div className="deliverable-desc">{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §03 — WHAT THIS IS NOT */}
      <section className="rule" style={{ paddingBottom: "100px" }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 03 — What this is not</span>
              <h2 className="display">
                Worth saying clearly<br />
                <em>before you pay for an hour.</em>
              </h2>
            </div>
            <div className="right">
              There are a lot of audits, demos, and discovery calls that waste an
              hour of your time. You&rsquo;re paying precisely so this isn&rsquo;t
              one of those.
            </div>
          </div>
          <div className="not-list">
            {notList.map((item, i) => (
              <div className="not-item reveal" key={i}>{item}</div>
            ))}
          </div>
        </div>
      </section>

      {/* §04 — HOW IT WORKS */}
      <section className="engagement rule" id="how-it-works">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 04 — How it works</span>
              <h2 className="display">
                Three steps.<br />
                <em>No back-and-forth.</em>
              </h2>
            </div>
            <div className="right">
              Everything before the call is self-serve. The hour itself is the
              only part of 6Signal&rsquo;s funnel where you talk to a human — by
              design.
            </div>
          </div>
          <div className="engage-table">
            <div className="engage-row reveal">
              <div className="e-idx">01</div>
              <div className="e-title">
                <span className="phase">Pay</span>
                Book the call — $197
              </div>
              <div className="e-body">
                Secure checkout via Stripe. The scheduling page appears
                immediately after payment — pick your time while you&rsquo;re
                there.
              </div>
            </div>
            <div className="engage-row reveal">
              <div className="e-idx">02</div>
              <div className="e-title">
                <span className="phase">Prep</span>
                We come ready
              </div>
              <div className="e-body">
                Four short questions at booking tell us what you want
                pressure-tested. If you haven&rsquo;t run your $27 audit yet,
                we run it before the call — and the $97 Strategy Brief is
                included at no extra charge.
              </div>
            </div>
            <div className="engage-row reveal">
              <div className="e-idx">03</div>
              <div className="e-title">
                <span className="phase">The hour</span>
                One hour, live, on your results
              </div>
              <div className="e-body">
                Layer by layer, gap by gap, against your competitors. You leave
                with a clear execution decision — and if the 90-Day Visibility
                Sprint fits your market, that conversation happens here, once,
                without pressure.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* §05 — FAQ */}
      <section className="faq-section" id="faq">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 05 — Straight answers</span>
              <h2 className="display">
                Honest questions.<br />
                <em>Answered honestly.</em>
              </h2>
            </div>
            <div className="right">
              What serious buyers ask before paying for an hour.
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
          <div className="f-eyebrow">The Strategy Call</div>
          <h2 className="display">
            You&rsquo;ve seen the findings.<br />
            <em>Now decide what to do with them.</em>
          </h2>
          <p className="f-deck">
            One hour with the operator who runs every 6Signal account. Your audit,
            pressure-tested against your actual business. A clear execution
            decision — and the Strategy Brief included at no extra charge.
          </p>
          <div className="f-cta">
            <a href={STRIPE_197} className="btn btn-primary btn-lg">
              Book the Strategy Call — $197
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </a>
          </div>
          <div className="f-notes">
            <span>$197 · 1 hour on Zoom</span>
            <span>Includes the $97 Strategy Brief</span>
            <span>One contractor per market</span>
            <span>No follow-up chase</span>
          </div>
        </div>
      </section>

      <Footer />

      <div className="mobile-cta">
        <a href={STRIPE_197} className="btn">
          Book the Call — $197
          <svg width="14" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M0 5h14M10 1l4 4-4 4" />
          </svg>
        </a>
      </div>
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
    </>
  );
}
