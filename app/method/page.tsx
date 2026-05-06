"use client";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import AuditPopupButton from "../components/AuditPopupButton";

const oldSearch = [
  "Buyer types a keyword into Google",
  "Ten blue links appear in the results",
  "Clicks two or three websites, reads pages",
  "Compares manually and picks whoever seems credible",
  "Calls the company — often days later",
];

const newSearch = [
  "Buyer asks an AI who to call for the problem",
  "Gets two or three specific company names",
  "Cross-checks on Maps, reads recent reviews",
  "Checks one website to verify — then stops",
  "Voice-searches the number and calls within the hour",
];

const signals = [
  {
    num: "01",
    acro: "GEO",
    title: "Generative Engine Optimization",
    body: "When a homeowner asks ChatGPT, Gemini, or Perplexity who to call for a contractor in your trade and city,",
    dim: "your company should be one of the three names in the answer. GEO builds the associations — trade, city, specialty, and trust signals — that make AI tools recommend you by name instead of a competitor.",
  },
  {
    num: "02",
    acro: "PEO",
    title: "Prompt Engine Optimization",
    body: "Buyers don't search with one generic phrase. They use specific language: 'emergency HVAC repair open now,' 'roofer for storm damage,' 'licensed electrician near me.'",
    dim: "PEO maps your company to the exact queries your customers are already running — not just broad category terms that your competitors own just as well as you do.",
  },
  {
    num: "03",
    acro: "AEO",
    title: "Answer Engine Optimization",
    body: "Google now answers questions directly above the organic results — before anyone scrolls. AI Overviews, featured snippets, and direct answer boxes all form before a buyer ever clicks.",
    dim: "AEO gets your company cited in those answers so buyers see your name at the top of the read — before they reach the organic results, the ads, or the Maps pack.",
  },
  {
    num: "04",
    acro: "IEO",
    title: "Index Engine Optimization",
    body: "Every AI and search system reads your website, schema, business data, and service descriptions to understand what you do, where you work, and who you serve.",
    dim: "IEO makes that data clean, structured, and machine-readable — so no system misses you, misreads your service area, or assigns you categories you don't own.",
  },
  {
    num: "05",
    acro: "LEO",
    title: "Local Entity Optimization",
    body: "Google Maps, Apple Maps, Yelp, HomeAdvisor, BBB, Angi, and dozens of directories — every listing and citation a buyer might check before they dial.",
    dim: "LEO reconciles all of them so every system a buyer crosses sees the same company, the same number, the same service area — no conflicts, no confusion, no leads going to the wrong number.",
  },
  {
    num: "06",
    acro: "VEO",
    title: "Voice Engine Optimization",
    body: "A homeowner standing next to a burst pipe asks Siri who to call. Someone with no AC in July asks Alexa for emergency HVAC near them. These searches happen without a screen.",
    dim: "VEO makes sure your company is the answer in voice-first scenarios — hands-free, urgent, and specific to your city and trade.",
  },
];

const whyRows = [
  {
    idx: "01 / 05",
    heading: "Local intent is the highest-value signal in search.",
    body: "The homeowner isn't browsing. She needs someone in her city, in her trade, right now. That specificity makes contractor searches the most commercially valuable queries running through these systems — and the most competitive. Whoever owns that shortlist wins the call.",
  },
  {
    idx: "02 / 05",
    heading: "Urgent problems compress the buying cycle to hours.",
    body: "A leaking pipe, a failed AC in July, a roof torn by a storm — the homeowner isn't comparison shopping over a week. The shortlist forms in minutes. If you're not already visible across the systems she checks, you don't make it.",
  },
  {
    idx: "03 / 05",
    heading: "High-trust decisions drive deeper due diligence.",
    body: "A contractor enters your home. That's different from ordering a product. Buyers research across more channels because the stakes are higher — Maps, reviews, AI recommendations, directories, and website all get checked before a phone rings. Every layer matters.",
  },
  {
    idx: "04 / 05",
    heading: "Service-area complexity breaks generic visibility tools.",
    body: "You don't serve a city. You serve specific zip codes, neighborhoods, and suburbs within a drive radius. Generic SEO tools aren't built for that granularity. The six-layer framework is — each layer can be tuned to the exact geography you actually work.",
  },
  {
    idx: "05 / 05",
    heading: "AI is compressing the shortlist faster here than anywhere else.",
    body: "Generative tools have learned that local service queries need specific names, not links. They produce shortlists. In residential contracting, that shortlist is typically three companies — sometimes two. The rest of the market doesn't appear in the answer. The audit shows where you stand in that read.",
  },
];

const howWeWork = [
  {
    num: "01",
    phase: "Pre-audit",
    title: "Six-layer read — before the call",
    body: "We run your company through all six layers before the readout: AI tools, answer engines, Maps, voice, index structure, and local entity data. You don't need to attend this part. The 30 minutes with you is spent on findings.",
  },
  {
    num: "02",
    phase: "Check",
    title: "Market conflict check",
    body: "We verify that your trade and city are open. We do not work with direct competitors in the same market. If we're already working with a roofer in your city, you'll know in the first few minutes — and you still get the full read.",
  },
  {
    num: "03",
    phase: "Compare",
    title: "Same read for your local competitors",
    body: "The pre-audit covers your top local competitors too. During the readout, you see who's on the shortlist in your market, which layers they've worked, and where the widest gap is.",
  },
  {
    num: "04",
    phase: "Sequence",
    title: "Rank what to fix first",
    body: "We close with a ranked priority list — the specific gaps with the most leverage, sequenced. Not a generic best-practices list. A read of your actual situation and what to address in what order.",
  },
  {
    num: "05",
    phase: "Build",
    title: "Work all six layers every month",
    body: "Each retainer month covers all six layers: local entity cleanup, answer-ready content and schema, index structure, prompt and AI recommendation work, and voice signal maintenance.",
  },
  {
    num: "06",
    phase: "Report",
    title: "Monthly signal report and rolling 90-day roadmap",
    body: "Every month: what moved, what's next, and a revised roadmap. No guarantees we can't support. No metrics that don't connect to calls. You see the work and you see what it's producing.",
  },
];

export default function MethodPage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">6 Signal — The Method</span>
            <h1 className="display reveal">
              Contractors are being chosen<br />
              <em>before the first call.</em>
            </h1>
            <p className="hero-deck reveal">
              By the time a homeowner dials, she has already decided. She checked
              AI recommendations, read Maps reviews, and cross-referenced two or
              three systems. The company she calls was on her shortlist before the
              phone ever rang. 6 Signal is a visibility practice built around
              making sure that company is yours.
            </p>
            <div className="hero-cta-row reveal">
              <AuditPopupButton className="btn btn-primary btn-lg">
                Book the Visibility Audit
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </AuditPopupButton>
              <a href="#signals" className="btn btn-ghost btn-lg">See the six layers</a>
            </div>
            <div className="hero-sig reveal">
              Six-layer visibility framework · Built for residential contractors · One company per market
            </div>
          </div>
        </div>
      </header>

      {/* §01 THE SHIFT */}
      <section className="shift rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 01 — What changed</span>
              <h2 className="display">
                One search box<br />
                became six systems.<br />
                <em>The shortlist forms before anyone calls.</em>
              </h2>
            </div>
            <div className="right">
              Five years ago, a buyer searched Google, clicked a few links, and
              compared pages. That path still exists — it&rsquo;s just no longer
              the whole picture. A growing share of the buying decision now happens
              across systems most contractors have never logged into. The shortlist
              those systems produce gets called. The rest of the market doesn&rsquo;t.
            </div>
          </div>

          <div className="method-compare">
            <div className="mc-col">
              <span className="mc-label">Old search — 2019</span>
              {oldSearch.map((step, i) => (
                <div className="mc-step" key={i}>{step}</div>
              ))}
            </div>
            <div className="mc-col">
              <span className="mc-label">New search — 2026</span>
              {newSearch.map((step, i) => (
                <div className="mc-step mc-step-new" key={i}>{step}</div>
              ))}
            </div>
          </div>

          <div className="shift-flow" style={{ marginTop: "64px" }}>
            <div className="stage">
              <div className="n">Layer 01–02</div>
              <h4>She asks an AI.</h4>
              <p>
                Generative tools and answer engines produce a named shortlist — two
                or three contractors, sometimes fewer. The rest of the market doesn&rsquo;t
                appear in the answer.
              </p>
            </div>
            <div className="arrow-icon">→</div>
            <div className="stage">
              <div className="n">Layer 03–05</div>
              <h4>She verifies locally.</h4>
              <p>
                Maps, reviews, and directories confirm or drop the names from the
                AI answer. A bad listing, a wrong phone number, or missing photos
                can knock you off the list here.
              </p>
            </div>
            <div className="arrow-icon">→</div>
            <div className="stage">
              <div className="n">Layer 06</div>
              <h4>She calls without typing.</h4>
              <p>
                Voice search returns one answer. If your company isn&rsquo;t
                optimized for hands-free, urgent queries, the call goes to whoever is.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* §02 THE SIX SIGNALS */}
      <section className="layers-section rule" id="signals">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 02 — The six-layer framework</span>
              <h2 className="display">
                Six systems decide.<br />
                <em>We work all six.</em>
              </h2>
            </div>
            <div className="right">
              Six because there are six distinct systems that independently form a
              homeowner&rsquo;s shortlist. Signal because visibility isn&rsquo;t
              about ranking — it&rsquo;s about getting the right signal to the right
              machine at the right moment. Miss one layer and the shortlist forms
              without you.
            </div>
          </div>
          {signals.map((layer) => (
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

      {/* §03 WHY CONTRACTORS */}
      <section className="why rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 03 — Why this hits contractors hardest</span>
              <h2 className="display">
                Local. Urgent.<br />
                High-trust.<br />
                <em>The shortlist compresses faster here.</em>
              </h2>
            </div>
            <div className="right">
              Residential contracting sits at the intersection of every factor that
              makes AI visibility matter most. The combination is why the shortlist
              forms faster here than in almost any other local business category.
            </div>
          </div>

          <div className="why-list">
            {whyRows.map((row) => (
              <div className="why-row" key={row.idx}>
                <div className="r-idx">{row.idx}</div>
                <div>
                  <h3>{row.heading}</h3>
                  <p>{row.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MID CTA */}
      <section className="mid-cta">
        <div className="wrap">
          <h3>
            Your market&rsquo;s shortlist is already forming.
            <br />
            <em>The audit tells you whether your name is in it.</em>
          </h3>
          <AuditPopupButton className="btn btn-primary">
            Book the Visibility Audit
            <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M0 5h14M10 1l4 4-4 4" />
            </svg>
          </AuditPopupButton>
          <div className="sub">Free · 30 minutes · One company per market</div>
        </div>
      </section>

      {/* §04 WHAT MAKES 6 SIGNAL DIFFERENT */}
      <section className="diff-section rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 04 — What 6 Signal is</span>
              <h2 className="display">
                Not an agency.<br />
                <em>A focused visibility practice.</em>
              </h2>
            </div>
            <div className="right">
              Most of the options available to contractors were built for a different
              problem. Understanding what 6 Signal is requires understanding what it
              is not — and why the distinction matters.
            </div>
          </div>

          <div className="diff-story">
            <div className="caption">The honest version</div>
            <p>
              SEO agencies were built for a world where ranking in ten blue links was
              the game.{" "}
              <span className="dim">
                That model still exists — it&rsquo;s just no longer the full game.
              </span>{" "}
              ChatGPT, Gemini, and Perplexity weren&rsquo;t designed to rank pages.
              They were designed to produce answers — which means they run entirely
              outside the systems traditional SEO was built around. Voice search,
              answer engines, and AI recommendations all operate on different inputs
              than a standard SEO audit covers.
            </p>
            <p>
              Web design shops build you a website. PPC vendors run ads. AI
              consultants sell workshops about AI.{" "}
              <span className="dim">
                None of them are specifically managing your signal across the six
                systems that form a homeowner&rsquo;s shortlist before she ever
                clicks anything.
              </span>
            </p>
            <p>
              <em>
                6 Signal is a visibility practice designed from day one for how
                discovery actually works now.
              </em>{" "}
              Specialized for residential contractors. Limited to one client per
              market and trade — so the work is never used against itself. Built
              to work all six systems your customers are using tonight, not the
              ones that were dominant in 2018.
            </p>
          </div>

          <div className="operator-note">
            <span className="op-label">The operator</span>
            <p>
              <strong>6 Signal is run by Matt Walker</strong> — a visibility
              practitioner focused exclusively on how AI and search systems form
              local shortlists for residential service businesses. One operator per
              account. No account managers, no junior staff on your work. The person
              on the audit call is the person running your account.
            </p>
          </div>
        </div>
      </section>

      {/* §05 HOW WE WORK */}
      <section className="engagement rule" id="how">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 05 — The method</span>
              <h2 className="display">
                Audit first.<br />
                <em>Then build what sticks.</em>
              </h2>
            </div>
            <div className="right">
              The work is sequential: understand the gap before building the fix.
              Every engagement starts with a full six-layer read — live, on the first
              call. Nothing gets signed before you&rsquo;ve seen the results.
            </div>
          </div>

          <div className="engage-table">
            {howWeWork.map((row) => (
              <div className="engage-row reveal" key={row.num}>
                <div className="e-idx">{row.num}</div>
                <div className="e-title">
                  <span className="phase">{row.phase}</span>
                  {row.title}
                </div>
                <div className="e-body">{row.body}</div>
              </div>
            ))}
          </div>

          <div className="safety-note" style={{ marginTop: "48px" }}>
            <span className="safety-note-label">On guarantees</span>
            <p>
              <strong>We don&rsquo;t guarantee rankings, AI recommendations, or
              specific lead volumes.</strong> Anyone who does either doesn&rsquo;t
              understand how these systems work or is making promises they can&rsquo;t
              keep. What we do guarantee: you see the full audit before anything gets
              signed, the first 90 days are the minimum commitment (month-to-month after), and
              the priority list is yours to keep regardless of what you decide.{" "}
              <em>The risk is low. The upside is structural.</em>
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Book the Visibility Audit</div>
          <h2 className="display">
            See what the machines<br />
            say about your company<br />
            <em>before your next caller does.</em>
          </h2>
          <p className="f-deck">
            Thirty minutes on a video call. We run your company through all six
            layers — live, on screen, with you watching. You see what AI tools,
            Maps, answer engines, and voice search understand about your company
            right now. You leave with a ranked priority list and a full six-layer
            read — yours regardless of what you decide next.
          </p>
          <div className="f-cta">
            <AuditPopupButton className="btn btn-primary btn-lg">
              Book the Visibility Audit
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </AuditPopupButton>
          </div>
          <div className="f-notes">
            <span>No-charge pre-audit</span>
            <span>30-minute readout</span>
            <span>No commitment required</span>
            <span>One company per market</span>
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
