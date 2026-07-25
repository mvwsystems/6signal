"use client";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

const TRAINING_MAILTO = "/inquire?about=training";
const SCOPING_MAILTO = "/inquire?about=stabilize";

const systems = [
  {
    num: "01",
    title: "AI receptionist & voice",
    body: "A voice agent that answers when you can't — after hours, mid-job, second line ringing. Trained on your services, your service area, your booking rules. Every call answered, logged, and routed.",
  },
  {
    num: "02",
    title: "Missed-call text-back & booking",
    body: "The call you miss gets a text in seconds, not a voicemail nobody checks. Booking flows that turn an answered inquiry into a scheduled job without owner involvement.",
  },
  {
    num: "03",
    title: "Email sorting & drafted response",
    body: "Inbox triage that classifies what's a lead, what's a supplier, what's noise — and drafts the reply for the ones that make you money. You approve; it sends.",
  },
  {
    num: "04",
    title: "Lead routing & follow-up",
    body: "Every lead gets qualified, routed to the right person, and followed up on a schedule — because the contractor who responds first usually wins, and the one who follows up twice wins the rest.",
  },
  {
    num: "05",
    title: "CRM pipeline",
    body: "One place where every inquiry, estimate, and job lives — so nothing leaks between the first ring and the invoice.",
  },
];

export default function StabilizePage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">The Climb · Rung 02 — Stabilize</span>
            <h1 className="display reveal">
              Stop losing the work<br />
              <em>your phone already brings you.</em>
            </h1>
            <p className="hero-deck reveal">
              Visibility fills the top of the funnel. Stabilize makes sure it converts —
              front-end AI systems that answer, book, sort, and follow up while you and
              your crew are on the job. Built for residential contractors and home
              services.
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
              Build fee + monthly run fee · Scoped per business · One operator, hands-on
            </div>
          </div>
        </div>
      </header>

      {/* THE PROBLEM */}
      <section className="problem-section rule">
        <div className="wrap">
          <span className="idx">The leak</span>
          <p className="problem-lead">
            Most contractors don&rsquo;t have a lead problem.{" "}
            <em>They have a response problem.</em>
          </p>
          <div className="problem-cols">
            <div className="problem-text">
              The call comes in while you&rsquo;re under a house. The email lands during a
              pour. The form submission sits until Sunday night. By then, the homeowner
              called the next name on the list — and the money you spent getting found
              paid for someone else&rsquo;s job.
              <br /><br />
              <span className="dim">
                Stabilize is the set of systems that catch what your visibility earns —
                before it leaks to whoever answered first.
              </span>
            </div>
            <div className="problem-bullets">
              {[
                "Missed calls going to voicemail nobody checks",
                "Leads answered hours later — after they booked elsewhere",
                "An inbox where real jobs sit under supplier noise",
                "Estimates that never get a follow-up",
                "No record of who called, who booked, and who vanished",
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
                Five systems.<br />
                <em>One front office that answers.</em>
              </h2>
            </div>
            <div className="right">
              Each system installs into the tools you already run — your phones, your
              inbox, your job software. Built and managed by the same operator, not
              handed to a support queue.
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
              <strong>These are not concepts.</strong> For X-Act Plumbing (Red Oak, TX) we
              built and operate a voice agent, email classification, and a HouseCall Pro
              workflow integration — running daily inside a real plumbing operation.
              <em> Published with client permission.</em>
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
              No discovery-call theater. We come to you, teach your team something
              useful, and only then talk about what&rsquo;s worth building.
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
                60–90 minutes, on-site, for your team: what AI changes for your trade,
                what it doesn&rsquo;t, and what&rsquo;s worth automating first. Free for
                established contractors — existing clients, referrals, and businesses at
                roughly $1M+ revenue. No pitch during the session.
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
                audit. $500 remote, $1,000 on-site (DFW). 100% credited toward the build
                if you engage within 30 days — serious buyers pre-pay their project;
                nobody buys a meeting.
              </div>
            </div>
            <div className="engage-row reveal">
              <div className="e-idx">03</div>
              <div className="e-title">
                <span className="phase">Build + run</span>
                Fixed-scope proposal
              </div>
              <div className="e-body">
                A written proposal, line by line: build fee for the setup, monthly run
                fee for keeping it working. Every system priced for the work — no
                open-ended contracts, no per-seat surprises.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">Stabilize</div>
          <h2 className="display">
            Your visibility earns the ring.<br />
            <em>Stabilize makes it a booked job.</em>
          </h2>
          <p className="f-deck">
            Start with the free team training, or go straight to scoping. Either way,
            you&rsquo;re talking to the operator who builds and runs the systems — not a
            sales rep.
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
            <span>One operator</span>
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
