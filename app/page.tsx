"use client";

import Nav from "./components/Nav";
import Footer from "./components/Footer";
import { useMicroInteractions } from "./hooks/useMicroInteractions";

const CALENDLY = "https://calendly.com/mvw-mattvincentwalker/business-growth-audit";

const layers = [
  {
    num: "01",
    acro: "GEO",
    title: "Generative Engine Optimization",
    body: "When a homeowner asks ChatGPT, Gemini, Claude, or Perplexity for a contractor recommendation,",
    dim: "is your company one of the three names in the answer — or is a competitor filling your spot?",
  },
  {
    num: "02",
    acro: "PEO",
    title: "Prompt Engine Optimization",
    body: "Homeowners search with specific language: \"emergency HVAC repair open now,\" \"roofer for storm damage,\" \"licensed electrician near me,\" \"best plumber in [city].\"",
    dim: "PEO makes sure your company surfaces inside the actual queries your customers are already typing.",
  },
  {
    num: "03",
    acro: "AEO",
    title: "Answer Engine Optimization",
    body: "Google now answers questions directly above the results — before anyone scrolls.",
    dim: "AEO gets your company cited in those answers so buyers see your name before they ever click a link.",
  },
  {
    num: "04",
    acro: "IEO",
    title: "Index Engine Optimization",
    body: "Every AI and search system reads your site, schema, business data, and service descriptions to understand what you do and where you work.",
    dim: "IEO makes that data clean, structured, and machine-readable — so no system misses you or misreads you.",
  },
  {
    num: "05",
    acro: "LEO",
    title: "Local Entity Optimization",
    body: "Google Maps, Apple Maps, Yelp, HomeAdvisor, BBB, directories — every listing, every citation.",
    dim: "LEO reconciles them all so every system a buyer checks sees the same company, consistently.",
  },
  {
    num: "06",
    acro: "VEO",
    title: "Voice Engine Optimization",
    body: "A homeowner standing next to a burst pipe asks Siri who to call. Someone with no AC in July asks Alexa for emergency HVAC near them.",
    dim: "VEO makes sure your company is the answer — hands-free, urgent, and local.",
  },
];

const auditSteps = [
  {
    num: "01",
    phase: "Appear",
    title: "Where you show up",
    body: "We run your company through all six layers live — AI tools, Maps, voice, answer engines, directories. You see exactly where you appear and where you don't, in real time.",
  },
  {
    num: "02",
    phase: "Compete",
    title: "Where competitors show up instead",
    body: "We run the same read for your top local competitors. You see who is occupying the shortlist in your market, which layers they've covered, and where the gap is widest.",
  },
  {
    num: "03",
    phase: "Listen",
    title: "What AI says about your company",
    body: "We show you the actual language AI tools use when asked about contractors in your trade and market. Most contractors have never seen this. Most of what they find is wrong or incomplete.",
  },
  {
    num: "04",
    phase: "Verify",
    title: "Whether your local data is clean",
    body: "Name, address, phone, services, hours — checked across Maps, listings, and directories. If anything conflicts, machines get confused. Confused machines don't recommend you.",
  },
  {
    num: "05",
    phase: "Prioritize",
    title: "What to fix first",
    body: "We close with a ranked priority list — the specific gaps with the most leverage. If you work with us, this becomes the 90-day roadmap. If you don't, you keep it regardless.",
  },
];

const outcomes = [
  {
    num: "01",
    text: "Your company gets named when homeowners ask AI who to call.",
    proof: "\"Best plumber near me.\" \"Emergency roofer after the storm.\" \"Who fixes AC in [city].\" Your name is in the answer.",
  },
  {
    num: "02",
    text: "Callers arrive pre-sold.",
    proof: "\"Three places told me to call you.\" Fewer price shoppers. Shorter sales cycles. Higher close rates.",
  },
  {
    num: "03",
    text: "Your Maps, listings, and directories finally agree.",
    proof: "One phone. One address. One company story. No more leads going to the wrong number or a duplicate listing.",
  },
  {
    num: "04",
    text: "Your position in the market hardens every month.",
    proof: "Every month your name gets cited more, your competitors get cited less. The gap compounds and becomes harder to close.",
  },
];

const faqs = [
  {
    q: "Isn't this just SEO?",
    a: "SEO gets you ranked in the ten blue links Google used to show. That's one layer of one channel. 6 Signal works across six — generative AI, answer engines, Maps, voice assistants, local entity data, and prompt-level visibility. An SEO firm optimizing for 2018's search is solving a different problem than the one costing you calls today.",
  },
  {
    q: "How is this different from a website audit?",
    a: "A website audit looks at your site. The 6 Signal audit looks at everything — what AI tools say when someone asks for a contractor like you, where competitors show up instead, whether your Maps listing agrees with your website, and whether your company is visible in voice and answer-engine results. Your website is one input. We audit all six layers.",
  },
  {
    q: "Do you work with every trade?",
    a: "We work with residential service contractors — roofers, plumbers, HVAC companies, electricians, remodelers, garage door companies, landscapers, pest control, foundation contractors, and others. If your business serves homeowners locally and the phone call is the goal, the six-layer framework applies. We'll tell you on the audit call if it's not a fit.",
  },
  {
    q: "What if I already have an SEO company?",
    a: "Most SEO companies are working on blue-link rankings and on-page optimization. That's real work — it's just one layer. We're not replacing your SEO firm. We're working the five layers most SEO firms don't touch. If they're already doing GEO, prompt visibility, answer engine work, and local entity cleanup, you don't need us. If they're not, you do.",
  },
  {
    q: "How long until I see movement?",
    a: "Local cleanup and answer structure are visible inside thirty days. Real movement inside AI recommendations — the part that puts your name on shortlists — typically starts compounding between month two and month four. Anyone promising faster either doesn't understand how these systems work or is lying.",
  },
  {
    q: "Do you guarantee rankings or leads?",
    a: "No. Anyone who guarantees AI recommendations or specific rankings is making promises they cannot keep — the systems update constantly and no one controls the output. What we guarantee is that you see the full audit before anything gets signed, and the retainer is month-to-month with no cancellation fee. The risk is low. The upside is structural.",
  },
  {
    q: "Why only one contractor per market and trade?",
    a: "Because the shortlist has three names. If we're building your company into that shortlist, we can't simultaneously build your direct competitor into the same shortlist in the same city. One roofer per market. One HVAC company per market. One plumber per market. The exclusivity is structural, not a sales tactic — it means the retainer never works against itself.",
  },
];

export default function Home() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* HERO */}
      <header className="hero">
        <div className="hero-glow"></div>
        <div className="wrap hero-inner">
          <div className="hero-meta reveal">
            <span className="dot"></span>
            <span className="rail"></span>
            <span>AI Visibility · Built for Residential Contractors</span>
          </div>

          <h1 className="display reveal">
            <span className="line">Be the contractor</span>
            <span className="line"><em>AI recommends.</em></span>
            <span className="line dim">Not the one it skips.</span>
          </h1>

          <p className="hero-deck reveal">
            Homeowners don&rsquo;t always search the old way. They ask ChatGPT who to call.
            They check Maps before they dial. They skim AI Overviews and read reviews on the
            way to the phone. By the time they call someone,{" "}
            <strong>the shortlist is already made.</strong>{" "}
            6 Signal makes sure your company is named across every system that now builds it.
          </p>

          <div className="hero-cta-row reveal">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              Book the visibility audit
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </a>
            <a href="#framework" className="btn btn-ghost btn-lg">See how it works</a>
          </div>
          <div className="hero-sig reveal">Free · 30 minutes · No pitch, no deck, no follow-up chase</div>

          <div className="trust-strip reveal">
            <div className="label">We work inside —</div>
            <div className="systems">
              <div className="sys">ChatGPT</div>
              <div className="sys">Perplexity</div>
              <div className="sys">Google AI</div>
              <div className="sys">Google Maps</div>
              <div className="sys">Siri &amp; Alexa</div>
              <div className="sys">Gemini</div>
            </div>
          </div>
        </div>
      </header>

      {/* §02 THE MOMENT */}
      <section className="shift rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 02 — What&rsquo;s actually happening</span>
              <h2 className="display">
                The phone rings less.<br />
                <em>It isn&rsquo;t you — it&rsquo;s the funnel.</em>
              </h2>
            </div>
            <div className="right">
              The homeowner who used to type, scroll, and pick now runs her decision through
              five or six systems before anyone&rsquo;s phone rings. Most contractors are still
              optimized for one.
            </div>
          </div>

          <div className="shift-scene">
            <div className="caption">A real path to a home service call — 2026</div>
            <p>
              <strong>Tuesday. 9:47 p.m.</strong> The water heater is leaking. The AC stops
              cooling. The ceiling stain reappears after rain. She grabs her phone and asks
              ChatGPT: <em>&ldquo;Who do I call for [problem] in [her city]?&rdquo;</em> She
              gets three names in a paragraph.
            </p>
            <p className="dim">
              She pulls up Maps — two of the three have recent reviews and photos. She asks
              Siri for the closest one&rsquo;s number. She calls one. She books one.
            </p>
            <p>
              <strong>You were never in the conversation.</strong> Not because your work is
              worse. Because the systems she checked never learned your name.
            </p>
          </div>

          <div className="shift-flow">
            <div className="stage">
              <div className="n">Stage 01</div>
              <h4>She asks an AI.</h4>
              <p>
                Generative tools and answer engines produce a named shortlist. Three companies.
                Sometimes two. The rest of the market doesn&rsquo;t exist.
              </p>
            </div>
            <div className="arrow-icon">→</div>
            <div className="stage">
              <div className="n">Stage 02</div>
              <h4>She cross-checks local.</h4>
              <p>
                Maps, reviews, knowledge panels, directories. The names on the shortlist get
                verified — or dropped.
              </p>
            </div>
            <div className="arrow-icon">→</div>
            <div className="stage">
              <div className="n">Stage 03</div>
              <h4>She picks up the phone.</h4>
              <p>
                One company. Of twelve in her market, she only ever considered three.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MID CTA */}
      <section className="mid-cta">
        <div className="wrap">
          <h3>
            Every day this runs, <em>your market narrows to three names.</em>
            <br />
            The audit tells you if one of them is yours.
          </h3>
          <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Book the audit
            <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M0 5h14M10 1l4 4-4 4" />
            </svg>
          </a>
          <div className="sub">Takes 30 minutes · Free</div>
        </div>
      </section>

      {/* §03 WHY */}
      <section className="why rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 03 — Why this hits contractors hardest</span>
              <h2 className="display">
                High-trust. High-ticket. Urgent.<br />
                <em>And the shortlist just got shorter.</em>
              </h2>
            </div>
            <div className="right">
              Three things about residential contracting make AI visibility more urgent here
              than almost anywhere else in local business.
            </div>
          </div>

          <div className="why-list">
            <div className="why-row">
              <div className="r-idx">01 / 03</div>
              <div>
                <h3>Homeowners verify before they call. AI is now how they verify.</h3>
                <p>
                  When the problem is urgent — a leak, a failure, a safety issue — buyers
                  move fast but they don&rsquo;t call blind. They ask AI, check Maps, and skim
                  reviews in under two minutes. If your company doesn&rsquo;t appear in that
                  window, you don&rsquo;t get the call. The verification step has moved, and
                  most contractors haven&rsquo;t moved with it.
                </p>
              </div>
            </div>
            <div className="why-row">
              <div className="r-idx">02 / 03</div>
              <div>
                <h3>AI systems are building your reputation without your input.</h3>
                <p>
                  Reviews, citations, directory data, scraped website copy — all of it feeds
                  the AI and search systems forming a homeowner&rsquo;s first impression of
                  your company before you ever answer. Most contractors have never looked at
                  what the machines say about them. Most of what they find is wrong, incomplete,
                  or six years out of date.
                </p>
              </div>
            </div>
            <div className="why-row">
              <div className="r-idx">03 / 03</div>
              <div>
                <h3>The gap is open now. It won&rsquo;t stay open long.</h3>
                <p>
                  Almost no residential contractor has deliberately worked all six visibility
                  layers. The ones who move first own the shortlist in their market. In
                  eighteen to twenty-four months, this will no longer be a gap — it will be
                  table stakes. The question is whether you close it or let a competitor close
                  it first.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* §04 FRAMEWORK */}
      <section className="layers-section" id="framework">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 04 — The framework</span>
              <h2 className="display">
                Six systems decide.<br />
                <em>We work all six.</em>
              </h2>
            </div>
            <div className="right">
              Each one is a different channel where your name gets surfaced — or doesn&rsquo;t.
              Miss one and the shortlist forms without you.
            </div>
          </div>

          {layers.map((layer) => (
            <div className="layer-row" key={layer.num}>
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

      {/* §05 THE AUDIT */}
      <section className="engagement rule" id="engagement">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 05 — The visibility audit</span>
              <h2 className="display">
                Thirty minutes.<br />
                <em>We show you everything.</em>
              </h2>
            </div>
            <div className="right">
              The audit is free. It runs before anything gets signed. You see the full picture
              first — and you keep the read whether you hire us or not.
            </div>
          </div>

          <div className="engage-table">
            {auditSteps.map((row) => (
              <div className="engage-row" key={row.num}>
                <div className="e-idx">{row.num}</div>
                <div className="e-title">
                  <span className="phase">{row.phase}</span>
                  {row.title}
                </div>
                <div className="e-body">{row.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §06 OUTCOMES */}
      <section className="outcomes-section">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 06 — What changes</span>
              <h2 className="display">
                Four things.<br />
                <em>All of them show up on your phone.</em>
              </h2>
            </div>
            <div className="right">
              Not rankings. Not a traffic chart. The four things that actually move for a
              residential contractor when visibility gets handled right.
            </div>
          </div>

          <div className="outcomes-list">
            {outcomes.map((o) => (
              <div className="outcome-line" key={o.num}>
                <div className="o-idx">{o.num}</div>
                <div>
                  <div className="o-text">{o.text}</div>
                  <div className="o-proof">{o.proof}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §07 DIFFERENTIATION */}
      <section className="diff-section rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 07 — Why almost no one else is doing this</span>
              <h2 className="display">
                Search changed.<br />
                <em>Most of your options haven&rsquo;t.</em>
              </h2>
            </div>
            <div className="right">
              If you&rsquo;ve talked to an SEO company recently and something felt off,
              this is probably why.
            </div>
          </div>

          <div className="diff-story">
            <div className="caption">The honest version</div>
            <p>
              Most SEO firms were built for a world where Google showed ten blue links and
              whoever ranked first won.{" "}
              <span className="dim">That world has quietly ended.</span>
            </p>
            <p>
              Rebuilding around generative AI, prompt visibility, voice, and local entity
              work means retraining an entire team —{" "}
              <span className="dim">
                which is why most agencies keep selling you the same package they&rsquo;ve
                always sold,
              </span>{" "}
              hoping you don&rsquo;t notice the ground has moved.
            </p>
            <p>
              <em>6 Signal isn&rsquo;t an SEO agency with a new deck.</em> It&rsquo;s a
              visibility practice designed from day one for how discovery actually works now
              — specialized for residential contractors, limited to one client per market and
              trade, and built to work all six systems your customers are using tonight.
            </p>
          </div>
        </div>
      </section>

      {/* §08 FIT */}
      <section className="fit-section">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 08 — Honest fit</span>
              <h2 className="display">
                Who this is for.<br />
                <em>And who it isn&rsquo;t.</em>
              </h2>
            </div>
            <div className="right">
              A serious engagement for serious operators. Not a fit for everyone — and
              we&rsquo;d rather say that now than three months in.
            </div>
          </div>

          <div className="fit-grid">
            <div className="fit-col yes">
              <div className="f-label">
                <span className="sym">+</span>Built for
              </div>
              <ul>
                <li>Residential contractors who want to own their local market, not rent leads from it.</li>
                <li>Operators who think in years, not in weekly lead counts.</li>
                <li>Companies with real revenue and a reason to protect their position.</li>
                <li>Owners who already know their digital presence is costing them calls.</li>
              </ul>
            </div>
            <div className="fit-col no">
              <div className="f-label">
                <span className="sym">–</span>Not for
              </div>
              <ul>
                <li>Anyone chasing the cheapest line item on a marketing spreadsheet.</li>
                <li>Companies expecting leads inside thirty days.</li>
                <li>Owners who want to hand it off and disappear.</li>
                <li>Anyone already working with a visibility partner they genuinely trust.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* §09 PRICING */}
      <section className="pricing-section rule" id="pricing">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 09 — The retainer</span>
              <h2 className="display">
                One price.<br />
                <em>One market. Every month.</em>
              </h2>
            </div>
            <div className="right">
              Flat retainer. No tiers. No setup fees. No upsell path. If the audit says
              6 Signal isn&rsquo;t the right call for your market, we&rsquo;ll tell you —
              and you still keep the audit.
            </div>
          </div>

          <div className="pricing-core">
            <div className="p-eyebrow">The 6 Signal Visibility Retainer</div>
            <div className="p-number">
              <span className="dollar">$</span>1,500
              <span className="mo">/ month</span>
            </div>
            <div className="p-sub">
              One contractor per market, per trade.{" "}
              <em>If your territory isn&rsquo;t taken yet, it should be yours.</em>
            </div>
            <div className="p-cta">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                Claim your market
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
            </div>
            <div className="p-guarantee">
              Month-to-month · Cancel anytime · Audit first — retainer only if you want to continue
            </div>
          </div>

          <div className="pricing-detail">
            <div className="pricing-note">
              <p>
                <span className="highlight">
                  We take one contractor per market, per trade
                </span>{" "}
                — one roofer, one HVAC company, one plumber per city. The retainer never
                competes against itself in your market.
              </p>
              <p className="italic" style={{ marginTop: "20px" }}>
                If your market is open and you want it, book the audit. If it&rsquo;s already
                taken, the call tells you in thirty seconds — and you still get the full
                visibility read regardless.
              </p>
            </div>

            <div className="included">
              <h4>Included every month</h4>
              <div>Full visibility audit across all six layers</div>
              <div>Local entity cleanup — Maps, listings, citations, directories</div>
              <div>Answer-ready content across your site</div>
              <div>Structured data and machine-readable indexing</div>
              <div>Prompt and AI recommendation work — the lead engine</div>
              <div>Monthly signal report: what moved, what&rsquo;s next</div>
              <div>90-day rolling roadmap, revised every month</div>
              <div>Direct access to the operator running your account</div>
            </div>
          </div>
        </div>
      </section>

      {/* §10 FAQ */}
      <section className="faq-section" id="faq">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 10 — Straight answers</span>
              <h2 className="display">
                Honest questions.<br />
                <em>Answered honestly.</em>
              </h2>
            </div>
            <div className="right">
              The questions every serious contractor asks before signing. All of them,
              answered directly.
            </div>
          </div>

          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q">
                  <span className="q-idx">{String(i + 1).padStart(2, "0")}</span>
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

      {/* §11 FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Book the audit</div>
          <h2 className="display">
            Three contractors get named<br />
            in your market this week.<br />
            <em>Be one of them.</em>
          </h2>
          <p className="f-deck">
            Thirty-minute call. We walk your visibility across all six layers, show you
            exactly where the gaps are, and tell you honestly whether 6 Signal is the right
            fit. If your market is already taken, we&rsquo;ll tell you on the call.
          </p>
          <div className="f-cta">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              Book the audit
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </a>
            <a
              href="mailto:mvw@mattvincentwalker.com?subject=%F0%9F%94%A5%206%20Signal%20%F0%9F%94%A5"
              className="btn btn-ghost btn-lg"
            >
              Email directly
            </a>
          </div>
          <div className="f-notes">
            <span>Free</span>
            <span>30 minutes</span>
            <span>No pitch</span>
            <span>One client per market</span>
          </div>
        </div>
      </section>

      <Footer />

      <div className="mobile-cta">
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer">
          Book the visibility audit
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
