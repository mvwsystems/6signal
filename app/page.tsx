"use client";
import Link from "next/link";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import { useMicroInteractions } from "./hooks/useMicroInteractions";

const CALENDLY = "https://calendly.com/mvw-mattvincentwalker/business-growth-audit";

const signals = [
  { num: "01", acro: "TRUST", title: "Trust Signal", body: "Do you look legitimate at first glance?", dim: "Within five seconds a buyer forms an impression. Your site either passes or it doesn't." },
  { num: "02", acro: "CLARITY", title: "Clarity Signal", body: "Is it immediately obvious what you do, where you work, and who to call?", dim: "Vague websites lose people fast. Clarity converts." },
  { num: "03", acro: "PROOF", title: "Proof Signal", body: "Can people see your work, read your reviews, and verify your credentials?", dim: "Proof does the selling before you pick up the phone." },
  { num: "04", acro: "SEARCH", title: "Search Signal", body: "Can Google find you for the services and locations you actually serve?", dim: "Structure and on-page fundamentals that make you visible where it counts." },
  { num: "05", acro: "CONVERT", title: "Conversion Signal", body: "Is it easy to call, fill out a form, or request a quote?", dim: "Every extra step costs you a lead. We remove the friction." },
  { num: "06", acro: "FOLLOW", title: "Follow-Up Signal", body: "When a lead comes in, is it handled fast — or does it sit?", dim: "The first company to respond usually wins. Most contractors are too slow." },
];

const included = [
  "Custom contractor website built for your company",
  "Copy that explains what you do clearly — written for you",
  "Mobile-first design that works on any device",
  "Homepage, service pages, about page, contact page",
  "Review and project proof sections",
  "Clear call and quote request CTAs throughout",
  "Basic on-page SEO structure",
  "Fast loading, clean code",
  "Built to make your company look credible before the first call",
];

const careItems = [
  "Hosting and uptime monitoring",
  "Small edits and content updates",
  "Form and function checks",
  "Support when something breaks",
  "Monthly site review",
  "One point of contact for anything website-related",
];

const workCards = [
  { trade: "Roofing", title: "Placeholder — Roofing Company", body: "Full website rebuild. New copy, mobile layout, proof sections, clear CTAs." },
  { trade: "Plumbing", title: "Placeholder — Plumbing Contractor", body: "Replaced outdated site. Clean design, service area pages, review integration." },
  { trade: "HVAC", title: "Placeholder — HVAC Operator", body: "Rebuilt from scratch. Brand refresh, service pages, quote form." },
];

export default function Home() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* HERO */}
      <header className="hero">
        <div className="hero-glow" />
        <div className="wrap hero-inner">
          <div className="hero-meta reveal">
            <span className="dot" />
            <span className="rail" />
            <span>Trust-First Contractor Websites</span>
          </div>

          <h1 className="display reveal">
            <span className="line">Your website should</span>
            <span className="line">make you look as good</span>
            <span className="line"><em>as your work.</em></span>
          </h1>

          <p className="hero-deck reveal">
            6 Signal builds fast, professional websites for contractors who are tired of looking
            smaller, cheaper, or less credible online than they really are.
          </p>

          <div className="hero-cta-row reveal">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              Get My Website Rebuilt
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </a>
            <Link href="/work" className="btn btn-ghost btn-lg">See Recent Work</Link>
          </div>
          <div className="hero-sig reveal">
            $1,500 flat · Optional $97/month care · Built in days, not months
          </div>

          <div className="trust-strip reveal">
            <div className="label">Built for —</div>
            <div className="systems">
              <div className="sys">Roofers</div>
              <div className="sys">Plumbers</div>
              <div className="sys">HVAC</div>
              <div className="sys">Electricians</div>
              <div className="sys">General Contractors</div>
              <div className="sys">Landscapers</div>
            </div>
          </div>
        </div>
      </header>

      {/* §01 PROBLEM */}
      <section className="problem-section rule">
        <div className="wrap">
          <span className="idx">§ 01 — The problem</span>
          <p className="problem-lead">
            Most contractors don&rsquo;t have a workmanship problem.{" "}
            <em>They have a trust-transfer problem.</em>
          </p>
          <div className="problem-cols">
            <div className="problem-text">
              Your real reputation — built from years of good work, satisfied customers, and a crew
              that shows up — <strong>doesn&rsquo;t automatically transfer online.</strong>
              <br /><br />
              Someone checking you out at 9 p.m. on their phone sees your website. Not your trucks.
              Not your crew. Not the job you just finished. Your website.
              <br /><br />
              <span className="dim">
                If that site looks weak, outdated, or unclear, they move on. Not because you&rsquo;re
                not the right company. Because the website didn&rsquo;t prove it fast enough.
              </span>
            </div>
            <div className="problem-bullets">
              {[
                "Buyers research before they call. A weak site loses them before you even answer.",
                "A bad website makes a strong company look like a small one.",
                "Your competitors who look better online are winning jobs they don't deserve.",
                "You don't need a bigger marketing budget. You need a better foundation.",
                "Every day with the current site is a day working against your reputation.",
              ].map((b, i) => (
                <div key={i} className="problem-bullet">{b}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* §02 SIX SIGNALS */}
      <section className="layers-section" id="framework">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 02 — How we build</span>
              <h2 className="display">
                Six signals.<br />
                <em>Every site we build is designed to strengthen all of them.</em>
              </h2>
            </div>
            <div className="right">
              Most contractor websites fail on at least three of these. We fix all six in one
              engagement — no extra retainers, no drip-feed strategy.
            </div>
          </div>
          {signals.map((s) => (
            <div className="layer-row" key={s.num}>
              <div className="l-idx">{s.num}</div>
              <div className="l-acro">{s.acro}</div>
              <div className="l-body">
                <h3>{s.title}</h3>
                <p>{s.body} <span className="dim">{s.dim}</span></p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* §03 OFFER */}
      <section className="pricing-section rule" id="offer">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 03 — The offer</span>
              <h2 className="display">
                One price.<br />
                <em>Everything included.</em>
              </h2>
            </div>
            <div className="right">
              No hourly billing. No surprise scope creep. No agency overhead. One flat price for a
              complete contractor website that makes your company look as good as your work.
            </div>
          </div>

          <div className="pricing-core">
            <div className="p-eyebrow">The 6 Signal Contractor Website Rebuild</div>
            <div className="p-number">
              <span className="dollar">$</span>1,500
              <span className="mo">flat</span>
            </div>
            <div className="p-sub">
              One company. One project. One price.{" "}
              <em>Built to make you look credible before the first call.</em>
            </div>
            <div className="p-cta">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                Get My Website Rebuilt
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
              <Link href="/websites" className="btn btn-ghost btn-lg">See What&rsquo;s Included</Link>
            </div>
            <div className="p-guarantee">Fast turnaround · Mobile-first · Written for contractors</div>
          </div>

          <div className="pricing-detail">
            <div className="pricing-note">
              <p>
                <span className="highlight">Everything in the rebuild is included in that price</span>{" "}
                — copy, design, pages, proof sections, SEO structure, and launch.
              </p>
              <p className="italic" style={{ marginTop: "20px" }}>
                We don&rsquo;t charge extra for pages, revisions within scope, or for writing your
                copy. The price is the price.
              </p>
            </div>
            <div className="included">
              <h4>Included in every rebuild</h4>
              {included.map((item, i) => (
                <div key={i}>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* §04 CARE */}
      <section className="care-section rule" id="care">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 04 — Optional care</span>
              <h2 className="display">
                Keep the site working.<br />
                <em>Keep your peace of mind.</em>
              </h2>
            </div>
            <div className="right">
              Not required. Strongly recommended. After we build the site, someone needs to keep the
              lights on. That&rsquo;s what the care plan is for.
            </div>
          </div>
          <div className="care-card">
            <div className="care-price">
              <span className="dollar">$</span>97
              <span className="mo">/ mo</span>
            </div>
            <div className="care-right">
              <h3>Website Care Plan</h3>
              <p className="care-sub">
                Hosting, monitoring, support, and small updates — handled. One less thing to think about.
              </p>
              <div className="feat-list">
                {careItems.map((item, i) => (
                  <div key={i} className="feat-item">{item}</div>
                ))}
              </div>
              <Link href="/care" className="btn btn-ghost">Learn More About Care</Link>
            </div>
          </div>
        </div>
      </section>

      {/* §05 UPSELLS */}
      <section className="upsells-section">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 05 — After the foundation</span>
              <h2 className="display">
                Need more than<br />
                <em>a better website?</em>
              </h2>
            </div>
            <div className="right">
              Once the foundation is right, 6 Signal can help with what comes next. These are
              secondary engagements — not part of the website rebuild.
            </div>
          </div>
          <div className="upsell-grid">
            <div className="upsell-card">
              <span className="upsell-num">01 — Reviews & Trust</span>
              <div className="upsell-title">Review + Trust Engine</div>
              <p className="upsell-body">
                More reviews, better proof, testimonial placement, and ongoing trust-building work.
                For contractors who want their reputation to show up everywhere buyers look.
              </p>
              <Link href="/contact" className="upsell-link">Learn more →</Link>
            </div>
            <div className="upsell-card">
              <span className="upsell-num">02 — Local Visibility</span>
              <div className="upsell-title">6 Signal Visibility</div>
              <p className="upsell-body">
                Google Business Profile, local SEO, service-area pages, and AI/search visibility.
                For contractors who want to show up when buyers are actively searching.
              </p>
              <Link href="/visibility" className="upsell-link">Learn more →</Link>
            </div>
            <div className="upsell-card">
              <span className="upsell-num">03 — Lead Response</span>
              <div className="upsell-title">AI Follow-Up Layer</div>
              <p className="upsell-body">
                Missed-call text-back, form follow-up, AI receptionist, and lead routing. For
                contractors who get leads but lose them to slow response times.
              </p>
              <Link href="/follow-up" className="upsell-link">Learn more →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* §06 WORK */}
      <section className="work-section rule" id="work">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 06 — Recent work</span>
              <h2 className="display">
                Contractor websites<br />
                <em>built to earn trust.</em>
              </h2>
            </div>
            <div className="right">
              Before-and-after examples coming soon. Below are placeholder cards for recent
              contractor website rebuilds.
            </div>
          </div>
          <div className="work-grid">
            {workCards.map((card, i) => (
              <div key={i} className="work-card">
                <div className="work-card-trade">{card.trade}</div>
                <div className="work-card-title">{card.title}</div>
                <p className="work-card-body">{card.body}</p>
                <div className="work-card-status">Case study coming soon</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "48px", textAlign: "center" }}>
            <Link href="/work" className="btn btn-ghost">View All Work</Link>
          </div>
        </div>
      </section>

      {/* §07 FIT */}
      <section className="fit-section">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 07 — Honest fit</span>
              <h2 className="display">
                Who this is for.<br />
                <em>And who it isn&rsquo;t.</em>
              </h2>
            </div>
            <div className="right">
              We work with contractors who take their business seriously. Not everyone is the right
              fit — and we&rsquo;d rather say so upfront.
            </div>
          </div>
          <div className="fit-grid">
            <div className="fit-col yes">
              <div className="f-label"><span className="sym">+</span>Built for</div>
              <ul>
                <li>Contractors doing solid work whose website doesn&rsquo;t reflect it.</li>
                <li>Companies with outdated or unclear sites that are costing them trust.</li>
                <li>Operators who want a professional result without a bloated agency process.</li>
                <li>Businesses ready to start with the foundation before spending on ads or SEO.</li>
              </ul>
            </div>
            <div className="fit-col no">
              <div className="f-label"><span className="sym">–</span>Not for</div>
              <ul>
                <li>Anyone looking for the cheapest option or endless free revisions.</li>
                <li>Businesses that don&rsquo;t have basic service info or photos ready to share.</li>
                <li>Companies expecting leads in week one from the website alone.</li>
                <li>Anyone who wants a giant custom software project for $1,500.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* §08 FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Get My Website Rebuilt</div>
          <h2 className="display">
            Stop letting your website<br />
            undersell your work.
          </h2>
          <p className="f-deck">
            Book a free 30-minute call. We&rsquo;ll look at your current site, tell you exactly what
            needs to change, and give you a straight answer on whether we&rsquo;re the right fit.
            No pitch. No pressure.
          </p>
          <div className="f-cta">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              Get My Website Rebuilt
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </a>
            <a
              href="mailto:mvw@mattvincentwalker.com?subject=%F0%9F%94%A5%206%20Signal%20%F0%9F%94%A5"
              className="btn btn-ghost btn-lg"
            >
              Email Directly
            </a>
          </div>
          <div className="f-notes">
            <span>$1,500 flat</span>
            <span>30-min call</span>
            <span>No pitch</span>
            <span>Fast turnaround</span>
          </div>
        </div>
      </section>

      <Footer />

      <div className="mobile-cta">
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer">
          Get My Website Rebuilt
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
