"use client";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

const CALENDLY = "https://calendly.com/mvw-mattvincentwalker/business-growth-audit";

const included = [
  "Custom contractor website designed for your company and trade",
  "Copy written for you — no templates, no Lorem Ipsum",
  "Mobile-first design that works on any device, fast",
  "Homepage, service pages, about page, and contact page",
  "Review and project proof sections baked into the layout",
  "Clear click-to-call and quote request CTAs throughout",
  "Basic on-page SEO structure (titles, meta, headers, schema)",
  "Clean, fast-loading code — no bloated page builders",
  "Launch support included — we get it live",
];

const faqs = [
  {
    q: "How long does a rebuild take?",
    a: "Most websites are live within 2–3 weeks from kickoff. The biggest factor is how quickly you can share your content — photos, service list, service area, any existing copy you like. The faster you respond, the faster we build.",
  },
  {
    q: "Do I have to write the copy myself?",
    a: "No. We write your website copy for you based on a short intake call and any existing material you share. You review it, request adjustments, and we finalize. Writing is included in the $1,500.",
  },
  {
    q: "What if I already have a website?",
    a: "We start from scratch. We look at your current site to understand what's working, but we build a clean new site rather than patching what you have. You'll keep your domain and we handle the transition.",
  },
  {
    q: "What pages are included?",
    a: "Every rebuild includes a homepage, service pages (one per core service), an about page, and a contact page. If you need additional pages — service area pages, a project gallery page — we'll scope those out. Most contractors don't need more than the core set to start.",
  },
  {
    q: "Do you handle hosting?",
    a: "Yes — the Website Care Plan ($97/month) covers hosting, uptime monitoring, and ongoing support. It's optional but strongly recommended so you're not dealing with hosting on your own.",
  },
  {
    q: "My website is old. Is that a problem?",
    a: "Not at all. We rebuild from scratch and transfer your domain. We do fully SEO- and GEO-optimized rebuilds only if it is absolutely necessary. The goal is a credible, fast, clear site — not a complex software project.",
  },
];

export default function WebsitesPage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* INNER HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">Contractor Website Rebuild</span>
            <h1 className="display reveal">
              A professional website<br />
              <em>your company actually deserves.</em>
            </h1>
            <p className="hero-deck reveal">
              $1,500 flat. Copy written for you. Built for contractors who want to look as
              good online as they do in the field — without the agency overhead or the
              six-month timeline.
            </p>
            <div className="hero-cta-row reveal">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                Get My Website Rebuilt
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
              <Link href="/contact" className="btn btn-ghost btn-lg">Ask a Question</Link>
            </div>
          </div>
        </div>
      </header>

      {/* WHAT'S INCLUDED */}
      <section className="pricing-section rule" id="included">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">What&rsquo;s included</span>
              <h2 className="display">
                One price.<br />
                <em>Everything in it.</em>
              </h2>
            </div>
            <div className="right">
              No hourly rate. No surprise add-ons. No extra charge for writing your copy, building
              more than one page, or doing revisions within scope. The price is $1,500 and it
              covers the whole job.
            </div>
          </div>

          <div className="pricing-core reveal">
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
            </div>
            <div className="p-guarantee">Fast turnaround · Mobile-first · Copy written for you</div>
          </div>

          <div className="pricing-detail reveal">
            <div className="pricing-note">
              <p>
                <span className="highlight">Everything listed below is included in the $1,500.</span>{" "}
                We don&rsquo;t charge extra for pages, copy, revisions within scope, or launch
                support. What you see is what you get.
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

      {/* PROCESS */}
      <section className="rule" style={{ paddingBottom: "100px" }}>
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="left">
              <span className="idx">How it works</span>
              <h2 className="display">
                Three steps.<br />
                <em>Done in days, not months.</em>
              </h2>
            </div>
            <div className="right">
              No 12-week agency timelines. No endless revision loops. A clear process from call
              to launch — you stay in control without managing a project.
            </div>
          </div>
          <div className="process-steps reveal">
            <div className="process-step">
              <span className="process-step-num">Step 01</span>
              <h3>Discovery Call</h3>
              <p>
                We spend 30 minutes understanding your company — what you do, who you serve,
                what you want people to do when they hit your site, and what you hate about
                your current one. That&rsquo;s all we need to start.
              </p>
            </div>
            <div className="process-step">
              <span className="process-step-num">Step 02</span>
              <h3>Build &amp; Review</h3>
              <p>
                We write your copy and build the site. You get a preview link to review before
                anything goes live. We take your feedback and finalize. Typically one round of
                revisions is all it takes.
              </p>
            </div>
            <div className="process-step">
              <span className="process-step-num">Step 03</span>
              <h3>Launch</h3>
              <p>
                We push the site live on your domain. If you&rsquo;re on the care plan, hosting
                is handled. If not, we point you to a simple hosting setup. Either way, you&rsquo;re
                live and looking good.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="page-faq rule">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="left">
              <span className="idx">Common questions</span>
              <h2 className="display">
                Straight answers.<br />
                <em>No runaround.</em>
              </h2>
            </div>
            <div className="right">
              If you have a question that&rsquo;s not here, email us directly or book a call —
              we&rsquo;ll give you a straight answer.
            </div>
          </div>
          <div className="faq-list reveal">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q">
                  <span className="q-idx">0{i + 1}</span>
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
          <div className="f-eyebrow">Get My Website Rebuilt</div>
          <h2 className="display">
            Stop letting your website<br />
            undersell your work.
          </h2>
          <p className="f-deck">
            Book a free 30-minute call. We&rsquo;ll look at your current site, tell you exactly
            what needs to change, and give you a straight answer on whether we&rsquo;re the right
            fit. No pitch. No pressure.
          </p>
          <div className="f-cta">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              Book a Free Call
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
