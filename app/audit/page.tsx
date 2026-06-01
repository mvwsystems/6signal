"use client";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import AuditExamplesSection from "../components/proof/AuditExamplesSection";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import AuditPopupButton from "../components/AuditPopupButton";

const reveals = [
  {
    num: "01",
    title: "What AI tools say about your company",
    body: "The actual language ChatGPT, Gemini, and Perplexity use when asked for contractors in your trade and city. Most contractors have never seen this. Most of what the machines say is wrong, outdated, or missing entirely.",
  },
  {
    num: "02",
    title: "Whether you appear in recommendation prompts",
    body: "We run the exact queries your customers are typing and voice-searching. You see whether your name appears in the answer — and where a competitor is filling your spot instead.",
  },
  {
    num: "03",
    title: "Whether Google and Maps understand your business",
    body: "Your GBP listing, service area, categories, photos, posts, and reviews — reviewed for accuracy and machine-readability against what AI systems actually parse when building a shortlist.",
  },
  {
    num: "04",
    title: "Whether your reviews support the work you want to be known for",
    body: "Reviews are data. The right ones confirm your specialty. The wrong ones — or the absence of them — confuse every AI system that reads them and assigns you categories you don't want.",
  },
  {
    num: "05",
    title: "Whether your listings and local entity data agree",
    body: "Name, address, phone, services, and hours across every directory. One conflict sends mixed signals to every system that cross-references them. We show you exactly where the conflicts are.",
  },
  {
    num: "06",
    title: "Whether your website is readable to AI and search systems",
    body: "Schema, service descriptions, location data, and site structure — assessed for what machines can actually parse versus what gets skipped or misread. Most sites have both.",
  },
  {
    num: "07",
    title: "Which competitors are showing up instead",
    body: "We run the same six-layer read for your top local competitors. You see who's on the shortlist in your market, which layers they've covered, and where the gap is widest.",
  },
  {
    num: "08",
    title: "What to fix first",
    body: "A ranked priority list — the specific changes with the most leverage. Not a generic best-practices list. A sequenced read of your actual gaps, starting with the ones that move the needle fastest.",
  },
];

const deliverables = [
  {
    num: "01",
    title: "Visibility readout",
    desc: "Your current standing across all six layers — GEO, PEO, AEO, IEO, LEO, VEO. Where you appear, where you don't, and how each compares to your local competitors.",
  },
  {
    num: "02",
    title: "Competitor comparison",
    desc: "A side-by-side of how your top local competitors are positioned across each layer. Where they're ahead, where they're weak, and where the gap in your market is widest.",
  },
  {
    num: "03",
    title: "Six-layer signal review",
    desc: "A layer-by-layer breakdown of your company's signal strength — what each system understands, what it's missing, and what's actively working against your position.",
  },
  {
    num: "04",
    title: "Priority fix list",
    desc: "The specific gaps with the most leverage, ranked. Not a generic checklist — a sequenced read of your actual situation and what to address in what order.",
  },
  {
    num: "05",
    title: "90-day visibility roadmap",
    desc: "If there's a fit for the retainer, this becomes the first 90 days of work. If there isn't, it's yours to take to whoever you work with. You keep it either way.",
  },
];

const notList = [
  "Not a generic SEO audit that grades your site on a 100-point scale",
  "Not a website design review or a critique of your branding",
  "Not a pitch for paid search, PPC, or ad spend",
  "Not a software demo or a licensing upsell",
  "Not an AI hype session about how everything is going to change",
  "Not a call where someone reads a PDF back to you",
];

const faqs = [
  {
    q: "How long does the audit take?",
    a: "The readout call is 30 minutes on video. Before the call, we run a six-layer pre-audit of your company — AI tools, Maps, voice, answer engines, directories, and local entity data. You don't need to attend the pre-audit. The 30 minutes with you is spent on findings.",
  },
  {
    q: "What do I need to provide?",
    a: "Complete the short intake — trade, service area, website, top services, and top competitors. Takes a few minutes. After submitting, you'll see the scheduling link. Pick a time and you're done.",
  },
  {
    q: "How much does it cost?",
    a: "The AI Visibility Intelligence Brief is $27. It covers all six visibility layers and delivers instant results specific to your business, trade, and market. If there's a fit for the retainer, we'll have that conversation after you've seen the full findings — not before.",
  },
  {
    q: "Is this the same as an SEO audit?",
    a: "No. An SEO audit looks at your website. This looks at what every system your buyers check actually understands about your company — AI tools, Maps, voice search, answer engines, directories. Your website is one input into six separate systems. We audit all six.",
  },
  {
    q: "Will you pitch me afterward?",
    a: "We'll tell you what we found. If there's a retainer opportunity, we'll say so once — clearly, without pressure. If it's not a fit, we'll say that instead. Either way, you leave with the full audit.",
  },
  {
    q: "What happens after the audit?",
    a: "You get the priority fix list and a six-layer read of your company's current position. If there's a retainer fit, we walk through what engagement looks like. If not, the audit is still yours. There's no follow-up chase.",
  },
  {
    q: "Do you work with my competitors?",
    a: "No. We take one contractor per market per trade — one roofer per city, one HVAC company per city. If your market is already taken, we'll tell you in the first few minutes. You still get the full audit read either way.",
  },
  {
    q: "Can this help if I already have an SEO company?",
    a: "Probably. Most SEO companies work on blue-link rankings — that's one layer. If they're not also handling GEO, prompt visibility, voice, answer engines, and local entity cleanup, there are five layers they're not touching. The audit shows you exactly which gaps exist and how wide they are.",
  },
];

export default function AuditPage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">The 6 Signal Visibility Audit</span>
            <h1 className="display reveal">
              See where your company<br />
              gets found —<br />
              <em>and where it gets skipped.</em>
            </h1>
            <p className="hero-deck reveal">
              The audit shows what AI tools, search engines, Maps, and voice systems
              understand about your company right now — and what they&rsquo;re saying
              instead when a homeowner asks for a contractor like you.
            </p>
            <div className="hero-cta-row reveal">
              <AuditPopupButton className="btn btn-primary btn-lg">
                Get the AI Visibility Brief
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </AuditPopupButton>
              <a href="#how-it-works" className="btn btn-ghost btn-lg">How it works</a>
            </div>
            <div className="hero-sig reveal">
              Complete the intake · Schedule your readout · Priority list yours to keep
            </div>
          </div>
        </div>
      </header>

      {/* §01 — WHAT THE AUDIT REVEALS */}
      <section className="audit-reveals-section rule" id="reveals">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 01 — What the audit shows you</span>
              <h2 className="display">
                Eight reads.<br />
                <em>Live. In thirty minutes.</em>
              </h2>
            </div>
            <div className="right">
              Before the readout call, we run your company through all six
              visibility layers. These are the eight things the pre-audit covers —
              across AI tools, Maps, search, directories, voice, and competitor
              position.
            </div>
          </div>
          <div className="reveals-grid">
            {reveals.map((r) => (
              <div className="reveal-item reveal" key={r.num}>
                <span className="reveal-num">{r.num}</span>
                <div className="reveal-title">{r.title}</div>
                <div className="reveal-body">{r.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AuditExamplesSection
        maxItems={6}
        idx="What the audit finds"
        headlineTop="Six trades."
        headlineEm="Six common gaps."
        deckRight="Illustrative format examples across trades — the types of findings that come up in an audit read. Not real client data, but accurate to the methodology."
      />

      {/* §02 — WHY THIS MATTERS */}
      <section className="shift rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 02 — Why the shortlist matters</span>
              <h2 className="display">
                Old search gave buyers a list.<br />
                <em>New search gives them three names.</em>
              </h2>
            </div>
            <div className="right">
              If you&rsquo;re not in those three names, you&rsquo;re not in the
              conversation. The homeowner who would have called you calls the three
              names the systems learned instead — not because they&rsquo;re better,
              but because the machines know them.
            </div>
          </div>
          <div className="shift-scene">
            <div className="caption">What changed — and why it hits contractors hardest</div>
            <p>
              Old search gave buyers ten blue links. They scrolled and compared. You could
              be number seven on the page and still get the call —{" "}
              <em>if your listing looked better than the ones above you.</em>
            </p>
            <p className="dim">
              New search gives buyers a shortlist. ChatGPT names three plumbers. Google&rsquo;s
              AI Overview surfaces two roofers. Siri reads one answer when someone asks for
              emergency HVAC with their hands full. The rest of the market doesn&rsquo;t appear.
            </p>
            <p>
              <strong>If you&rsquo;re not named, you&rsquo;re not considered.</strong> The
              person who would have called you calls the three names instead — not because
              those companies are better, but because the systems she checked learned their
              names and not yours.
            </p>
          </div>
          <div className="shift-flow">
            <div className="stage">
              <div className="n">Before</div>
              <h4>Ten results. Scroll and compare.</h4>
              <p>
                You could rank seventh and still get calls. Being present somewhere on the
                page was enough to be considered.
              </p>
            </div>
            <div className="arrow-icon">→</div>
            <div className="stage">
              <div className="n">Now</div>
              <h4>Three names. Sometimes two.</h4>
              <p>
                AI tools produce a shortlist before anyone scrolls. If your name
                isn&rsquo;t in it, the buyer never encounters you.
              </p>
            </div>
            <div className="arrow-icon">→</div>
            <div className="stage">
              <div className="n">The result</div>
              <h4>One contractor gets the call.</h4>
              <p>
                Of twelve companies in a market, three get named. One gets called.
                The audit shows where you stand in that read.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* §03 — WHAT YOU RECEIVE */}
      <section className="rule" id="what-you-get" style={{ paddingBottom: "100px" }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 03 — What you receive</span>
              <h2 className="display">
                Five deliverables.<br />
                <em>Yours after thirty minutes.</em>
              </h2>
            </div>
            <div className="right">
              Not a summary email. Not a score. A full read of your company&rsquo;s
              position across six layers — with competitor context and a ranked
              priority list for what to do about it.
            </div>
          </div>
          <div className="deliverables-list">
            {deliverables.map((d) => (
              <div className="deliverable-row reveal" key={d.num}>
                <div className="deliverable-num">{d.num}</div>
                <div className="deliverable-title">{d.title}</div>
                <div className="deliverable-desc">{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §04 — WHAT THIS IS NOT */}
      <section className="rule" style={{ paddingBottom: "100px" }}>
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 04 — What this is not</span>
              <h2 className="display">
                Worth saying clearly<br />
                <em>before we get on a call.</em>
              </h2>
            </div>
            <div className="right">
              There are a lot of audits, demos, and discovery calls that waste an hour
              of your time. This isn&rsquo;t any of those — so here&rsquo;s what
              it&rsquo;s not.
            </div>
          </div>
          <div className="not-list">
            {notList.map((item, i) => (
              <div className="not-item reveal" key={i}>{item}</div>
            ))}
          </div>
        </div>
      </section>

      {/* §05 — FIT */}
      <section className="fit-section rule">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 05 — Honest fit</span>
              <h2 className="display">
                Who this is for.<br />
                <em>And who it isn&rsquo;t.</em>
              </h2>
            </div>
            <div className="right">
              The audit is most useful for contractors who are serious about their
              market position and ready to see an honest read of where they stand.
            </div>
          </div>
          <div className="fit-grid">
            <div className="fit-col yes">
              <div className="f-label">
                <span className="sym">+</span>Built for
              </div>
              <ul>
                <li>Contractors doing good work who aren&rsquo;t sure buyers can find them across AI, Maps, and search.</li>
                <li>Companies watching competitors show up more often — in referrals, Maps, and now AI recommendations.</li>
                <li>Owners who&rsquo;ve relied on reputation and word-of-mouth and want to understand what AI systems say about them independently.</li>
                <li>Contractors who want to understand the visibility landscape before the market gets crowded.</li>
              </ul>
            </div>
            <div className="fit-col no">
              <div className="f-label">
                <span className="sym">–</span>Not for
              </div>
              <ul>
                <li>Companies looking for the cheapest lead vendor or a quick-fix marketing package.</li>
                <li>Anyone expecting guaranteed rankings or leads within 30 days.</li>
                <li>Owners who want to hand it off completely — the work requires some access and cooperation.</li>
                <li>Direct competitors of an existing 6 Signal client in the same market and trade.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW THE AUDIT WORKS */}
      <section className="engagement rule" id="how-it-works">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 06 — How the audit works</span>
              <h2 className="display">
                Five steps.<br />
                <em>Findings before the call.</em>
              </h2>
            </div>
            <div className="right">
              We run the six-layer pre-audit before we get on a call — so the
              30 minutes with you is a specific readout, not an improvised
              screen-share from scratch.
            </div>
          </div>
          <div className="engage-table">
            <div className="engage-row reveal">
              <div className="e-idx">01</div>
              <div className="e-title">
                <span className="phase">Intake</span>
                Complete the pre-audit intake
              </div>
              <div className="e-body">
                Tell us your trade, service area, website, top services, and
                top competitors. Takes a few minutes. This is what we use to
                run the six-layer read.
              </div>
            </div>
            <div className="engage-row reveal">
              <div className="e-idx">02</div>
              <div className="e-title">
                <span className="phase">Schedule</span>
                Schedule your readout
              </div>
              <div className="e-body">
                After the intake, choose a time for your 30-minute visibility
                readout. You&rsquo;ll see the scheduling link immediately after
                submitting.
              </div>
            </div>
            <div className="engage-row reveal">
              <div className="e-idx">03</div>
              <div className="e-title">
                <span className="phase">Pre-audit</span>
                We run the six-layer pre-audit
              </div>
              <div className="e-body">
                Before the call, we check AI search, prompt visibility, answer
                engines, local listings, machine-readable structure, and
                voice/search readiness — specific to your company and your
                market. Your competitors get the same read.
              </div>
            </div>
            <div className="engage-row reveal">
              <div className="e-idx">04</div>
              <div className="e-title">
                <span className="phase">Readout</span>
                We walk through the findings live
              </div>
              <div className="e-body">
                30 minutes on video. You see where your company gets found,
                where it gets skipped, who is showing up instead, and what to
                fix first — layer by layer, against your top competitors.
              </div>
            </div>
            <div className="engage-row reveal">
              <div className="e-idx">05</div>
              <div className="e-title">
                <span className="phase">Priority list</span>
                You leave with the findings
              </div>
              <div className="e-body">
                Ranked priority list, six-layer signal review, and competitor
                comparison — yours to keep regardless of what you decide. If
                there is a fit for the retainer, we explain what implementation
                would look like. If not, you still keep the full readout.
              </div>
            </div>
          </div>
          <div className="safety-note" style={{ marginTop: "48px" }}>
            <span className="safety-note-label">On the retainer conversation</span>
            <p>
              <strong>We show you the findings first.</strong> If there&rsquo;s
              a fit, we&rsquo;ll say so once — clearly, without pressure. If
              it&rsquo;s not a fit, we&rsquo;ll say that instead.{" "}
              <em>
                The full findings are yours either way. No follow-up if the
                answer is no.
              </em>
            </p>
          </div>
        </div>
      </section>

      {/* §07 — FINAL CTA / BOOKING */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Get the AI Visibility Brief</div>
          <h2 className="display">
            Pre-audit before the call.<br />
            Findings on the call.<br />
            <em>No commitment required.</em>
          </h2>
          <p className="f-deck">
            Complete the short pre-audit intake, then schedule your 30-minute
            visibility readout. We run the six-layer pre-audit before the call
            so your readout is specific, not generic — your company, your
            competitors, your market. The findings and priority list are yours
            regardless of what you decide next.
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

      {/* §07 — FAQ */}
      <section className="faq-section page-faq" id="faq">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">§ 08 — Straight answers</span>
              <h2 className="display">
                Questions about<br />
                <em>the audit.</em>
              </h2>
            </div>
            <div className="right">
              Every question a contractor has asked before booking — answered directly.
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
