"use client";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

const CALENDLY = "https://calendly.com/mvw-mattvincentwalker/business-growth-audit";

const components = [
  {
    num: "01",
    title: "Google Business Profile",
    body: "Your GBP listing is often the first thing buyers see — before your website. We optimize it fully: categories, services, photos, hours, service areas, and ongoing post activity.",
  },
  {
    num: "02",
    title: "Local SEO Foundations",
    body: "Citation consistency across directories, NAP accuracy, service-area page structure, and on-page fundamentals that help Google understand where you work and what you do.",
  },
  {
    num: "03",
    title: "Service Area Pages",
    body: "Dedicated pages for every city and zip code you serve. Properly structured, locally relevant, and built to rank — not boilerplate junk that hurts more than it helps.",
  },
  {
    num: "04",
    title: "AI Search Presence",
    body: "Contractors are increasingly being recommended by AI tools like ChatGPT and Gemini. We structure your content and authority signals to show up where AI is recommending local services.",
  },
];

export default function VisibilityPage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* INNER HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">6 Signal Visibility</span>
            <h1 className="display reveal">
              Show up where<br />
              <em>buyers are looking.</em>
            </h1>
            <p className="hero-deck reveal">
              A great website is the foundation. Visibility is what drives buyers to it.
              Local SEO, Google Business Profile, service area pages, and AI search presence —
              built for contractors who are ready to be found.
            </p>
            <div className="hero-cta-row reveal">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                Book a Discovery Call
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
              <Link href="/websites" className="btn btn-ghost btn-lg">Start with the Website</Link>
            </div>
            <div className="hero-sig reveal">
              Secondary engagement — website rebuild recommended first
            </div>
          </div>
        </div>
      </header>

      {/* PROBLEM */}
      <section className="problem-section rule">
        <div className="wrap">
          <span className="idx">The visibility problem</span>
          <p className="problem-lead">
            Having a good website doesn&rsquo;t mean buyers can find it.{" "}
            <em>Visibility is a separate problem.</em>
          </p>
          <div className="problem-cols">
            <div className="problem-text">
              Search has changed. Buyers don&rsquo;t just Google and click the first blue link.
              They check Google Maps, ask AI chatbots, read reviews, and compare GBP listings
              before they ever visit a website.
              <br /><br />
              Most contractors are invisible in at least two or three of these channels — and
              don&rsquo;t know it.
              <br /><br />
              <span className="dim">
                Visibility work fixes that. It&rsquo;s not magic — it&rsquo;s structure,
                consistency, and content built for the way buyers actually search.
              </span>
            </div>
            <div className="problem-bullets">
              {[
                "Your GBP listing is incomplete or inconsistent with your website.",
                "You serve 10 cities but only rank in one.",
                "AI tools recommend competitors who have better-structured content.",
                "Your directory listings have old addresses, phone numbers, or business names.",
                "You get website traffic but no one can find you on Maps.",
              ].map((b, i) => (
                <div key={i} className="problem-bullet">{b}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE DO */}
      <section className="layers-section rule" id="components">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">What we build</span>
              <h2 className="display">
                Four components.<br />
                <em>Built to work together.</em>
              </h2>
            </div>
            <div className="right">
              Visibility isn&rsquo;t one thing — it&rsquo;s four overlapping channels that
              reinforce each other. We build all of them, not just the easy one.
            </div>
          </div>
          {components.map((c) => (
            <div className="layer-row reveal" key={c.num}>
              <div className="l-idx">{c.num}</div>
              <div className="l-acro" style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.02em" }}>{c.title}</div>
              <div className="l-body">
                <p>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NOTE */}
      <section className="rule" style={{ padding: "80px 0 100px" }}>
        <div className="wrap">
          <div className="pricing-detail reveal">
            <div className="pricing-note">
              <p>
                <span className="highlight">Visibility is a secondary engagement.</span>{" "}
                We strongly recommend starting with a website rebuild — visibility work
                compounds when it points to a site that actually converts.
              </p>
              <p className="italic" style={{ marginTop: "20px" }}>
                If you already have a solid website and want to drive more traffic to it,
                book a call and we&rsquo;ll tell you honestly what your biggest opportunity is.
              </p>
            </div>
            <div className="included">
              <h4>This engagement is right for you if:</h4>
              <div>You already have a professional website (or are rebuilding with us)</div>
              <div>You serve a defined local service area</div>
              <div>You want to increase inbound leads from organic search</div>
              <div>You understand visibility is a 3–6 month compounding process</div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">6 Signal Visibility</div>
          <h2 className="display">
            Ready to show up<br />
            where buyers are looking?
          </h2>
          <p className="f-deck">
            Book a free 30-minute call. We&rsquo;ll audit your current visibility, identify
            your biggest gaps, and tell you exactly what we&rsquo;d do — and what it would cost.
          </p>
          <div className="f-cta">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              Book a Discovery Call
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
            <span>Secondary engagement</span>
            <span>Local SEO</span>
            <span>GBP optimization</span>
            <span>AI search</span>
          </div>
        </div>
      </section>

      <Footer />

      <div className="mobile-cta">
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer">
          Book a Call
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
