import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import AuditPopupButton from "../components/AuditPopupButton";

const BASE = "https://6signal.co";

export const metadata: Metadata = {
  title: "The Operator — Matt Vincent Walker | 6 Signal",
  description:
    "6 Signal is not an agency. It is a specialized practice run by one operator — the person you talk to is the person who does the work. Who that person is, how the practice runs, and the rules it runs on.",
  openGraph: {
    title: "The Operator — Matt Vincent Walker | 6 Signal",
    description:
      "6 Signal is a specialized practice run by one operator. Who that person is, how the practice runs, and the rules it runs on.",
    type: "profile",
    url: `${BASE}/operator`,
    images: [{ url: "/6SIG_SOCIAL_SHARE.png", width: 1200, height: 630, alt: "6 Signal" }],
  },
  twitter: { card: "summary_large_image", images: ["/6SIG_SOCIAL_SHARE.png"] },
  alternates: { canonical: `${BASE}/operator` },
};

const PROFILE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: `${BASE}/operator`,
  mainEntity: {
    "@type": "Person",
    name: "Matt Vincent Walker",
    url: "https://mattvincentwalker.com",
    jobTitle: "Founder & Operator",
    worksFor: { "@type": "Organization", name: "6 Signal", url: BASE },
    knowsAbout: [
      "AI visibility",
      "Answer Engine Optimization",
      "Generative Engine Optimization",
      "Local SEO for contractors",
      "AI infrastructure for construction companies",
    ],
    sameAs: [
      BASE,
      "https://www.linkedin.com/in/mattvincentwalker",
      "https://www.youtube.com/@mattvincentwalker",
    ],
  },
};

export default function OperatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PROFILE_SCHEMA) }}
      />
      <Nav />

      <header className="op-hero">
        <div className="wrap">
          <div className="op-kicker">
            <span className="idx">The Operator</span>
          </div>
          <h1 className="display reveal">
            Matt Vincent
            <br />
            <em>Walker.</em>
          </h1>
          <p className="op-deck reveal">
            6 Signal is not an agency. It is a specialized practice run by one
            person. The person you talk to is the person who does the work — at
            every rung, on every account. This page is about that person, and
            the rules the practice runs on.
          </p>
        </div>
      </header>

      <section className="op-section rule">
        <div className="wrap">
          <div className="op-grid">
            <div className="op-label">
              <span className="idx">01 · The practice</span>
            </div>
            <div className="op-body">
              <p>
                6 Signal exists because of one shift: contractors&apos; buyers
                stopped only searching and started asking — ChatGPT, Gemini,
                Siri, Google&apos;s AI answers. Whether a company gets named in
                those answers is measurable, improvable, and mostly ignored.
                Making it visible is the core of this practice.
              </p>
              <p>
                The work is organized as{" "}
                <Link href="/capabilities">The Climb</Link> — four rungs. Start:
                brand and website. Stabilize: the front office — receptionist,
                booking, follow-up. Scale: visibility-led growth, where the{" "}
                <Link href="/method">six signals</Link> live. Systemize: AI
                infrastructure for internal operations. It is a progression,
                not a menu; most engagements begin with the{" "}
                <Link href="/visibility-check">$27 AI Visibility Audit</Link>{" "}
                and climb from there.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="op-section rule">
        <div className="wrap">
          <div className="op-grid">
            <div className="op-label">
              <span className="idx">02 · One operator</span>
            </div>
            <div className="op-body">
              <p>
                There is no account manager, no junior team, no hand-off after
                the sale. One operator, working from Dallas–Fort Worth, serving
                one contractor per market per trade — exclusivity is structural,
                because ranking two competing roofers in the same city is a
                conflict of interest with extra steps.
              </p>
              <p>
                The trade focus is deliberate: HVAC, plumbing, roofing,
                electrical, remodeling, and the other residential and commercial
                trades — companies whose buyers ask urgent, local,
                high-intent questions. The practice builds and runs its own
                systems too: the website builds on{" "}
                <Link href="/work">the work page</Link> are mine, and the AI
                receptionist patterns written about in the research library run
                on this practice&apos;s own phone line first.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="op-section rule">
        <div className="wrap">
          <div className="op-grid">
            <div className="op-label">
              <span className="idx">03 · The rules</span>
            </div>
            <div className="op-body">
              <ul className="op-rules">
                <li>
                  <strong>Measured claims only.</strong> Every number published
                  on this site is tracked, dated, and reproducible — the{" "}
                  <Link href="/work">X-Act Plumbing results</Link> come from
                  hundreds of logged probes, not memory. What was not measured
                  does not get claimed.
                </li>
                <li>
                  <strong>An answer without a source is a liability.</strong>{" "}
                  The standard applied to client AI systems and to this
                  site&apos;s own writing alike — the reasoning is in{" "}
                  <Link href="/research/an-answer-without-a-source-is-a-liability">
                    the research library
                  </Link>
                  .
                </li>
                <li>
                  <strong>AI prepares; humans decide.</strong> No system built
                  here approves payments, certifies compliance, or makes safety
                  judgments. Software does the preparation; accountable people
                  keep the authority.
                </li>
                <li>
                  <strong>The funnel is self-serve until it shouldn&apos;t
                  be.</strong> Research is free. The audit is $27. Nobody gets a
                  sales call disguised as a consultation.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="op-section rule">
        <div className="wrap">
          <div className="op-grid">
            <div className="op-label">
              <span className="idx">04 · The writing</span>
            </div>
            <div className="op-body">
              <p>
                The <Link href="/research">research library</Link> carries two
                tracks, both written by me under this byline. The visibility
                track covers how contractors get named by AI engines. The
                operations track — anchored by{" "}
                <Link href="/research/intelligent-contractor">
                  The Intelligent Contractor series
                </Link>{" "}
                — covers what AI should and should not do inside a construction
                company. Elsewhere:{" "}
                <a
                  href="https://www.linkedin.com/in/mattvincentwalker"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>{" "}
                and{" "}
                <a
                  href="https://www.youtube.com/@mattvincentwalker"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YouTube
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="blog-cta-section rule">
        <div className="wrap">
          <div className="blog-cta-inner reveal">
            <span className="idx blog-cta-eyebrow">Work with the operator</span>
            <h2 className="display blog-cta-h2">
              Start where every
              <br />
              <em>engagement starts.</em>
            </h2>
            <p className="blog-cta-deck">
              The AI Visibility Audit runs your company through all six layers.
              Instant. $27. Yours to keep — and the person who built it is the
              person you just read about.
            </p>
            <AuditPopupButton className="btn btn-primary btn-lg">
              Get the AI Visibility Audit
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
        </div>
      </section>

      <Footer />
    </>
  );
}
