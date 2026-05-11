"use client";

import Nav from "./Nav";
import Footer from "./Footer";
import AuditExamplesSection from "./proof/AuditExamplesSection";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import AuditPopupButton from "./AuditPopupButton";

const SIX_SIGNALS = [
  {
    num: "01",
    acro: "GEO",
    title: "Generative Engine Optimization",
    body: "When a GC, project owner, or procurement team asks ChatGPT for a qualified contractor in your scope category and your market,",
    dim: "does your company appear — with the right capabilities and credentials? Most commercial contractors don't. The ones that do aren't there by accident.",
  },
  {
    num: "02",
    acro: "PEO",
    title: "Prompt Engine Optimization",
    body: "'Licensed mechanical contractor [city].' 'Bonded commercial roofing contractor.' 'Civil contractor for utility work near me.' 'Who does tilt-wall construction in [region].'",
    dim: "PEO makes sure your company surfaces inside the specific commercial search language buyers and GCs use when assembling bid lists and vendor rosters.",
  },
  {
    num: "03",
    acro: "AEO",
    title: "Answer Engine Optimization",
    body: "Buyers research before they reach out — asking answer engines about contractor credibility, capability requirements, prequalification standards, and who operates in a given market.",
    dim: "AEO positions your company in those answers so your name appears during the research phase, before the formal outreach begins.",
  },
  {
    num: "04",
    acro: "IEO",
    title: "Index Engine Optimization",
    body: "Your scopes, certifications, bonding capacity, safety record, equipment, geographic footprint, and project history",
    dim: "— all need to be structured so AI systems and search engines read your capabilities accurately and match you to the right commercial queries. Vague website copy is invisible to machines.",
  },
  {
    num: "05",
    acro: "LEO",
    title: "Local Entity Optimization",
    body: "Dun & Bradstreet, BBB, state licensing boards, OSHA records, union directories, industry associations, Dodge Data — every record a buyer might check.",
    dim: "LEO reconciles all of them so your company presents consistently, regardless of which system a buyer uses to verify you.",
  },
  {
    num: "06",
    acro: "VEO",
    title: "Voice Engine Optimization",
    body: "Commercial buyers increasingly use AI assistants for quick capability lookups — who handles a given scope in a specific region, which contractors operate in a market.",
    dim: "VEO makes sure those queries return your company's name, tied correctly to your capabilities, geography, and credentials.",
  },
];

const GAPS = [
  "Capabilities described in vague language — no structured scope, trade category, or project-type data readable by search and AI systems",
  "Thin or absent project history — no machine-readable record of project types, sizes, or locations that establishes capability evidence",
  "Safety record, EMR, and certifications not structured in schema or GBP — high-trust signals invisible to buyers running due diligence",
  "Bonding capacity, licensing, and insurance limits not findable — buyers who cannot verify move on without reaching out",
  "Inconsistent company name, address, and descriptions across directories — creates doubt when buyers aggregate information from multiple sources",
  "No answer-ready content addressing common commercial buyer questions — leaving AI tools to describe your company in generic terms",
  "Licensing board, procurement, and industry association directories showing outdated or incomplete records",
  "Website thin on specifics — project types, scope ranges, service areas, and trade specialties not clearly structured for machine reading",
];

const WHO_FOR = [
  {
    type: "Specialty Subcontractors",
    body: "Mechanical, electrical, plumbing, fire suppression, glazing, structural steel — trades where prequalification is standard and credibility verification precedes every bid invitation.",
  },
  {
    type: "Civil & Site Contractors",
    body: "Earthwork, grading, utilities, paving — contractors evaluated on equipment capacity, bonding, safety record, and project scope history before any RFP is sent.",
  },
  {
    type: "Utility Contractors",
    body: "Gas, water, electric, telecom — regulated scopes where buyers verify license, bonding, safety standing, and regional authority before reaching out.",
  },
  {
    type: "Concrete & Masonry Contractors",
    body: "Structural, flatwork, tilt-wall, restoration — buyers evaluating for project-specific capability and past-performance evidence before committing to a bid list.",
  },
  {
    type: "Commercial Roofing Contractors",
    body: "Low-slope, metal, re-roofing, maintenance — a category where manufacturer certifications, warranty capacity, and project scale history drive vendor selection decisions.",
  },
  {
    type: "Industrial Service Contractors",
    body: "Maintenance, turnaround, plant services — contractors evaluated on safety culture, OSHA history, and specialized capability before any conversation begins.",
  },
  {
    type: "MEP & Building Systems Contractors",
    body: "Integrated mechanical, electrical, and plumbing contractors evaluated for whole-building scope capability, design-assist experience, and long-term facility relationships.",
  },
];

const FAQS = [
  {
    q: "We win work through relationships and GC referrals. Is this relevant?",
    a: "Relationship networks are valuable. But buyers increasingly run parallel verification through search and AI — even for referred contractors. A strong referral can lose to weak digital presence if the buyer cannot find enough to validate the recommendation. The audit shows exactly what they find when they verify you.",
  },
  {
    q: "We don't do residential work. Is 6 Signal built for commercial?",
    a: "The six-layer framework applies wherever buyers research before committing — which is increasingly true in commercial contracting. The specific work differs from residential: commercial focuses on capability signals, credential verification, project scope structure, and procurement database presence. The audit is run against commercial search behavior, not homeowner queries.",
  },
  {
    q: "Our projects are often confidential. Can we still build portfolio signals?",
    a: "Yes. Portfolio signals don't require client names or contract values. Project type, scope category, size ranges, and regional location are enough to structure searchable capability evidence without disclosing confidential details.",
  },
  {
    q: "We're already prequalified with the GCs we work with. Is this still useful?",
    a: "Prequalification with existing GCs protects your current pipeline. AI and search visibility expands it — reaching project owners, facility managers, and GCs who don't know you exist yet. The contractors whose names appear when buyers search for scope capability in a market receive bid invitations that never come through existing relationships.",
  },
  {
    q: "We operate in multiple markets. Does the retainer cover all of them?",
    a: "The retainer is structured per primary market. Multi-market contractors typically engage one retainer per region. The audit shows where your biggest credibility gaps are across your footprint — and we prioritize from there.",
  },
];

const outcomes = [
  {
    num: "01",
    text: "Your company surfaces when commercial buyers search for your scope in your market.",
    proof: "When a GC asks ChatGPT for a bonded mechanical contractor in your city, your company is one of the names that appears — with the right capabilities and credentials attached.",
  },
  {
    num: "02",
    text: "Your credibility survives buyer due diligence.",
    proof: "License, bonding, safety record, certifications, project history — all of it structured consistently across every system a buyer might check. No gaps. No conflicting information.",
  },
  {
    num: "03",
    text: "AI tools describe your company accurately — not generically.",
    proof: "After IEO work, what AI surfaces is specific, credible, and tied to the scopes you actually perform — not a generic 'general contractor' with no distinguishing detail.",
  },
  {
    num: "04",
    text: "You stop losing opportunities you never knew were available.",
    proof: "Commercial procurement is often quiet — bid lists assembled, vendors shortlisted, decisions made before any public notice. Better visibility means being included in conversations that currently happen without you.",
  },
];

function CommercialJsonLd() {
  const BASE = "https://6signal.co";

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Commercial Contractors", item: `${BASE}/commercial-contractors` },
    ],
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "AI Visibility Audit for Commercial Contractors",
    description:
      "6Signal audits commercial contractors across six AI and search credibility layers — GEO, PEO, AEO, IEO, LEO, and VEO — delivering a prioritized fix list for your local market.",
    provider: { "@type": "ProfessionalService", name: "6Signal", url: BASE },
    areaServed: "Dallas-Fort Worth and North Texas",
    serviceType: "AI Visibility Audit",
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(service) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />
    </>
  );
}

export default function CommercialPage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* HERO */}
      <header className="inner-hero">
        <div className="hero-glow" />
        <div className="wrap hero-inner">
          <div className="hero-meta reveal">
            <span className="dot" />
            <span className="rail" />
            <span>AI Visibility · Commercial Contractor Credibility</span>
          </div>

          <h1 className="display reveal">
            <span className="line">If project owners cannot verify you,</span>
            <span className="line">
              <em>they move on.</em>
            </span>
          </h1>

          <p className="hero-deck reveal">
            Commercial buyers — GCs, procurement teams, facility managers, project owners — research contractors before outreach. They search. They check AI tools. They verify licenses, credentials, safety records, and capabilities through whatever systems surface information about your company. If those systems return nothing credible, they find someone they can verify. 6 Signal builds the visibility infrastructure that makes your company findable, verifiable, and trusted before the first conversation.
          </p>

          <div className="hero-cta-row reveal">
            <AuditPopupButton className="btn btn-primary btn-lg">
              Book the Visibility Audit
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
            <a href="#signals" className="btn btn-ghost btn-lg">
              See how it works
            </a>
          </div>
          <div className="hero-sig reveal">
            Six-layer pre-audit · 30-minute readout · Market conflict check · Priority list yours to keep
          </div>
        </div>
      </header>

      {/* §02 THE COMMERCIAL PROBLEM */}
      <section className="shift rule">
        <div className="wrap">
          <div className="shift-scene">
            <div className="caption">A real path to a commercial contract — 2026</div>
            <p>
              <strong>
                A facilities manager is evaluating five specialty contractors for a maintenance contract. Before sending a single email, she searches each company name. She asks ChatGPT: &ldquo;What can you tell me about [company] as a commercial mechanical contractor?&rdquo; She checks Dun &amp; Bradstreet. She reviews their Google presence.
              </strong>
            </p>
            <p className="dim">
              Two companies have clear digital footprints — project history, certifications, reviews from commercial clients, consistent information across every system she checks. The other three are thin, inconsistent, or return almost nothing useful.
            </p>
            <p>
              <strong>
                You have fifteen years of commercial work, a clean safety record, and strong references. She never sent you the RFP. She could not find enough to justify the outreach.
              </strong>
            </p>
          </div>
        </div>
      </section>

      {/* §03 PREQUALIFICATION LAYER */}
      <section className="why rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 03 — The prequalification layer</span>
              <h2 className="display">
                Before the official process,
                <br />
                <em>there is an informal one.</em>
              </h2>
            </div>
            <div className="right">
              AI and search have become the pre-prequalification layer — the research buyers do before the formal vetting even begins.
            </div>
          </div>

          <div className="why-list">
            <div className="why-row">
              <div className="r-idx">01 / 03</div>
              <div>
                <h3>
                  Buyers research before they reach out — and AI is increasingly where that research starts.
                </h3>
                <p>
                  Commercial buyers do not cold-contact contractors they have not looked up. Before an RFP invitation, a bid list addition, or a subcontractor call, buyers run informal research — search engines, AI tools, industry databases. The contractors whose names, capabilities, and credentials surface credibly in that research receive the invitation. The ones who don&rsquo;t never know what they missed.
                </p>
              </div>
            </div>
            <div className="why-row">
              <div className="r-idx">02 / 03</div>
              <div>
                <h3>
                  AI tools are now used to compare contractors, assess reputation, and identify local capability.
                </h3>
                <p>
                  Procurement teams, GCs, and project owners use ChatGPT and search to research specific contractors by name, identify who handles certain scopes in a market, and assess whether a company is worth pursuing. This is happening faster in commercial than most contractors realize. The companies building credibility infrastructure now will be the ones on bid lists in two years. The ones who wait will be explaining gaps in their pipeline.
                </p>
              </div>
            </div>
            <div className="why-row">
              <div className="r-idx">03 / 03</div>
              <div>
                <h3>
                  Your digital footprint functions as a prequalification document — whether you intend it to or not.
                </h3>
                <p>
                  Every system a buyer checks forms part of their assessment of your company. Review history, project signal content, licensing records, safety data, and how consistently your information appears across directories — these are inputs into a credibility decision being made before you know you&rsquo;re being evaluated. The question is whether those inputs work in your favor or against you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MID CTA */}
      <section className="mid-cta">
        <div className="wrap">
          <h3>
            Bid opportunities are assembled before RFPs are published.
            <br />
            <em>The audit shows whether your company is in those conversations.</em>
          </h3>
          <AuditPopupButton className="btn btn-primary">
            Book the Visibility Audit
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
          <div className="sub">Pre-audit included · One commercial contractor per market</div>
        </div>
      </section>

      {/* §04 SIX COMMERCIAL SIGNALS */}
      <section className="layers-section" id="signals">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 04 — Six commercial visibility signals</span>
              <h2 className="display">
                Six systems shape
                <br />
                <em>what buyers find about you.</em>
              </h2>
            </div>
            <div className="right">
              Each one is a different layer of your commercial credibility infrastructure. A gap in any one of them becomes a gap in what buyers can verify before they decide whether to reach out.
            </div>
          </div>

          {SIX_SIGNALS.map((signal) => (
            <div className="layer-row" key={signal.num}>
              <div className="l-idx">{signal.num}</div>
              <div className="l-acro">{signal.acro}</div>
              <div className="l-body">
                <h3>{signal.title}</h3>
                <p>
                  {signal.body} <span className="dim">{signal.dim}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* §05 COMMON GAPS */}
      <section className="engagement rule" id="gaps">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 05 — Common gaps</span>
              <h2 className="display">
                What we find
                <br />
                <em>in most commercial contractors.</em>
              </h2>
            </div>
            <div className="right">
              These are the infrastructure gaps that cost commercial contractors bid invitations, vendor approvals, and subcontractor calls — without anyone ever explaining why.
            </div>
          </div>

          <div className="problem-bullets">
            {GAPS.map((gap, i) => (
              <div className="problem-bullet" key={i}>
                {gap}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §06 WHAT THE AUDIT SHOWS */}
      <section className="diff-section rule" id="audit">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 06 — The visibility audit</span>
              <h2 className="display">
                What a buyer sees
                <br />
                <em>when they research your company.</em>
              </h2>
            </div>
            <div className="right">
              The audit runs your company through the same systems a commercial buyer uses. You see exactly what they find — before you need to know it matters.
            </div>
          </div>

          <div className="diff-story">
            <div className="caption">What the audit covers</div>
            <p>
              Before the readout call, we run your company name and primary scope
              terms through AI tools, search engines, Maps, and commercial
              databases —{" "}
              <span className="dim">
                the same research path a GC, project owner, or procurement team
                takes when evaluating a contractor before outreach. You don&rsquo;t
                need to be on a call for this part.
              </span>
            </p>
            <p>
              We run the same pre-audit for your top local competitors. On the
              readout call, you see exactly what buyers find about them —{" "}
              <span className="dim">
                where they&rsquo;re better structured than you, and where the
                widest gaps are.
              </span>
            </p>
            <p>
              <em>
                We close with a prioritized list of the specific gaps with the
                most leverage — the ones most likely to determine whether you
                make a bid list or get filtered out before the RFP is written.
              </em>{" "}
              You keep the findings whether or not you continue with us.
            </p>
          </div>
        </div>
      </section>

      {/* §07 WHAT CHANGES */}
      <section className="outcomes-section">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 07 — What changes</span>
              <h2 className="display">
                Four outcomes.
                <br />
                <em>All of them affect your next opportunity.</em>
              </h2>
            </div>
            <div className="right">
              What moves for commercial contractors when visibility infrastructure is built correctly.
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

      {/* §08 WHO THIS IS FOR */}
      <section className="fit-section">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 08 — Who this is for</span>
              <h2 className="display">
                Built for commercial contractors
                <br />
                <em>who need to be verifiable before outreach.</em>
              </h2>
            </div>
            <div className="right">
              Specific contractor types where AI and search visibility directly affects bid inclusion, vendor approval, and subcontractor selection.
            </div>
          </div>

          <div className="why-list">
            {WHO_FOR.map((item, i) => (
              <div className="why-row" key={i}>
                <div className="r-idx">
                  {String(i + 1).padStart(2, "0")} / {String(WHO_FOR.length).padStart(2, "0")}
                </div>
                <div>
                  <h3>{item.type}</h3>
                  <p>{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="fit-grid" style={{ marginTop: "64px" }}>
            <div className="fit-col yes">
              <div className="f-label">
                <span className="sym">+</span>Built for
              </div>
              <ul>
                <li>
                  Commercial contractors who need to appear credible and
                  verifiable to buyers who research before they reach out.
                </li>
                <li>
                  Companies that depend on bid invitations and want more of
                  them — especially from buyers they haven&rsquo;t met yet.
                </li>
                <li>
                  Operators who know their reputation is stronger than their
                  digital presence reflects.
                </li>
                <li>
                  Contractors building for the next three to five years, not
                  just protecting this quarter&rsquo;s pipeline.
                </li>
              </ul>
            </div>
            <div className="fit-col no">
              <div className="f-label">
                <span className="sym">–</span>Not for
              </div>
              <ul>
                <li>
                  Residential-only contractors. This framework is built for
                  commercial buyers and commercial search behavior — not
                  homeowner emergency queries.
                </li>
                <li>
                  Contractors whose pipeline is fully saturated through existing
                  relationships with no interest in new buyer discovery.
                </li>
                <li>
                  Companies unwilling to invest in accurate, specific capability
                  content. Visibility infrastructure requires real information
                  to work with.
                </li>
                <li>
                  Anyone expecting pipeline results in thirty days. Commercial
                  credibility builds over quarters, not weeks.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <AuditExamplesSection
        trade="Commercial Contracting"
        maxItems={2}
        idx="What commercial audits find"
        headlineTop="Illustrative findings."
        headlineEm="Commercial credibility gaps."
        deckRight="Format examples of the types of issues that surface when we run a commercial contractor through the six-layer audit read."
      />

      {/* §09 PRICING */}
      <section className="pricing-section rule" id="pricing">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 09 — The retainer</span>
              <h2 className="display">
                One price.
                <br />
                <em>One market. Every month.</em>
              </h2>
            </div>
            <div className="right">
              Flat retainer. No tiers. No setup fees. No upsell path. One
              commercial contractor per market — the position is exclusive once
              it&rsquo;s taken.
            </div>
          </div>

          <div className="pricing-core">
            <div className="p-eyebrow">The 6 Signal Visibility Retainer</div>
            <div className="p-number">
              <span className="dollar">$</span>1,250
              <span className="mo">/ month</span>
            </div>
            <div className="p-sub">
              One commercial contractor per local market.{" "}
              <em>
                If your territory isn&rsquo;t taken yet, it should be yours.
              </em>
            </div>
            <div className="p-cta">
              <AuditPopupButton
                className="btn btn-primary btn-lg"
              >
                Book the audit
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
            <div className="p-guarantee">
              90-day minimum · Month-to-month after · Audit first — retainer only if
              you want to continue
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
                Honest questions.
                <br />
                <em>Answered directly.</em>
              </h2>
            </div>
            <div className="right">
              The questions commercial contractors ask before committing.
            </div>
          </div>

          <div className="faq-list">
            {FAQS.map((faq, i) => (
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
            Commercial buyers research
            <br />
            before they reach out.
            <br />
            <em>Make sure the systems tell the right story.</em>
          </h2>
          <p className="f-deck">
            Before the call, we run your company through the same research path
            a GC, procurement team, or project owner uses when vetting a
            contractor. On the 30-minute readout, we walk through what they find
            — credibility gaps, competitor positioning, and what it would take
            to fix both. Full findings are yours regardless of what you decide.
          </p>
          <div className="f-cta">
            <AuditPopupButton
              className="btn btn-primary btn-lg"
            >
              Book the Visibility Audit
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
          <div className="f-notes">
            <span>No-charge pre-audit</span>
            <span>30-minute readout</span>
            <span>No commitment required</span>
            <span>One contractor per market</span>
          </div>
        </div>
      </section>

      <Footer />

      <CommercialJsonLd />

      <div className="mobile-cta">
        <AuditPopupButton>
          Book the visibility audit
          <svg
            width="14"
            height="10"
            viewBox="0 0 16 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="M0 5h14M10 1l4 4-4 4" />
          </svg>
        </AuditPopupButton>
      </div>
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
    </>
  );
}
