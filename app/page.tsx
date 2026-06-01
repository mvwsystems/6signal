"use client";

import Nav from "./components/Nav";
import Footer from "./components/Footer";
import AuditExamplesSection from "./components/proof/AuditExamplesSection";
import { useMicroInteractions } from "./hooks/useMicroInteractions";
import AuditPopupButton from "./components/AuditPopupButton";

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
    phase: "Pre-audit",
    title: "Where you show up — and where you don't",
    body: "Before the readout call, we run your company through all six layers — AI tools, Maps, voice, answer engines, directories, and local entity data. You see exactly where you appear and where you're invisible, without needing to be on a call for any of it.",
  },
  {
    num: "02",
    phase: "Compete",
    title: "Where competitors show up instead",
    body: "We run the same six-layer pre-audit for your top local competitors. During the readout, you see who occupies the shortlist in your market, which layers they've covered, and where the gap is widest.",
  },
  {
    num: "03",
    phase: "Listen",
    title: "What AI says about your company",
    body: "We surface the actual language AI tools use when asked about contractors in your trade and market. Most contractors have never seen this. Most of what the machines say was never their intended positioning.",
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
    proof: "Every month, we track where your company is being surfaced, skipped, or outranked — then build the next set of signals to strengthen your position.",
  },
];

const faqs = [
  {
    q: "Isn't this just SEO?",
    a: "SEO is one input into one system. It was never designed for ChatGPT, voice search, or answer engines — and it doesn't affect any of them. 6 Signal works across six layers: generative AI recommendations, prompt visibility, answer engines, index structure, local entity data, and voice. If your SEO is strong, this adds the five channels it doesn't touch.",
  },
  {
    q: "How is this different from a website audit?",
    a: "A website audit looks at your site. The 6 Signal audit looks at what homeowners actually see — what AI tools say about your company when someone asks for a contractor like you, where competitors appear in your place, whether your Maps listing matches your website, and whether you're visible in voice and answer-engine results. Your website is one input. We audit all six layers.",
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
    a: "No. Anyone who guarantees AI recommendations or specific rankings is making promises they cannot keep — the systems update constantly and no one controls the output. What we do commit to: you see the full audit before anything gets signed, the first 90 days are the minimum commitment, and the priority list is yours to keep regardless of what you decide. The risk is low. The upside is structural.",
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
            Homeowners don&rsquo;t search the old way anymore. They ask ChatGPT who to call.
            They check Maps before they dial. By the time they pick up the phone,{" "}
            <strong>the shortlist is already set</strong> — built by AI tools, answer engines,
            and local data systems most contractors have never looked at. 6 Signal gets your
            company named across all six before the call you&rsquo;re hoping for gets made.
          </p>

          <div className="hero-cta-row reveal">
            <AuditPopupButton className="btn btn-primary btn-lg">
              Get the AI Visibility Brief
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </AuditPopupButton>
            <a href="#framework" className="btn btn-ghost btn-lg">See how it works</a>
          </div>
          <div className="hero-sig reveal">Complete the intake · Schedule your readout · Priority list yours to keep</div>

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
          <a href="/audit" className="btn btn-primary">
            See Where You Get Skipped
            <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M0 5h14M10 1l4 4-4 4" />
            </svg>
          </a>
          <div className="sub">Pre-audit included · 30-minute readout · No commitment</div>
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
              <div className="r-idx">01 / 02</div>
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
              <div className="r-idx">02 / 02</div>
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
              <span className="idx">§ 04 — The six-layer framework</span>
              <h2 className="display">
                Six systems decide.<br />
                <em>We work all six.</em>
              </h2>
            </div>
            <div className="right">
              Six because there are six distinct systems that independently form a homeowner&rsquo;s
              shortlist. Signal because visibility isn&rsquo;t about ranking — it&rsquo;s about
              getting the right signal to the right machine at the right moment. Miss one layer
              and the shortlist forms without you.
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
                Pre-audit first.<br />
                <em>Priority gaps on the call.</em>
              </h2>
            </div>
            <div className="right">
              We run the six-layer pre-audit before the call. On the readout, we walk
              through the findings — your company, your competitors, your market, layer by
              layer. No slides, no deck. The full findings are yours regardless of what
              you decide.
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

      {/* RESULTS NOTE */}
      <section className="results-section">
        <div className="wrap">
          <div className="results-inner">
            <div className="results-statement">
              <strong>6 Signal is a new practice.</strong> Audits are running. Retainers are
              active. We&rsquo;re documenting outcomes as they develop — call volume changes,
              citation wins, AI recommendation improvements.{" "}
              <em>
                We don&rsquo;t publish outcomes we can&rsquo;t verify, attribute accurately,
                or share with a client&rsquo;s permission.
              </em>{" "}
              That&rsquo;s a deliberate choice, not a gap. If you want to speak with someone
              who&rsquo;s been through the process, ask on the audit call and we&rsquo;ll
              facilitate the introduction.
            </div>
            <div className="results-right-label">On outcomes</div>
          </div>
        </div>
      </section>

      <AuditExamplesSection
        maxItems={4}
        idx="What audits typically find"
        headlineTop="Gaps that cost calls."
        headlineEm="Across every trade."
        deckRight="These are the types of issues that surface in the audit — shown as illustrative format examples across different trades and search layers."
      />

      {/* MID CTA 2 */}
      <section className="mid-cta">
        <div className="wrap">
          <h3>
            Your market has a shortlist.
            <br />
            <em>Find out if your name is on it.</em>
          </h3>
          <AuditPopupButton className="btn btn-primary">
            Get the AI Visibility Brief
            <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M0 5h14M10 1l4 4-4 4" />
            </svg>
          </AuditPopupButton>
          <div className="sub">One company per market · Instant results</div>
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
              trade, and built to work all six systems your customers are using tonight.{" "}
              <span className="dim">
                Based in the Dallas/Fort Worth area. Serving contractors in DFW and select
                markets beyond Texas.
              </span>
            </p>
          </div>

          <div className="operator-note">
            <span className="op-label">The operator</span>
            <p>
              <strong>6 Signal is run by Matt Vincent Walker</strong> — a visibility practitioner
              who works exclusively on how AI and search systems form local shortlists for
              residential service businesses. One operator per account. No account managers,
              no junior staff on your work. When you&rsquo;re on the audit call, you&rsquo;re
              talking to the person doing the work.
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
              <span className="dollar">$</span>1,250
              <span className="mo">/ month</span>
            </div>
            <div className="p-sub">
              One contractor per market, per trade.{" "}
              <em>If your territory isn&rsquo;t taken yet, it should be yours.</em>
            </div>
            <div className="p-cta">
              <AuditPopupButton className="btn btn-primary btn-lg">
                Claim your market
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </AuditPopupButton>
            </div>
            <div className="p-guarantee">
              90-day minimum · Month-to-month after · Audit first — retainer only if you want to continue
            </div>
          </div>

          <div className="pricing-detail">
            <div className="pricing-note">
              <p>
                <span className="highlight">
                  We do not work with direct competitors in the same trade and market.
                </span>{" "}
                If we are already working with a roofer in your city, we will not take
                another roofer there. One HVAC company per market. One plumber per market.
                The retainer never competes against itself.
              </p>
              <p style={{ marginTop: "20px" }}>
                This is structural, not a sales tactic. Visibility work creates competitive
                advantage — building your company into the three-name shortlist while
                simultaneously building your direct competitor into the same shortlist would
                undo the work. The exclusivity makes the retainer meaningful.
              </p>
              <p className="italic" style={{ marginTop: "20px" }}>
                The audit includes a market conflict check. If your market is open and you
                want it, book the call. If it&rsquo;s already taken, you&rsquo;ll know in
                the first thirty seconds — and you still keep the full visibility read.
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

      {/* HOW THE AUDIT WORKS */}
      <section className="rule" style={{ paddingBottom: "0" }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">How the audit works</span>
              <h2 className="display">
                Pre-audit first.<br />
                <em>Readout on the call.</em>
              </h2>
            </div>
            <div className="right">
              We do the diagnostic work before the call — so the 30 minutes with you is
              spent on findings, not discovery. A short intake tells us what to look for.
              Then the pre-audit runs. Then we walk through what we found.
            </div>
          </div>
          <div className="process-steps">
            <div className="process-step">
              <span className="process-step-num">01 — Intake</span>
              <h3>Complete the short intake</h3>
              <p>Tell us your trade, service area, website, top services, and top competitors. Takes a few minutes. The scheduling link appears right after — pick a time for your readout while you&rsquo;re there.</p>
            </div>
            <div className="process-step">
              <span className="process-step-num">02 — Pre-audit</span>
              <h3>We run the six-layer read</h3>
              <p>Before the call, we run your company through all six visibility layers — AI tools, Maps, voice, answer engines, directories, and local entity data. Your top competitors get the same read.</p>
            </div>
            <div className="process-step">
              <span className="process-step-num">03 — Readout</span>
              <h3>We walk through the findings</h3>
              <p>30 minutes on video. We walk through what we found — layer by layer, gap by gap, against your competitors. Full findings and priority list are yours regardless of what you decide.</p>
            </div>
          </div>
          <div className="safety-note">
            <span className="safety-note-label">On the retainer conversation</span>
            <p>
              <strong>We show you the findings first.</strong> If there&rsquo;s a fit for
              the retainer, we&rsquo;ll say so once — clearly, without pressure. If it&rsquo;s
              not a fit, we&rsquo;ll say that instead. <em>The full findings are yours either
              way. No follow-up if the answer is no.</em>
            </p>
          </div>
        </div>
      </section>

      {/* §11 FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Get the AI Visibility Brief</div>
          <h2 className="display">
            See what AI says<br />
            about your company<br />
            <em>before your next call does.</em>
          </h2>
          <p className="f-deck">
            Complete the short pre-audit intake, then schedule your 30-minute
            visibility readout. We run the six-layer pre-audit before the call —
            so your readout is specific to your company, your competitors, and your
            market. The findings and priority list are yours regardless of what
            you decide.
          </p>
          <div className="f-cta">
            <AuditPopupButton className="btn btn-primary btn-lg">
              Get the AI Visibility Brief
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </AuditPopupButton>
          </div>
          <div className="f-notes">
            <span>AI Visibility Brief — $27</span>
            <span>Six-layer analysis</span>
            <span>Instant results</span>
            <span>Priority list yours to keep</span>
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
