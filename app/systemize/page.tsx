"use client";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

const TRAINING_MAILTO = "/inquire?about=training";
const SCOPING_MAILTO = "/inquire?about=systemize";

const systems = [
  {
    num: "01",
    title: "Bookkeeping & back-office automation",
    body: "Invoices matched, receipts filed, categorization drafted for your bookkeeper's approval — the paperwork that eats your evenings, handled by systems that don't get tired.",
  },
  {
    num: "02",
    title: "Field-to-office communication",
    body: "Job photos, notes, and change orders that flow from the crew's phones into the systems the office actually uses — instead of living in text threads nobody can find.",
  },
  {
    num: "03",
    title: "Fleet & job tracking",
    body: "Where the trucks are, where the jobs stand, what's blocked and why — one dashboard, fed by the tools you already run, readable in thirty seconds.",
  },
  {
    num: "04",
    title: "Estimating & bid support",
    body: "AI-assisted takeoff and estimating workflows that compress the time between plan receipt and bid submission — the same problem our Labs tools are built on.",
  },
  {
    num: "05",
    title: "Internal knowledge assistants",
    body: "Your pricing rules, your processes, your job history — searchable and answerable by your own private assistant, so the answer to 'how do we handle this' stops living in one person's head.",
  },
];

export default function SystemizePage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">The Climb · Rung 04 — Systemize</span>
            <h1 className="display reveal">
              Run the operation on systems.<br />
              <em>Not on willpower.</em>
            </h1>
            <p className="hero-deck reveal">
              AI infrastructure for the business behind the business — bookkeeping,
              field-to-office communication, fleet and job tracking, estimating.
              Built custom, integrated with the tools you already run, operated by
              the person who built it.
            </p>
            <div className="hero-cta-row reveal">
              <a href={TRAINING_MAILTO} className="btn btn-primary btn-lg">
                Request the free team training
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
              <a href="#systems" className="btn btn-ghost btn-lg">See the systems</a>
            </div>
            <div className="hero-sig reveal">
              Scoped per operation · Build fee + monthly run fee · Limited concurrent builds
            </div>
          </div>
        </div>
      </header>

      {/* THE PROBLEM */}
      <section className="problem-section rule">
        <div className="wrap">
          <span className="idx">The margin leak</span>
          <p className="problem-lead">
            The front office earns the job.{" "}
            <em>The back office decides what you keep.</em>
          </p>
          <div className="problem-cols">
            <div className="problem-text">
              Every contractor past a certain size runs into the same wall: the owner
              becomes the operating system. Every process routes through your head,
              your phone, your evenings. Growth stops being a marketing problem and
              becomes an infrastructure problem.
              <br /><br />
              <span className="dim">
                Systemize is custom AI infrastructure for that wall — built around
                your actual operation, not a SaaS subscription that almost fits.
              </span>
            </div>
            <div className="problem-bullets">
              {[
                "Bookkeeping that's weeks behind and lives in a shoebox",
                "Field crews and office staff working from different realities",
                "Estimating bottlenecked on one person's availability",
                "Job status that only exists in the owner's head",
                "Tools that don't talk to each other — so people re-type everything",
              ].map((b, i) => (
                <div key={i} className="problem-bullet">{b}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* THE SYSTEMS */}
      <section className="engagement rule" id="systems">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">What we build</span>
              <h2 className="display">
                Infrastructure,<br />
                <em>not subscriptions.</em>
              </h2>
            </div>
            <div className="right">
              Every build integrates with what you already run — HouseCall Pro,
              QuickBooks, your phones, your sheets. Custom where it matters,
              off-the-shelf where it doesn&rsquo;t.
            </div>
          </div>
          <div className="engage-table">
            {systems.map((s) => (
              <div className="engage-row reveal" key={s.num}>
                <div className="e-idx">{s.num}</div>
                <div className="e-title">{s.title}</div>
                <div className="e-body">{s.body}</div>
              </div>
            ))}
          </div>
          <div className="safety-note" style={{ marginTop: "48px" }}>
            <span className="safety-note-label">Built and running</span>
            <p>
              <strong>This practice ships software.</strong> A voice agent, email
              classification, and HouseCall Pro integration running daily inside X-Act
              Plumbing&rsquo;s operation (published with client permission) — plus{" "}
              <Link href="/capabilities" className="dim" style={{ textDecoration: "underline" }}>6 Signal Labs</Link>:
              Takeoff Copilot, in beta with utility contractors, and BidCore in
              development. The infrastructure work isn&rsquo;t a new offering wearing
              a new label — it&rsquo;s what we already build.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT STARTS */}
      <section className="engagement rule" id="how">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">How it starts</span>
              <h2 className="display">
                Training first.<br />
                <em>Then scope. Then build.</em>
              </h2>
            </div>
            <div className="right">
              Infrastructure is bought on trust, not landing pages. So we start by
              being useful in your building — and the scoping fee is credited, so
              nobody pays for a meeting.
            </div>
          </div>
          <div className="engage-table">
            <div className="engage-row reveal">
              <div className="e-idx">01</div>
              <div className="e-title">
                <span className="phase">Free · qualified</span>
                The AI team training
              </div>
              <div className="e-body">
                60–90 minutes, on-site, for your team: what AI actually changes for
                your trade, what it doesn&rsquo;t, and what&rsquo;s worth automating
                first. Free for established contractors — existing clients, referrals,
                and businesses at roughly $1M+ revenue. No pitch during the session.
              </div>
            </div>
            <div className="engage-row reveal">
              <div className="e-idx">02</div>
              <div className="e-title">
                <span className="phase">$500 / $1,000</span>
                Scoping — credited toward the build
              </div>
              <div className="e-body">
                The paid diagnostic: process mapping, systems inventory, integration
                audit — remote for $500, or a full on-site scoping day (DFW) for
                $1,000. 100% credited toward the build if you engage within 30 days.
              </div>
            </div>
            <div className="engage-row reveal">
              <div className="e-idx">03</div>
              <div className="e-title">
                <span className="phase">Build + run</span>
                Fixed-scope proposal
              </div>
              <div className="e-body">
                A written, line-by-line proposal: build fee for the system, monthly
                run fee for operating it. Priced per operation — and delivered by the
                operator who scoped it, not handed to a team you&rsquo;ve never met.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Systemize</div>
          <h2 className="display">
            You built the business.<br />
            <em>Now build the machine that runs it.</em>
          </h2>
          <p className="f-deck">
            Start with the free team training, or go straight to scoping. Either way,
            you&rsquo;re dealing with the operator who builds and runs the systems —
            not an account manager.
          </p>
          <div className="f-cta">
            <a href={TRAINING_MAILTO} className="btn btn-primary btn-lg">
              Request the free team training
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </a>
            <a href={SCOPING_MAILTO} className="btn btn-ghost btn-lg">
              Request scoping
            </a>
          </div>
          <div className="f-notes">
            <span>Training: free · qualified businesses</span>
            <span>Scoping: $500 remote / $1,000 on-site — credited</span>
            <span>Build fee + monthly run fee</span>
            <span>Limited concurrent builds</span>
          </div>
        </div>
      </section>

      <Footer />

      <div className="mobile-cta">
        <a href={TRAINING_MAILTO}>
          Request the training
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
