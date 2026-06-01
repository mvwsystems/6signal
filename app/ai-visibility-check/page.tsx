"use client";
import Link from "next/link";
import Nav from "../components/Nav";
import AuditPopupButton from "../components/AuditPopupButton";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

const SIGNALS = [
  {
    num: "01",
    name: "Search Signal",
    short: "Can people find you on Google?",
    body: "Your website, page structure, and content determine whether search engines surface you when buyers are actively looking for what you do.",
  },
  {
    num: "02",
    name: "AI Signal",
    short: "Can AI understand and recommend you?",
    body: "ChatGPT, Gemini, and Perplexity pull from structured, clear, authoritative sources. If your presence is vague or thin, AI skips over you.",
  },
  {
    num: "03",
    name: "Local Signal",
    short: "Are your location and service areas clear?",
    body: "Maps, local packs, and voice results depend on how well your location data is structured, verified, and consistent across every platform.",
  },
  {
    num: "04",
    name: "Trust Signal",
    short: "Do reviews and proof support your claims?",
    body: "AI and search algorithms weigh third-party proof. Generic, sparse, or inconsistent reviews drag your signal down and your competitors up.",
  },
  {
    num: "05",
    name: "Content Signal",
    short: "Do you answer the questions customers ask?",
    body: "The companies AI recommends have already answered the questions buyers ask before they call. Useful content is the signal AI reads first.",
  },
  {
    num: "06",
    name: "Conversion Signal",
    short: "Once people find you, do they call, book, or request a quote?",
    body: "Visibility without conversion is traffic without revenue. A weak conversion path amplifies every upstream signal problem you have.",
  },
];

const CHECKLIST_GROUPS = [
  {
    label: "Website Clarity",
    items: [
      "Can someone understand what you do within five seconds?",
      "Do you clearly state your services?",
      "Do you clearly state your service area?",
      "Do your headlines say something specific?",
      "Do you explain who you help and what problem you solve?",
    ],
  },
  {
    label: "Service Pages",
    items: [
      "Do you have a separate page for each major service?",
      "Does each page answer common customer questions?",
      "Does each page include location relevance?",
      "Does each page include proof, photos, or examples?",
      "Does each page have a clear call to action?",
    ],
  },
  {
    label: "AI & Search Readiness",
    items: [
      "Does your site have useful FAQs?",
      "Does your site use structured headings?",
      "Does your site include schema markup?",
      "Does your site load quickly?",
      "Is your business information consistent everywhere?",
      "Can AI easily summarize what your business does?",
    ],
  },
  {
    label: "Local Trust",
    items: [
      "Do you have recent reviews?",
      "Do your reviews mention specific services?",
      "Do your reviews mention your location or service area?",
      "Are you listed correctly in relevant directories?",
      "Do you have project photos or real proof of work?",
    ],
  },
  {
    label: "Content",
    items: [
      "Do you answer the questions customers ask before calling?",
      "Do you have comparison content?",
      "Do you explain pricing factors?",
      "Do you explain warning signs?",
      "Do you explain your process?",
      "Do you publish helpful local content?",
    ],
  },
  {
    label: "Conversion",
    items: [
      "Is your phone number easy to find?",
      "Is your quote form simple?",
      "Do you have strong calls to action?",
      "Does your website work well on mobile?",
      "Do you follow up quickly with leads?",
      "Do you have tracking in place?",
    ],
  },
];

const FIRST_MOVES = [
  {
    step: "01",
    title: "Clarify your homepage",
    body: "Make it unmistakably clear what you do, who you serve, where you serve them, and why customers should call you — not a competitor.",
  },
  {
    step: "02",
    title: "Build or improve your top service pages",
    body: "Each major service needs its own dedicated page with specific language, local relevance, proof, and a clear conversion path.",
  },
  {
    step: "03",
    title: "Strengthen your Google Business Profile",
    body: "Your GBP is one of the first things AI reads. Services, categories, photos, posts, and reviews must be complete, accurate, and current.",
  },
  {
    step: "04",
    title: "Add customer-question content",
    body: "Publish answers to the questions your customers ask before they call. This is what AI references when building a recommendation shortlist.",
  },
  {
    step: "05",
    title: "Make proof impossible to miss",
    body: "Recent reviews mentioning specific services, real project photos, and verifiable outcomes are the proof signals AI and customers both trust.",
  },
];

const ARROW = (
  <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M0 5h14M10 1l4 4-4 4" />
  </svg>
);

export default function AIVisibilityCheckPage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="wrap">
          <div className="lp-hero-inner">
            <div className="lp-hero-text">
              <div className="lp-eyebrow">
                <span className="lp-eyebrow-dot" />
                The AI Visibility Shift
              </div>
              <h1 className="lp-h1 reveal">
                Local businesses are losing leads<br />
                <em>before customers ever reach Google.</em>
              </h1>
              <p className="lp-hero-deck reveal">
                Customers are no longer just searching. They are asking ChatGPT, Google AI, Siri,
                Gemini, Perplexity, and voice assistants who to call. 6Signal shows whether your
                business gets found, skipped, or replaced by competitors.
              </p>
              <div className="lp-hero-ctas reveal">
                <AuditPopupButton className="btn btn-primary btn-lg">
                  Get the AI Visibility Brief {ARROW}
                </AuditPopupButton>
                <a href="#what-we-check" className="btn btn-ghost btn-lg">
                  See What We Check {ARROW}
                </a>
              </div>
              <p className="lp-micro reveal">
                Free visibility review · AI search · Maps · voice · reviews · directories
              </p>
            </div>

            <div className="lp-hero-visual" aria-hidden="true">
              <div className="lp-radar">
                <div className="lp-radar-ring lp-radar-ring--4" />
                <div className="lp-radar-ring lp-radar-ring--3" />
                <div className="lp-radar-ring lp-radar-ring--2" />
                <div className="lp-radar-ring lp-radar-ring--1" />
                <div className="lp-radar-scan" />
                <div className="lp-radar-center">
                  <svg width="30" height="20" viewBox="0 0 30 20" fill="none">
                    <polyline points="0,10 10,1 20,10" stroke="#E6FF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="10,10 20,1 30,10" stroke="#f5f5f3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="lp-radar-label lp-radar-label--tl">AI SEARCH</span>
                <span className="lp-radar-label lp-radar-label--tr">MAPS</span>
                <span className="lp-radar-label lp-radar-label--bl">VOICE</span>
                <span className="lp-radar-label lp-radar-label--br">REVIEWS</span>
              </div>
              <div className="lp-radar-tagline">
                GET FOUND · GET TRUSTED · GET CHOSEN
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ───────────────────────────────────────────── */}
      <section className="lp-section rule" id="what-we-check">
        <div className="wrap">
          <div className="lp-section-head reveal">
            <span className="lp-label">The Shift</span>
            <h2 className="lp-h2">
              Search used to send customers to options.<br />
              <em>AI sends them to conclusions.</em>
            </h2>
          </div>
          <div className="lp-two-col reveal">
            <div className="lp-col">
              <div className="lp-journey-label">The old customer journey</div>
              <div className="lp-journey">
                <div className="lp-journey-step">Google search</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step">Browse results + Maps</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step">Check reviews</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step">Visit website</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step lp-journey-step--final">Call and compare</div>
              </div>
            </div>
            <div className="lp-col">
              <div className="lp-journey-label lp-journey-label--new">The new customer journey</div>
              <div className="lp-journey">
                <div className="lp-journey-step">Ask ChatGPT, Siri, or Gemini</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step">AI reads + summarizes signals</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step">AI recommends 1–3 companies</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step lp-journey-step--final lp-journey-step--accent">Buyer calls one of them</div>
              </div>
            </div>
          </div>
          <blockquote className="lp-pull-quote reveal">
            Search used to send customers to options.<br />
            AI sends customers to conclusions.
          </blockquote>
        </div>
      </section>

      {/* ── STAKES ────────────────────────────────────────────── */}
      <section className="lp-section rule">
        <div className="wrap">
          <div className="lp-section-head reveal">
            <span className="lp-label">The Risk</span>
            <h2 className="lp-h2">
              You may not be losing leads because<br />
              <em>your service is worse.</em>
            </h2>
          </div>
          <p className="lp-section-deck reveal">
            You may be losing because AI does not understand why it should recommend you.
          </p>
          <ul className="lp-bullets reveal">
            <li>Your website may be too vague.</li>
            <li>Your service pages may be too thin.</li>
            <li>Your Google Business Profile may be incomplete.</li>
            <li>Your reviews may be generic.</li>
            <li>Your directories may be inconsistent.</li>
            <li>Your business may not answer customer questions online.</li>
            <li>Your competitors may be easier for AI to understand.</li>
          </ul>
          <div className="lp-cta-row reveal">
            <AuditPopupButton className="btn btn-primary btn-lg">
              Get the AI Visibility Brief {ARROW}
            </AuditPopupButton>
          </div>
        </div>
      </section>

      {/* ── AI REPEATS WINNERS ────────────────────────────────── */}
      <section className="lp-section rule lp-section--alt">
        <div className="wrap">
          <h2 className="lp-h2 lp-h2--wide reveal">
            AI repeats the companies it can understand,<br />
            <em>verify, and trust.</em>
          </h2>
          <p className="lp-body-center reveal">
            AI systems compress choices into shortlists and surface the same companies repeatedly.
            Businesses with stronger, clearer signals become easier to recommend. Businesses with
            weak or vague signals become easier to skip — and the gap compounds over time.
          </p>
          <div className="lp-compound-block reveal">
            The companies that are already clear become more visible.<br />
            The companies that are unclear become easier to skip.
          </div>
        </div>
      </section>

      {/* ── SIX SIGNALS ───────────────────────────────────────── */}
      <section className="lp-section rule">
        <div className="wrap">
          <div className="lp-section-head reveal">
            <span className="lp-label">The 6Signal System</span>
            <h2 className="lp-h2">
              Six signals decide whether you get<br />
              <em>found, trusted, and chosen.</em>
            </h2>
          </div>
          <div className="lp-signals-list">
            {SIGNALS.map((s) => (
              <div className="lp-signal-row reveal" key={s.num}>
                <div className="lp-signal-meta">
                  <span className="lp-signal-num">{s.num}</span>
                  <span className="lp-signal-name">{s.name}</span>
                </div>
                <div className="lp-signal-body">
                  <p className="lp-signal-short">{s.short}</p>
                  <p className="lp-signal-detail">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-cta-row reveal">
            <AuditPopupButton className="btn btn-primary btn-lg">
              Get the AI Visibility Brief {ARROW}
            </AuditPopupButton>
          </div>
        </div>
      </section>

      {/* ── CHECKLIST ─────────────────────────────────────────── */}
      <section className="lp-section rule">
        <div className="wrap">
          <div className="lp-section-head reveal">
            <span className="lp-label">The Check</span>
            <h2 className="lp-h2">The AI Visibility Checklist</h2>
          </div>
          <div className="lp-checklist-grid reveal">
            {CHECKLIST_GROUPS.map((group) => (
              <div className="lp-check-group" key={group.label}>
                <div className="lp-check-group-label">{group.label}</div>
                <ul className="lp-check-list">
                  {group.items.map((item) => (
                    <li className="lp-check-item" key={item}>
                      <span className="lp-check-box" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="lp-checklist-conclusion reveal">
            If you answered "no" to several of these, you probably do not have a traffic problem.
            You have a signal problem.
          </p>
        </div>
      </section>

      {/* ── FIRST MOVES ───────────────────────────────────────── */}
      <section className="lp-section rule">
        <div className="wrap">
          <div className="lp-section-head reveal">
            <span className="lp-label">The First Moves</span>
            <h2 className="lp-h2">
              Do not fix everything.<br />
              <em>Fix the signals that matter first.</em>
            </h2>
          </div>
          <div className="lp-steps">
            {FIRST_MOVES.map((move) => (
              <div className="lp-step reveal" key={move.step}>
                <div className="lp-step-num">{move.step}</div>
                <div className="lp-step-content">
                  <div className="lp-step-title">{move.title}</div>
                  <p className="lp-step-detail">{move.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUTHORITY ─────────────────────────────────────────── */}
      <section className="lp-section rule lp-section--alt">
        <div className="wrap">
          <h2 className="lp-h2 lp-h2--wide reveal">
            The businesses that win next will have<br />
            <em>the clearest signals.</em>
          </h2>
          <p className="lp-body-center reveal">
            They will not simply have the biggest ad budget. They will have the clearest message,
            strongest proof, best-structured presence, most useful answers, consistent reputation,
            and clearest conversion path.
          </p>
          <div className="lp-compound-block reveal">
            In the old world, being online was enough.<br />
            In the new world, being understood is the advantage.
          </div>
        </div>
      </section>

      {/* ── FINAL WARNING ─────────────────────────────────────── */}
      <section className="lp-section rule">
        <div className="wrap">
          <div className="lp-section-head reveal">
            <span className="lp-label lp-label--accent">Final Warning</span>
            <h2 className="lp-h2">
              Most owners will ignore this<br />
              <em>until the phone slows down.</em>
            </h2>
          </div>
          <div className="lp-warning-lines reveal">
            <p>They will blame the economy.</p>
            <p>They will blame ads.</p>
            <p>They will blame customers.</p>
            <p>Then they will scramble.</p>
          </div>
          <p className="lp-warning-close reveal">
            But the smart ones will fix the signal now.
          </p>
          <div className="lp-cta-row reveal">
            <AuditPopupButton className="btn btn-primary btn-lg">
              Get the AI Visibility Brief {ARROW}
            </AuditPopupButton>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="lp-final-section">
        <div className="wrap">
          <div className="lp-final-inner">
            <div className="lp-eyebrow lp-eyebrow--center">
              <span className="lp-eyebrow-dot" />
              Visibility Audit
            </div>
            <h2 className="lp-final-h2 reveal">
              Want to know if your business<br />
              <em>is part of the answer?</em>
            </h2>
            <p className="lp-final-deck reveal">
              6Signal reviews your current visibility across Google, AI search, voice search,
              Maps, reviews, directories, and your website — then shows you where your signal
              is strong, where it is weak, and what to fix first.
            </p>
            <div className="lp-final-cta-wrap reveal">
              <AuditPopupButton className="btn btn-primary btn-xl">
                Get the AI Visibility Brief {ARROW}
              </AuditPopupButton>
            </div>
            <p className="lp-final-micro reveal">
              Thirty-minute readout · Priority list yours to keep · Built for local service businesses and contractors
            </p>
          </div>
        </div>
      </section>

      {/* ── MINIMAL FOOTER ────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="wrap">
          <div className="lp-footer-inner">
            <Link href="/" aria-label="6Signal — return to main site">
              <img src="/6SIG_LOGO_FINAL_2.webp" alt="6Signal" className="lp-footer-logo" />
            </Link>
            <nav className="lp-footer-links" aria-label="Footer">
              <Link href="/" className="lp-footer-link">6signal.co</Link>
              <Link href="/contact" className="lp-footer-link">Contact</Link>
            </nav>
            <span className="lp-footer-copy">© 6Signal · All rights reserved</span>
          </div>
        </div>
      </footer>

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
