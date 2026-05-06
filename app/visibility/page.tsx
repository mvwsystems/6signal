"use client";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import AuditPopupButton from "../components/AuditPopupButton";

const layers = [
  {
    num: "01",
    acro: "GEO",
    title: "Generative Engine Optimization",
    body: "When a homeowner asks ChatGPT, Gemini, or Perplexity who to call for a contractor in your trade and city,",
    dim: "is your company one of the three names in the answer? Most contractors aren't. GEO work builds the associations that put you there.",
  },
  {
    num: "02",
    acro: "PEO",
    title: "Prompt Engine Optimization",
    body: "Buyers search with specific language — 'emergency HVAC repair open now,' 'roofer for storm damage,' 'licensed plumber near me.'",
    dim: "PEO makes sure your company surfaces inside the exact queries your customers type — not just a generic 'contractor near me.'",
  },
  {
    num: "03",
    acro: "AEO",
    title: "Answer Engine Optimization",
    body: "Google and AI tools answer questions directly above the results — before anyone clicks a link.",
    dim: "AEO gets your company cited in those answers so buyers see your name before they scroll to the organic results.",
  },
  {
    num: "04",
    acro: "IEO",
    title: "Index Engine Optimization",
    body: "AI and search systems read your website, schema, business data, and service descriptions to understand what you do and where you work.",
    dim: "IEO makes that data clean, specific, and machine-readable — so no system misses you or describes you in generic terms.",
  },
  {
    num: "05",
    acro: "LEO",
    title: "Local Entity Optimization",
    body: "Google Maps, Apple Maps, Yelp, HomeAdvisor, BBB, Angi — every listing a buyer might check.",
    dim: "LEO reconciles all of them so every system sees the same company, the same number, the same service area — consistently.",
  },
  {
    num: "06",
    acro: "VEO",
    title: "Voice Engine Optimization",
    body: "A homeowner with a burst pipe asks Siri who to call. Someone with no AC in July asks Alexa for emergency HVAC near them.",
    dim: "VEO makes sure your company is the answer — hands-free, urgent, and specific to your city.",
  },
];

const gaps = [
  "AI tools name competitors when asked for contractors in your trade and city",
  "Your GBP service area doesn't match your actual coverage or your website",
  "Directory listings have an old phone number, address, or company name",
  "No structured data (schema) for your services, license, or service area",
  "Voice search returns a competitor — or nothing — when asked for your trade near your address",
  "Your company appears in Maps but not in AI recommendations or answer boxes",
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
            <span className="idx reveal">6 Signal — Visibility</span>
            <h1 className="display reveal">
              Your company is losing calls<br />
              <em>in systems you&rsquo;ve never looked at.</em>
            </h1>
            <p className="hero-deck reveal">
              Most contractors are invisible in at least three of the six channels
              homeowners now check before they call anyone. The audit shows you exactly
              where — live, across all six layers, before anything gets signed.
            </p>
            <div className="hero-cta-row reveal">
              <a href="/audit" className="btn btn-primary btn-lg">
                Book the Visibility Audit
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
              <a href="/#framework" className="btn btn-ghost btn-lg">See the framework</a>
            </div>
            <div className="hero-sig reveal">
              Six-layer pre-audit · 30-minute readout · Market conflict check · Priority list yours to keep
            </div>
          </div>
        </div>
      </header>

      {/* PROBLEM */}
      <section className="problem-section rule">
        <div className="wrap">
          <span className="idx">The gap most contractors don&rsquo;t see</span>
          <p className="problem-lead">
            The search behavior that builds your shortlist has changed.{" "}
            <em>Most contractors are still optimized for 2018.</em>
          </p>
          <div className="problem-cols">
            <div className="problem-text">
              Homeowners don&rsquo;t just Google and click the first blue link. They ask
              ChatGPT who to call. They check AI Overviews before they scroll. They
              ask Siri for emergency help with their hands full. They cross-check Maps
              reviews against whatever AI just told them.
              <br /><br />
              Each one of those is a separate system with separate inputs. A contractor
              can rank on page one and be completely invisible in all five others.
              <br /><br />
              <span className="dim">
                Most contractors have never looked at what the machines say about them.
                Most of what they find is wrong, outdated, or missing entirely.
              </span>
            </div>
            <div className="problem-bullets">
              {gaps.map((b, i) => (
                <div key={i} className="problem-bullet">{b}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MID CTA */}
      <section className="mid-cta">
        <div className="wrap">
          <h3>
            Your market has a shortlist.
            <br />
            <em>The audit tells you whether you&rsquo;re on it.</em>
          </h3>
          <a href="/audit" className="btn btn-primary">
            Find the Gaps
            <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M0 5h14M10 1l4 4-4 4" />
            </svg>
          </a>
          <div className="sub">Pre-audit included · 30-minute readout · One company per market</div>
        </div>
      </section>

      {/* SIX LAYERS */}
      <section className="layers-section rule" id="layers">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">The six visibility layers</span>
              <h2 className="display">
                Six systems decide<br />
                <em>who gets the call.</em>
              </h2>
            </div>
            <div className="right">
              Each one is a different channel where your name gets surfaced — or
              doesn&rsquo;t. Miss one and the shortlist forms without you.
            </div>
          </div>
          {layers.map((layer) => (
            <div className="layer-row reveal" key={layer.num}>
              <div className="l-idx">{layer.num}</div>
              <div className="l-acro">{layer.acro}</div>
              <div className="l-body">
                <h3>{layer.title}</h3>
                <p>
                  {layer.body} <span className="dim">{layer.dim}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Book the audit</div>
          <h2 className="display">
            Three contractors get named<br />
            in your market this week.<br />
            <em>Find out if one of them is yours.</em>
          </h2>
          <p className="f-deck">
            Thirty-minute call. We run your company through all six layers — live. You see
            what a homeowner sees when they search for a contractor in your trade and city.
            We show you where competitors are filling your gap, and what it would take to
            close it. One contractor per market. If yours is already taken, you&rsquo;ll
            know in thirty seconds — and you keep the full read either way.
          </p>
          <div className="f-cta">
            <AuditPopupButton className="btn btn-primary btn-lg">
              Book the audit
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </AuditPopupButton>
          </div>
          <div className="f-notes">
            <span>No-charge pre-audit</span>
            <span>30-minute readout</span>
            <span>No commitment required</span>
            <span>One client per market</span>
          </div>
        </div>
      </section>

      <Footer />

      <div className="mobile-cta">
        <AuditPopupButton>
          Book the visibility audit
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
