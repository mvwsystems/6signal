"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Reveal observer
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add("in"), i * 60);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    // Hero reveal sequence
    const heroEls = document.querySelectorAll(".hero .reveal");
    heroEls.forEach((el, i) => {
      setTimeout(() => el.classList.add("in"), 140 + i * 180);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  const toggleFaq = (i: number) => {
    setOpenFaq(openFaq === i ? null : i);
  };

  const faqs = [
    {
      q: "Isn't this just SEO with a new name?",
      a: "Traditional SEO is one slice of what we do — the index and answer layers. The other four layers (generative AI, prompt visibility, local entity, voice) operate on different mechanics entirely and are where most real discovery is now happening. An SEO firm working only on blue-link rankings is solving 2018's problem with 2018's tools.",
    },
    {
      q: "How long until I see results?",
      a: "Local cleanup and answer structure are visible inside thirty days. Real movement inside AI recommendations — the part that puts your name on shortlists — typically starts compounding between month two and month four. Anyone promising faster is either lying or doesn't understand how these systems work.",
    },
    {
      q: "Do you do the work, or hand me a strategy?",
      a: "We do the work. Strategy and hands-on implementation across all six layers are both included in the retainer. You're not handed a PDF and told to figure it out. Heavy custom development is the only exception, and we'll tell you plainly whether it's needed before anything gets quoted.",
    },
    {
      q: "My website is old. Is that a problem?",
      a: "Usually a limitation, not a blocker. We can do most of the work on what you already have and flag anything structural that will cap your ceiling. If a rebuild is genuinely warranted, we'll tell you directly — and only then. We don't sell rebuilds. We don't make money on them.",
    },
    {
      q: "Can I cancel if it's not working?",
      a: "Yes. The retainer is month-to-month. No annual contract, no cancellation fee, no hostage clauses. If it's not working, stop paying — and the work we've already done on your local entity and indexing stays yours.",
    },
    {
      q: "Is this only for large roofing companies?",
      a: "No. Any established roofer with real revenue can justify the retainer on a single additional job per year. The question isn't whether you can afford $1,000 a month. It's whether you can afford to let a competitor in your market claim the position while you wait.",
    },
    {
      q: "What happens on the audit call?",
      a: "Thirty minutes. We walk your company through all six layers in real time — show you how AI tools currently describe your business, where you show up, where you don't, and which competitors are filling the gaps. You get the read whether you hire us or not. That's the whole call. No deck, no pitch, no follow-up chase.",
    },
  ];

  return (
    <>
      {/* NAV */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-inner">
          <a href="#" className="logo" aria-label="6 Signal">
            <img src="/6SIGNAL2.png" alt="6 Signal" className="logo-img" />
          </a>
          <div className="nav-links">
            <a href="#framework">The Six</a>
            <a href="#engagement">The Work</a>
            <a href="#pricing">Retainer</a>
            <a href="#faq">FAQ</a>
          </div>
          <a href="#book" className="nav-cta">Book the audit →</a>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <div className="hero-glow"></div>
        <div className="wrap hero-inner">
          <div className="hero-meta reveal">
            <span className="dot"></span>
            <span className="rail"></span>
            <span>AI Visibility · Built for Roofing Operators</span>
          </div>

          <h1 className="display reveal">
            <span className="line">Be the roofer</span>
            <span className="line"><em>AI recommends.</em></span>
            <span className="line dim">Not the one it skips.</span>
          </h1>

          <p className="hero-deck reveal">
            Your next customer isn't on page one of Google. She's asking ChatGPT at 10 p.m.,
            checking an AI Overview, then opening Maps. By the time she picks up the phone, the
            shortlist is already made.{" "}
            <strong>6 Signal gets your company onto that shortlist</strong> — across all six of
            the systems that now decide it.
          </p>

          <div className="hero-cta-row reveal">
            <a href="#book" className="btn btn-primary btn-lg">
              Book the visibility audit
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </a>
            <a href="#framework" className="btn btn-ghost btn-lg">How it works</a>
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

      {/* §02 SHIFT */}
      <section className="shift rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 02 — What's actually happening</span>
              <h2 className="display">
                The phone rings less.<br />
                <em>It isn't you — it's the funnel.</em>
              </h2>
            </div>
            <div className="right">
              The homeowner who used to type, scroll, and pick now runs her decision through
              five or six systems before anyone's phone rings. Most roofers are still optimized
              for one.
            </div>
          </div>

          <div className="shift-scene">
            <div className="caption">A real path to a roof job — 2026</div>
            <p>
              <strong>Tuesday, 10:14 p.m.</strong> A ceiling stain appears after a storm. She
              asks ChatGPT: <em>"Best roofer near [her city] for storm damage."</em> She gets
              three names in a paragraph.
            </p>
            <p className="dim">
              She checks Google Maps — two of the three show up with reviews and photos. She
              asks Siri for the closest one's number. She calls one. She books one.
            </p>
            <p>
              <strong>You were never in the conversation.</strong> Not because your work is
              worse. Because five systems never heard of you.
            </p>
          </div>

          <div className="shift-flow">
            <div className="stage">
              <div className="n">Stage 01</div>
              <h4>She asks an AI.</h4>
              <p>
                Generative tools and answer engines generate a named shortlist. Three companies.
                Sometimes two.
              </p>
            </div>
            <div className="arrow-icon">→</div>
            <div className="stage">
              <div className="n">Stage 02</div>
              <h4>She cross-checks local.</h4>
              <p>
                Maps, reviews, knowledge panels, directories. The names on the shortlist get
                verified or dropped.
              </p>
            </div>
            <div className="arrow-icon">→</div>
            <div className="stage">
              <div className="n">Stage 03</div>
              <h4>She picks up the phone.</h4>
              <p>
                One company. Of the dozen in her market, she only ever sees three.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MID CTA */}
      <section className="mid-cta">
        <div className="wrap">
          <h3>
            Every week this runs, <em>your market shrinks to three names.</em>
            <br />
            The audit tells you if one of them is yours.
          </h3>
          <a href="#book" className="btn btn-primary">
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
              <span className="idx">§ 03 — Why this hits roofers hardest</span>
              <h2 className="display">
                Roofing is local, trust-sensitive,<br />
                <em>and quietly rigged by machines now.</em>
              </h2>
            </div>
            <div className="right">
              Three things about this category make AI visibility more urgent for roofers than
              almost anyone else.
            </div>
          </div>

          <div className="why-list">
            <div className="why-row">
              <div className="r-idx">01 / 03</div>
              <div>
                <h3>Your market is a thirty-mile circle — and the circle is shrinking.</h3>
                <p>
                  AI recommendations narrow a local market to three names, sometimes two. In
                  that environment, being clear to machines isn't a marketing edge — it's the
                  difference between being one of the three and being invisible.
                </p>
              </div>
            </div>
            <div className="why-row">
              <div className="r-idx">02 / 03</div>
              <div>
                <h3>Your reputation is being assembled without you in the room.</h3>
                <p>
                  Reviews, citations, news mentions, scraped directory data — all of it is
                  feeding the AI systems that form a homeowner's first impression of your
                  company before you ever answer a call. Most roofers have never read what the
                  machines are saying about them.
                </p>
              </div>
            </div>
            <div className="why-row">
              <div className="r-idx">03 / 03</div>
              <div>
                <h3>Your competitors are mostly on brochure websites. This won't last.</h3>
                <p>
                  The gap is open right now because almost nobody in roofing has closed it. In
                  twenty-four months, that will no longer be true. The operators who move in
                  this window own the category when the rest of the market catches up.
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
              Each one is a different way your name gets recommended — or doesn't. Miss one and
              the shortlist gets made without you.
            </div>
          </div>

          {[
            { num: "01", acro: "GEO", title: "Generative Engine Optimization", body: "How ChatGPT, Gemini, Claude, and Perplexity describe your company", dim: "when a homeowner asks them for a recommendation." },
            { num: "02", acro: "PEO", title: "Prompt Engine Optimization", body: "Showing up inside the specific questions homeowners actually type —", dim: '"best roofer near me," "who handles storm damage," "trusted roofer in [city]."' },
            { num: "03", acro: "AEO", title: "Answer Engine Optimization", body: "Getting cited inside Google's AI Overviews and featured answers", dim: "— so your company is the one being quoted, not the competitor three ZIP codes over." },
            { num: "04", acro: "IEO", title: "Index Engine Optimization", body: "The invisible plumbing underneath everything —", dim: "the data labels every AI system uses to decide who your company is and what it does." },
            { num: "05", acro: "LEO", title: "Local Entity Optimization", body: "Maps, knowledge panels, local business graphs, directories", dim: "— whether your company exists, clearly and consistently, in every system a buyer might check." },
            { num: "06", acro: "VEO", title: "Voice Engine Optimization", body: "Being the name when a homeowner asks Siri, Alexa, or Google Assistant for a roofer", dim: "— hand on a leaking bucket, not a keyboard." },
          ].map((layer) => (
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

      {/* §05 ENGAGEMENT */}
      <section className="engagement rule" id="engagement">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 05 — Inside the retainer</span>
              <h2 className="display">
                Month one you see it.<br />
                <em>Month three you feel it.</em>
              </h2>
            </div>
            <div className="right">
              Five phases, run every month. Not a content calendar — a compounding system that
              makes machines describe your business the way you would.
            </div>
          </div>

          <div className="engage-table">
            {[
              { num: "01", phase: "Diagnose", title: "The full visibility read", body: "Where your company shows up across all six layers, where it doesn't, and which competitors are eating your category while you're not looking. You see it before we touch anything." },
              { num: "02", phase: "Align", title: "One identity, everywhere", body: "Maps, citations, directory listings, business graph entries — reconciled so every system sees the same company. This alone closes most of the gap most roofers have." },
              { num: "03", phase: "Rebuild", title: "Content the machines can quote", body: "Your site restructured so AI tools can pull clean, accurate answers about your services, markets, and credentials. When they cite a roofer, they cite yours." },
              { num: "04", phase: "Surface", title: "Inside the prompts that matter", body: "Deliberate work to get your company named in the AI recommendations for the specific questions your customers ask in your market. This is the lead generator inside the retainer." },
              { num: "05", phase: "Compound", title: "Track, report, sharpen", body: "Monthly read across every layer. What moved, what didn't, what's next. One call a month, one roadmap, direct access to the operator running your account." },
            ].map((row) => (
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
              <span className="idx">§ 06 — What you get</span>
              <h2 className="display">
                Four things.<br />
                <em>All of them show up on your phone.</em>
              </h2>
            </div>
            <div className="right">
              Not rankings. Not a traffic chart. The four things that actually move for a
              roofing business when visibility gets handled right.
            </div>
          </div>

          <div className="outcomes-list">
            {[
              { num: "01", text: "Your name gets spoken by AI when homeowners ask.", proof: "A homeowner types \"best roofer near me\" into ChatGPT — your company is one of the three named." },
              { num: "02", text: "Homeowners call you already convinced.", proof: "\"Three different places told me you were the one to call.\" Fewer price shoppers. Shorter sales cycle." },
              { num: "03", text: "Maps, voice, and directories finally agree on who you are.", proof: "One address. One phone. One company story. No more leads routed to the wrong number or lost to a duplicate listing." },
              { num: "04", text: "Your category position hardens every month.", proof: "Every month your name gets cited more, your competitors get cited less, and the gap becomes harder to close." },
            ].map((o) => (
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
                <em>Most of your options haven't.</em>
              </h2>
            </div>
            <div className="right">
              If you've already talked to an SEO agency and something felt off, this is
              probably why.
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
              The problem is that rebuilding a firm around generative AI, voice, prompt
              visibility, and local entity work means retraining an entire team —{" "}
              <span className="dim">
                which is why most agencies will keep selling you the same service they've
                always sold,
              </span>{" "}
              and hoping you don't notice that the ground under it has moved.
            </p>
            <p>
              <em>6 Signal isn't an SEO agency with a new deck.</em> It's a visibility practice
              designed from day one for how decisions actually get made now — specialized for
              roofing, limited to one operator per market, and built to work the six systems
              your customers are actually using tonight.
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
                <em>And who it isn't.</em>
              </h2>
            </div>
            <div className="right">
              A serious engagement for serious operators. Not a fit for everyone — and we'd
              rather say so now than three months in.
            </div>
          </div>

          <div className="fit-grid">
            <div className="fit-col yes">
              <div className="f-label">
                <span className="sym">+</span>Built for
              </div>
              <ul>
                <li>Roofers who want to own a market, not rent leads from it.</li>
                <li>Operators who think in years, not in weekly lead reports.</li>
                <li>Companies with real revenue and a real reason to protect their position.</li>
                <li>Owners who already know their digital presence is costing them jobs.</li>
              </ul>
            </div>
            <div className="fit-col no">
              <div className="f-label">
                <span className="sym">–</span>Not for
              </div>
              <ul>
                <li>Anyone chasing the cheapest line item on a marketing spreadsheet.</li>
                <li>Companies expecting leads inside thirty days.</li>
                <li>Owners who want to outsource the thinking and disappear.</li>
                <li>Firms already working with a partner they genuinely trust.</li>
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
              Flat retainer. No tiers. No setup fees. No upsell path. If the audit says 6
              Signal isn't the right call for your market, we'll tell you — and you still keep
              the audit.
            </div>
          </div>

          <div className="pricing-core">
            <div className="p-eyebrow">The 6 Signal Retainer</div>
            <div className="p-number">
              <span className="dollar">$</span>1,000
              <span className="mo">/ month</span>
            </div>
            <div className="p-sub">
              One roofing company per market.{" "}
              <em>If your territory isn't taken yet, it should be yours.</em>
            </div>
            <div className="p-cta">
              <a href="#book" className="btn btn-primary btn-lg">
                Claim your market
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
            </div>
            <div className="p-guarantee">
              Month-to-month · Cancel anytime · First 30 days on us if we don't ship the audit
            </div>
          </div>

          <div className="pricing-detail">
            <div className="pricing-note">
              <p>
                <span className="highlight">
                  We only take one roofing client per local market
                </span>{" "}
                — which means the retainer is structurally never competing with your own work.
              </p>
              <p className="italic" style={{ marginTop: "20px" }}>
                If your market is still open and you want it, book the audit. If it's already
                taken, the call tells you that in thirty seconds and you get the visibility
                read regardless.
              </p>
            </div>

            <div className="included">
              <h4>Included every month</h4>
              <div>Full visibility audit across all six layers</div>
              <div>One-identity local cleanup (maps, listings, citations)</div>
              <div>Answer-ready content across your site</div>
              <div>Machine-readable indexing (the invisible plumbing)</div>
              <div>Prompt and recommendation work — the lead engine</div>
              <div>Monthly signal report: what moved, what's next</div>
              <div>90-day rolling roadmap, revised every month</div>
              <div>Direct line to the operator running your account</div>
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
              Every serious operator asks the same seven questions before signing. Here they
              are.
            </div>
          </div>

          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`faq-item ${openFaq === i ? "open" : ""}`}>
                <button
                  className="faq-q"
                  onClick={() => toggleFaq(i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="q-idx">{String(i + 1).padStart(2, "0")}</span>
                  <span className="q-text">{faq.q}</span>
                  <span className="q-icon"></span>
                </button>
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
          <h2>
            Three roofers get recommended<br />
            in your market this week.<br />
            <em>Be one of them.</em>
          </h2>
          <p className="f-deck">
            Thirty-minute call. We walk your visibility across all six layers, show you exactly
            where the gaps are, and tell you honestly whether 6 Signal is the right fit. If
            your market is already taken, we'll tell you on the call.
          </p>
          <div className="f-cta">
            <a href="#" className="btn btn-primary btn-lg">
              Book the audit
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </a>
            <a href="mailto:hello@6signal.co" className="btn btn-ghost btn-lg">
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

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="footer-inner">
            <div className="footer-left">
              <a href="#" className="logo" aria-label="6 Signal">
                <img src="/6SIGNAL2.png" alt="6 Signal" className="logo-img" />
              </a>
              <p className="f-line">
                A specialized visibility practice for roofing operators who intend to own their
                category — not chase it.
              </p>
            </div>
            <div className="footer-right">
              <div className="footer-col">
                <div className="head">Site</div>
                <a href="#framework">The Six</a>
                <a href="#engagement">The Work</a>
                <a href="#pricing">Retainer</a>
                <a href="#faq">FAQ</a>
              </div>
              <div className="footer-col">
                <div className="head">Contact</div>
                <a href="#book">Book the audit</a>
                <a href="mailto:hello@6signal.co">hello@6signal.co</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© 6 Signal · All rights reserved</div>
            <div>Signal · Repetition · Reach</div>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="mobile-cta">
        <a href="#book">
          Book the visibility audit
          <svg width="14" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M0 5h14M10 1l4 4-4 4" />
          </svg>
        </a>
      </div>
    </>
  );
}
