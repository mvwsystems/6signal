"use client";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import AuditPopupButton from "../components/AuditPopupButton";
import Link from "next/link";

// The Climb — the four-rung practice map. Every rung: a build fee and a run
// fee. Scale is the front door (the visibility funnel); Stabilize and
// Systemize are entered through the qualified team training -> paid scoping
// path. Segment/Sell rungs were deliberately dropped (out of competence).
const rungs = [
  {
    num: "01",
    title: "Start",
    tag: "Foundation",
    pos: "For contractors whose website and brand are underselling the company — making them harder to trust, understand, or contact.",
    lead: "A credible foundation: brand, website, and the structure machines and buyers both read.",
    items: [
      "Contractor website rebuild — $1,500 flat, copy written for you",
      "Brand and media kit",
      "Visibility-ready site structure and schema",
      "Conversion copy and service page architecture",
      "Website Care Plan — $97/month to keep it live and current",
    ],
    ctaLabel: "See the rebuild →",
    ctaHref: "/websites",
  },
  {
    num: "02",
    title: "Stabilize",
    tag: "Front office",
    pos: "For contractors losing opportunities between the ring and the booked job — missed calls, slow follow-up, unsorted inboxes.",
    lead: "Front-end AI systems that answer, book, sort, and follow up — so the phone your visibility rings actually converts.",
    items: [
      "AI receptionist and voice agents",
      "Missed-call text-back and booking flows",
      "Email sorting and drafted responses",
      "Lead routing, qualification, and follow-up sequences",
      "CRM pipeline setup",
    ],
    ctaLabel: "See Stabilize →",
    ctaHref: "/stabilize",
  },
  {
    num: "03",
    title: "Scale",
    tag: "Growth",
    pos: "For contractors who need more of the right buyers to find, verify, and choose them.",
    lead: "Visibility-led growth: the six-signal system across AI, Maps, answer engines, and voice — with SEO and paid ads as amplifiers, not the strategy.",
    items: [
      "The six-signal visibility system — GEO, AEO, LEO, VEO, PEO, IEO",
      "Google Business Profile and local entity work",
      "Review and trust engine",
      "SEO and paid ads as amplifiers inside the system",
      "Monthly signal tracking and reporting",
    ],
    ctaLabel: "Start with the $27 audit →",
    ctaHref: "/visibility-check",
  },
  {
    num: "04",
    title: "Systemize",
    tag: "Internal ops",
    pos: "For contractors whose back office is consuming the margin the front office earns — manual bookkeeping, scattered fleet and field communication, estimating bottlenecks.",
    lead: "AI infrastructure for the operation itself — built custom, integrated with the tools you already run.",
    items: [
      "Bookkeeping and back-office automation",
      "Field-to-office communication systems",
      "Fleet and job tracking dashboards",
      "Estimating and bid support systems",
      "Internal knowledge assistants on your own data",
    ],
    ctaLabel: "See Systemize →",
    ctaHref: "/systemize",
  },
];

export default function CapabilitiesPage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">The Climb</span>
            <h1 className="display reveal">
              One practice.<br />
              <em>Four rungs.</em>
            </h1>
            <p className="hero-deck reveal">
              Every contractor business is somewhere on the same climb: get credible,
              stop losing what you earn, get found, then run the operation on systems
              instead of willpower. 6 Signal works all four rungs — one operator,
              hands-on, a limited number of engagements at a time.
            </p>
          </div>
        </div>
      </header>

      {/* FRAMING — the positioning statement */}
      <section className="svc-framing rule">
        <div className="wrap">
          <div className="svc-framing-inner reveal">
            <span className="idx">Not an agency</span>
            <p className="svc-framing-text">
              <strong>6 Signal is not an agency.</strong> It&rsquo;s a specialized practice
              run by one operator. No account managers, no sales reps, no junior team
              learning on your business — the person you talk to is the person who does
              the work, at every rung. One contractor per trade, per market. Every rung
              has a build fee and a run fee, priced for the work — not for a pitch deck.
            </p>
          </div>
        </div>
      </section>

      {/* THE RUNGS */}
      <section className="svc-buckets rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">The practice map</span>
              <h2 className="display">
                Start. Stabilize.<br /><em>Scale. Systemize.</em>
              </h2>
            </div>
            <div className="right">
              The rungs are sequential for a reason — visibility wasted on a weak
              foundation leaks, and automation built on a chaotic operation automates
              the chaos. We meet you at your rung and climb from there.
            </div>
          </div>
          <div className="svc-list">
            {rungs.map((b) => (
              <div className="svc-row reveal" key={b.num}>
                <div className="svc-num">{b.num}</div>
                <div className="svc-title-col">
                  <div className="svc-title">{b.title}</div>
                  <span className="idx svc-tag">{b.tag}</span>
                </div>
                <div className="svc-body">
                  <p className="svc-pos">{b.pos}</p>
                  <p className="svc-lead">{b.lead}</p>
                  <ul className="svc-items">
                    {b.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p style={{ marginTop: "18px" }}>
                    <Link href={b.ctaHref} className="idx" style={{ color: "#E6FF00", textDecoration: "none" }}>
                      {b.ctaLabel}
                    </Link>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRAINING — the door-opener */}
      <section className="svc-framing rule">
        <div className="wrap">
          <div className="svc-framing-inner reveal">
            <span className="idx">For teams · by invitation</span>
            <p className="svc-framing-text">
              <strong>The AI team training.</strong> For established contractors — existing
              clients, referrals, and businesses at roughly $1M+ revenue — we run a free,
              on-site AI training for your team: what AI changes for your trade, what it
              doesn&rsquo;t, and what&rsquo;s worth automating first. No charge, no pitch
              during the session. If there&rsquo;s a fit for Stabilize or Systemize work,
              the conversation continues from there.{" "}
              <a
                href="/inquire?about=training"
                style={{ color: "#f5f5f3", textDecoration: "underline" }}
              >
                Request the training
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* LABS */}
      <section className="labs-section rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">R&amp;D</span>
              <h2 className="display">
                6 Signal<br /><em>Labs.</em>
              </h2>
            </div>
            <div className="right">
              Experimental tools and beta products being built for contractors with
              complex estimating, bidding, and operational problems.
            </div>
          </div>
          <div className="lab-cards reveal">
            <div className="lab-card">
              <div className="lab-card-head">
                <span className="idx lab-tag">Beta · Active</span>
                <h3 className="lab-name">Takeoff Copilot</h3>
                <p className="lab-url">
                  <a
                    href="https://TakeoffCopilot.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    TakeoffCopilot.com ↗
                  </a>
                </p>
              </div>
              <p className="lab-body">
                AI-assisted takeoff workflow for utility contractors. Built to help
                contractors analyze plans faster, flag uncertainty, and support better
                bid decisions — not to replace the estimator, but to reduce the manual
                load and compress the time between plan receipt and bid submission.
              </p>
              <p className="lab-status">Currently in beta testing with contractors.</p>
            </div>
            <div className="lab-card">
              <div className="lab-card-head">
                <span className="idx lab-tag">In development</span>
                <h3 className="lab-name">BidCore</h3>
              </div>
              <p className="lab-body">
                The larger bid intelligence model being built around takeoff, plan
                analysis, estimating support, bid/no-bid thinking, and contractor
                decision-making. Still being developed as the broader system behind
                contractor bid intelligence.
              </p>
              <p className="lab-status">Not yet available. Being built.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FIT */}
      <section className="fit-section rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">Right fit</span>
              <h2 className="display">
                When the climb<br /><em>makes sense.</em>
              </h2>
            </div>
            <div className="right">
              These are the conditions where the work goes well and the results compound.
            </div>
          </div>
          <div className="fit-grid reveal">
            <div className="fit-col yes">
              <div className="f-label">
                <span className="sym">+</span> Good fit
              </div>
              <ul>
                <li>You already ran the $27 audit — or you&rsquo;re ready to.</li>
                <li>Your gaps point to a deeper foundation or operations problem.</li>
                <li>You need implementation, not just advice.</li>
                <li>You want AI and automation tied to revenue, response time, or operational leverage.</li>
                <li>You want a connected system — not disconnected tactics.</li>
              </ul>
            </div>
            <div className="fit-col no">
              <div className="f-label">
                <span className="sym">—</span> Not the right fit
              </div>
              <ul>
                <li>You want the cheapest possible website.</li>
                <li>You want guaranteed rankings.</li>
                <li>You want AI added for novelty.</li>
                <li>You are not willing to provide access, photos, reviews, service details, or team context.</li>
                <li>You want disconnected tactics instead of a system.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="svc-cta-section rule">
        <div className="wrap">
          <div className="svc-cta-inner reveal">
            <span className="idx svc-cta-eyebrow">First step — whatever your rung</span>
            <h2 className="display svc-cta-h2">
              Start with the<br /><em>$27 audit.</em>
            </h2>
            <p className="svc-cta-deck">
              The audit shows what is actually broken first — visibility, trust,
              follow-up, website structure, local data, or operations. Then we decide
              which rung is worth climbing, and in what order.
            </p>
            <div className="svc-cta-btns">
              <AuditPopupButton className="btn btn-primary btn-lg">
                Get the AI Visibility Audit
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </AuditPopupButton>
              <Link href="/method" className="btn btn-ghost btn-lg">
                Explore the Method
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <div className="mobile-cta">
        <AuditPopupButton>
          Get the audit
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
