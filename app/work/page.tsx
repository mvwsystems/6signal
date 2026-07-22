"use client";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import AuditExampleCard from "../components/proof/AuditExampleCard";
import { AUDIT_EXAMPLES } from "../proof-data";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import AuditPopupButton from "../components/AuditPopupButton";

export default function WorkPage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">Client work &amp; proof</span>
            <h1 className="display reveal">
              What the work<br />
              <em>actually looks like.</em>
            </h1>
            <p className="hero-deck reveal">
              6 Signal is a new practice. Audits are running. Retainers are active.
              This page documents the methodology — what the audit finds across different
              trades, and what gets built over a retainer engagement. Client-specific
              outcomes and testimonials are being documented and published as they develop,
              with permission.
            </p>
            <div className="hero-sig reveal">
              No invented results · No fabricated testimonials · No unnamed case studies with estimated numbers
            </div>
          </div>
        </div>
      </header>

      {/* AUDIT FORMAT EXAMPLES */}
      <section className="proof-section rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">What the audit finds</span>
              <h2 className="display">
                Six trades.<br />
                <em>Six common gaps.</em>
              </h2>
            </div>
            <div className="right">
              These are illustrative format examples — the types of visibility gaps that
              surface in a live audit read across different trades and search layers.
              They show the structure and depth of the finding, not data from a specific client.
              Real findings will be documented and published as audits are completed and
              clients grant permission.
            </div>
          </div>
          <div className="proof-grid">
            {AUDIT_EXAMPLES.map((a) => (
              <AuditExampleCard key={a.id} a={a} />
            ))}
          </div>
        </div>
      </section>

      {/* WHAT A RETAINER BUILDS — LAYER BY LAYER */}
      <section className="rule" style={{ paddingBottom: "100px" }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">What the retainer builds</span>
              <h2 className="display">
                Six layers.<br />
                <em>Every month.</em>
              </h2>
            </div>
            <div className="right">
              The retainer works all six visibility layers continuously. Here is what
              that work looks like across a 90-day engagement — what gets built,
              what gets fixed, what gets documented.
            </div>
          </div>
          <div className="process-steps" style={{ marginTop: "64px" }}>
            <div className="process-step">
              <span className="process-step-num">Month 01</span>
              <h3>Audit &amp; cleanup</h3>
              <p>Full six-layer read. Entity cleanup across Maps, directories, and listings. Schema and structured data built out. Baseline signal screenshots documented.</p>
            </div>
            <div className="process-step">
              <span className="process-step-num">Month 02</span>
              <h3>AI &amp; prompt work</h3>
              <p>GEO and PEO work — building the associations that get your name into AI recommendations. Answer-ready content structure. Voice optimization. Priority fix list executed.</p>
            </div>
            <div className="process-step">
              <span className="process-step-num">Month 03</span>
              <h3>Compound &amp; expand</h3>
              <p>Signal review against month-one baseline. Adjustments based on what moved. Roadmap updated. 90-day summary sent. Retainer continues or closes — your call.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CLIENT TESTIMONIALS — being collected */}
      <section className="rule" style={{ paddingBottom: "100px" }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">Client testimonials</span>
              <h2 className="display">
                Collecting.<br />
                <em>Carefully.</em>
              </h2>
            </div>
            <div className="right">
              Testimonials are being collected from active clients after their first
              30-day check-in. We ask two specific questions — not a generic
              &ldquo;would you recommend&rdquo; prompt. Published only with
              written permission.
            </div>
          </div>
          <div className="coming-card" style={{ marginTop: "56px" }}>
            <span className="coming-label">What we ask clients</span>
            <div className="coming-headline">Two questions. Specific answers.</div>
            <div className="coming-body">
              We ask every retainer client the same two questions after the first 30 days:
              what surprised you in the audit, and what have you noticed change in the
              first 60 days. We're not looking for endorsements — we're documenting
              specific observations that other contractors can evaluate.
            </div>
            <div className="coming-asks">
              <div className="coming-ask">What surprised you most in the audit — what did you find that you didn&rsquo;t expect?</div>
              <div className="coming-ask">What specifically has changed in the first 60 days, in terms of what you&rsquo;ve noticed?</div>
              <div className="coming-ask">Is there anything you&rsquo;d want another contractor to know before booking their own audit?</div>
            </div>
            <div className="coming-meta">
              If you&rsquo;d like to speak with someone who&rsquo;s been through the process,
              email hello@6signal.co and we&rsquo;ll facilitate the introduction.
            </div>
          </div>
        </div>
      </section>

      {/* CASE STUDIES — in progress */}
      <section className="rule" style={{ paddingBottom: "100px" }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">Case studies</span>
              <h2 className="display">
                In progress.<br />
                <em>Requires 90 days.</em>
              </h2>
            </div>
            <div className="right">
              A case study requires 90 days of retainer work to document honestly.
              We document: starting position from the audit, specific work completed
              in each of the six layers, and measurable outcomes the client can verify
              directly — not extrapolated or assumed.
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", marginTop: "56px" }}>
            <div className="coming-card">
              <span className="coming-label">What a case study will contain</span>
              <div className="coming-headline">Starting position</div>
              <div className="coming-body">
                The exact audit findings before any retainer work began — what AI tools
                said about the company, where it appeared and didn&rsquo;t, which
                competitors were ahead and in which layers.
              </div>
            </div>
            <div className="coming-card">
              <span className="coming-label">What a case study will contain</span>
              <div className="coming-headline">Work completed</div>
              <div className="coming-body">
                Specific tasks completed in each of the six layers across the first
                90 days. Not a generic &ldquo;we improved their SEO&rdquo; — the
                actual work, layer by layer, with before/after signal screenshots.
              </div>
            </div>
            <div className="coming-card">
              <span className="coming-label">What a case study will contain</span>
              <div className="coming-headline">Verified outcomes</div>
              <div className="coming-body">
                Changes the client can verify directly — Maps position, AI mention
                screenshots, directory accuracy, call volume observations. No claimed
                revenue impact or lead count unless directly attributed and confirmed
                by the client.
              </div>
            </div>
            <div className="coming-card">
              <span className="coming-label">What a case study will contain</span>
              <div className="coming-headline">Client permission</div>
              <div className="coming-body">
                Published only with written or recorded confirmation. Named or
                anonymized — the client chooses. No published case study will include
                a result the client has not personally verified and approved.
              </div>
            </div>
          </div>
          <div className="coming-meta" style={{ marginTop: "28px" }}>
            First case studies expected after retainer engagements cross the 90-day mark.
          </div>
        </div>
      </section>

      {/* SIGNAL SCREENSHOTS — protocol */}
      <section className="rule" style={{ paddingBottom: "100px" }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">Before / after signal reads</span>
              <h2 className="display">
                Screenshot protocol<br />
                <em>in place.</em>
              </h2>
            </div>
            <div className="right">
              Before any retainer work begins, we screenshot the AI prompt response
              for key trade+city queries. Same screenshots at 30, 60, and 90 days with
              identical prompts. Before/after comparisons published when the read shows
              a clear, attributable change.
            </div>
          </div>
          <div className="coming-card" style={{ marginTop: "56px" }}>
            <span className="coming-label">What gets documented at the start of every retainer</span>
            <div className="coming-headline">Baseline signal capture</div>
            <div className="coming-asks">
              <div className="coming-ask">ChatGPT: &ldquo;[trade] in [city]&rdquo; — exact AI recommendation response</div>
              <div className="coming-ask">Perplexity: same query — what it returns and what sources it cites</div>
              <div className="coming-ask">Google AI Overview: &ldquo;best [trade] near me&rdquo; — what appears above organic results</div>
              <div className="coming-ask">Google Maps: business listing, service area, categories, review snapshot</div>
              <div className="coming-ask">Voice (Siri / Alexa): &ldquo;[trade] near me&rdquo; — what gets read back</div>
              <div className="coming-ask">Top three directory listings: NAP consistency check</div>
            </div>
            <div className="coming-meta">
              Repeated at 30, 60, and 90 days with identical prompts. Before/after screenshots
              published when differences are clear and attributable.
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Get the AI Visibility Audit</div>
          <h2 className="display">
            See the read.<br />
            <em>Yours to keep either way.</em>
          </h2>
          <p className="f-deck">
            The AI Visibility Audit runs your company through all six layers
            and delivers instant results — what buyers and AI tools see when they look for
            a contractor like you, where competitors are filling your gap, and what to fix
            first. $27. No commitment required.
          </p>
          <div className="f-cta">
            <AuditPopupButton className="btn btn-primary btn-lg">
              Get the AI Visibility Audit
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </AuditPopupButton>
          </div>
          <div className="f-notes">
            <span>AI Visibility Audit — $27</span>
            <span>Instant results</span>
            <span>No commitment required</span>
            <span>Yours to keep</span>
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
