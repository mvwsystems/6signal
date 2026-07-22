"use client";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import AuditPopupButton from "../components/AuditPopupButton";
import Link from "next/link";

const buckets = [
  {
    num: "01",
    title: "Build",
    tag: "Foundation",
    pos: "For contractors whose website, landing page, or digital foundation is making the company harder to trust, understand, or contact.",
    lead: "Visibility-ready websites for contractors whose current site is holding the signal back.",
    items: [
      "AI-built contractor websites",
      "Landing pages optimized for conversion",
      "Visibility-ready site structure and schema",
      "Conversion copy and service page architecture",
      "Basic tracking and analytics setup",
    ],
  },
  {
    num: "02",
    title: "Grow",
    tag: "Demand",
    pos: "For contractors who need more of the right buyers to find, verify, and choose them.",
    lead: "Organic and AI visibility compounds over time. Paid demand accelerates it when the timeline requires.",
    items: [
      "AI visibility / GEO / SEO implementation",
      "Google Business Profile optimization",
      "Review and trust engine",
      "Paid ads and lead generation",
      "Local search and service-area visibility",
    ],
  },
  {
    num: "03",
    title: "Capture",
    tag: "Response",
    pos: "For contractors who are getting interest but losing opportunities through missed calls, slow response, weak routing, or poor follow-up.",
    lead: "The lead already found you. These systems make sure you actually capture it.",
    items: [
      "Missed-call text-back",
      "AI receptionist",
      "Lead routing and qualification",
      "Form follow-up sequences",
      "CRM pipeline setup",
    ],
  },
  {
    num: "04",
    title: "Automate",
    tag: "Operations",
    pos: "For contractors whose admin, communication, reporting, or internal workflows are consuming too much owner and team time.",
    lead: "Reclaim owner time through systems that run without constant intervention.",
    items: [
      "AI follow-up and nurture systems",
      "Email triage and inbox management",
      "Operations and dispatch workflows",
      "Reporting dashboards",
      "RAG and internal knowledge assistants",
    ],
  },
  {
    num: "05",
    title: "Advise",
    tag: "Strategy",
    pos: "For contractor owners who want strategic help deciding where AI, automation, marketing, and systems should actually fit in the business.",
    lead: "Not a deck. A working session with someone who has actually built these systems for contractors.",
    items: [
      "AI strategy for contractor businesses",
      "Owner-level advisory engagements",
      "AI workshops and team training",
      "Systems consulting",
      "Custom implementation planning",
    ],
  },
];

export default function ServicesPage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">Services</span>
            <h1 className="display reveal">
              More ways 6 Signal helps<br />
              <em>contractors get found,<br />booked, and systemized.</em>
            </h1>
            <p className="hero-deck reveal">
              AI and search visibility is the front door. These are the supporting services
              we use when a contractor needs the foundation built, the demand captured,
              the follow-up automated, or the operation tightened.
            </p>
          </div>
        </div>
      </header>

      {/* FRAMING */}
      <section className="svc-framing rule">
        <div className="wrap">
          <div className="svc-framing-inner reveal">
            <span className="idx">The approach</span>
            <p className="svc-framing-text">
              6 Signal is intentionally focused: <strong>visibility first.</strong> But
              visibility often exposes deeper gaps — weak websites, missed calls, poor
              follow-up, scattered tools, or manual operations. When that happens, these
              are the systems we can build or coordinate.
            </p>
          </div>
        </div>
      </section>

      {/* SERVICE BUCKETS */}
      <section className="svc-buckets rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">What we build</span>
              <h2 className="display">
                Five service<br /><em>systems.</em>
              </h2>
            </div>
            <div className="right">
              Each bucket addresses a different layer of the contractor growth problem.
              They can be engaged separately or coordinated as a connected system.
            </div>
          </div>
          <div className="svc-list">
            {buckets.map((b) => (
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
                </div>
              </div>
            ))}
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
                When these services<br /><em>make sense.</em>
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
                <li>You already booked or completed a Visibility Audit.</li>
                <li>Your visibility gaps point to a deeper foundation problem.</li>
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
            <span className="idx svc-cta-eyebrow">First step</span>
            <h2 className="display svc-cta-h2">
              Start with the<br /><em>Visibility Audit.</em>
            </h2>
            <p className="svc-cta-deck">
              The audit shows what is actually broken first — visibility, trust,
              follow-up, website structure, local data, or operations. Then we decide
              which system is worth building.
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
