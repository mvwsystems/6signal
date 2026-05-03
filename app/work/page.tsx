"use client";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

const CALENDLY = "https://calendly.com/mvw-mattvincentwalker/business-growth-audit";

const workCards = [
  {
    trade: "Roofing",
    title: "Storm Damage Roofing Co.",
    body: "Full website rebuild. New copy, before-and-after proof gallery, insurance claim CTA, and mobile-first layout optimized for homeowners searching after a storm.",
    status: "Case study coming soon",
  },
  {
    trade: "Plumbing",
    title: "Emergency Plumbing Contractor",
    body: "Replaced an outdated Wix site. 24/7 emergency call CTA above the fold, service area pages, and clear trust signals that convert after-hours searchers.",
    status: "Case study coming soon",
  },
  {
    trade: "HVAC",
    title: "Residential HVAC Operator",
    body: "Full rebuild and brand refresh. Seasonal landing pages, financing mention, service area pages for 12 cities, and a quote form that cut contact friction significantly.",
    status: "Case study coming soon",
  },
  {
    trade: "Landscaping",
    title: "Commercial Landscaping Company",
    body: "Portfolio-first design with project photos, commercial client logos, and a clear commercial vs. residential split. Built to win RFPs, not just homeowners.",
    status: "Case study coming soon",
  },
  {
    trade: "Electrical",
    title: "Licensed Electrical Contractor",
    body: "Clean, professional rebuild for a licensed electrician. Licensing proof front and center, residential and commercial service split, clear safety and credentials language.",
    status: "Case study coming soon",
  },
  {
    trade: "General Contractor",
    title: "Full-Service GC",
    body: "Complete rebuild for a GC doing $2M+ per year. Project gallery, subcontractor network mentions, detailed service scope pages, and a commercial bid inquiry form.",
    status: "Case study coming soon",
  },
];

export default function WorkPage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* INNER HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">Recent Work</span>
            <h1 className="display reveal">
              Contractor websites<br />
              <em>built to earn trust.</em>
            </h1>
            <p className="hero-deck reveal">
              Placeholder cards below — full before-and-after case studies are coming soon
              as clients give approval. Each rebuild is custom — no templates, no off-the-shelf
              layouts. Every card represents a real engagement.
            </p>
          </div>
        </div>
      </header>

      {/* WORK GRID */}
      <section className="work-section rule">
        <div className="wrap">
          <div className="work-grid reveal">
            {workCards.map((card, i) => (
              <div key={i} className="work-card">
                <div className="work-card-trade">{card.trade}</div>
                <div className="work-card-title">{card.title}</div>
                <p className="work-card-body">{card.body}</p>
                <div className="work-card-status">{card.status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOTE */}
      <section className="rule" style={{ padding: "80px 0 100px" }}>
        <div className="wrap">
          <div className="pricing-detail reveal">
            <div className="pricing-note">
              <p>
                <span className="highlight">Case studies take time to do right.</span>{" "}
                We document before-and-after with real before screenshots, copy comparisons,
                and whatever data the client is willing to share. We&rsquo;re not going to
                publish a vanity slide deck.
              </p>
              <p className="italic" style={{ marginTop: "20px" }}>
                If you want to see live examples, book a call and we&rsquo;ll pull up current
                client sites on screen and walk you through exactly what changed and why.
              </p>
            </div>
            <div className="included">
              <h4>Trades we&rsquo;ve built for:</h4>
              <div>Roofing — storm damage, commercial, residential</div>
              <div>Plumbing — emergency, residential, commercial</div>
              <div>HVAC — residential, light commercial</div>
              <div>Electrical — licensed residential and commercial</div>
              <div>Landscaping — residential and commercial</div>
              <div>General Contracting — full-service and specialty</div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Get My Website Rebuilt</div>
          <h2 className="display">
            Your company should<br />
            look this good too.
          </h2>
          <p className="f-deck">
            Book a free 30-minute call. We&rsquo;ll look at your current site and tell
            you exactly what we&rsquo;d change and why. No pitch, no pressure.
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
