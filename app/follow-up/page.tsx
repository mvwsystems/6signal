"use client";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

const CALENDLY = "https://calendly.com/mvw-mattvincentwalker/business-growth-audit";

const components = [
  {
    num: "01",
    title: "Missed-Call Text-Back",
    body: "When a call comes in and goes to voicemail, an automated text goes back instantly — with your name, a short message, and an easy way to re-engage. Most contractors lose leads here. This closes that gap.",
  },
  {
    num: "02",
    title: "Form Follow-Up",
    body: "Someone fills out your contact form at 11 p.m. The follow-up system sends a confirmation immediately and a personal follow-up in the morning — before you've had your coffee and before they've called someone else.",
  },
  {
    num: "03",
    title: "AI Receptionist",
    body: "A lightweight AI layer that handles inbound text inquiries — answering common questions, qualifying leads, and routing them to the right place. Not a bot. A system that sounds like your company and doesn't lose leads after hours.",
  },
];

export default function FollowUpPage() {
  useMicroInteractions();

  return (
    <>
      <Nav />

      {/* INNER HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">AI Follow-Up Layer</span>
            <h1 className="display reveal">
              The first company to respond<br />
              <em>usually wins.</em>
            </h1>
            <p className="hero-deck reveal">
              Most contractors are losing leads they already paid for — not to better
              competition, but to slow response times. The AI Follow-Up Layer fixes that.
              Missed calls, form submissions, and text inquiries handled automatically,
              immediately, and in a way that sounds like you.
            </p>
            <div className="hero-cta-row reveal">
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
                Book a Discovery Call
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
              <Link href="/websites" className="btn btn-ghost btn-lg">Start with the Website</Link>
            </div>
            <div className="hero-sig reveal">
              Secondary engagement — foundation first
            </div>
          </div>
        </div>
      </header>

      {/* PROBLEM */}
      <section className="problem-section rule">
        <div className="wrap">
          <span className="idx">The follow-up problem</span>
          <p className="problem-lead">
            A lead that doesn&rsquo;t get a response in 5 minutes is a lead that&rsquo;s{" "}
            <em>already calling someone else.</em>
          </p>
          <div className="problem-cols">
            <div className="problem-text">
              Studies consistently show that response time is the single biggest factor in
              converting inbound leads for service businesses. Not price. Not reviews. Not
              even brand.
              <br /><br />
              Most contractors can&rsquo;t respond in 5 minutes. They&rsquo;re on a job.
              They&rsquo;re driving. They see the call and mean to call back, but by then
              the buyer has already booked the company that picked up.
              <br /><br />
              <span className="dim">
                The follow-up layer doesn&rsquo;t replace you. It bridges the gap so no
                lead falls through between the moment they reach out and the moment you
                can actually talk.
              </span>
            </div>
            <div className="problem-bullets">
              {[
                "78% of buyers go with the first company that responds.",
                "The average contractor calls back 2–3 hours later. That&rsquo;s too slow.",
                "A missed call with no text back signals an unresponsive company.",
                "Form submissions at night get answered in the morning — by your competitor.",
                "You're running a job and can't check your phone. The lead moves on.",
              ].map((b, i) => (
                <div key={i} className="problem-bullet">{b}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COMPONENTS */}
      <section className="layers-section rule" id="components">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">What&rsquo;s in the layer</span>
              <h2 className="display">
                Three tools.<br />
                <em>One connected system.</em>
              </h2>
            </div>
            <div className="right">
              Each component handles a different gap in the lead-response chain. Together
              they make sure no inbound lead goes cold — even when you&rsquo;re unavailable.
            </div>
          </div>
          {components.map((c) => (
            <div className="layer-row reveal" key={c.num}>
              <div className="l-idx">{c.num}</div>
              <div className="l-acro" style={{ fontSize: "clamp(18px, 2.2vw, 28px)", letterSpacing: "-0.015em", lineHeight: 1.2 }}>{c.title}</div>
              <div className="l-body">
                <p>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NOTE */}
      <section className="rule" style={{ padding: "80px 0 100px" }}>
        <div className="wrap">
          <div className="pricing-detail reveal">
            <div className="pricing-note">
              <p>
                <span className="highlight">The follow-up layer is a secondary engagement.</span>{" "}
                It&rsquo;s most effective when paired with a professional website and clear
                visibility — so the leads coming in are already pre-sold on your company before
                they even reach out.
              </p>
              <p className="italic" style={{ marginTop: "20px" }}>
                Pricing is based on volume and configuration. Book a call and we&rsquo;ll walk
                you through exactly what the setup would look like for your business and what
                it costs.
              </p>
            </div>
            <div className="included">
              <h4>This engagement is right for you if:</h4>
              <div>You&rsquo;re getting inbound leads but losing some before you can respond</div>
              <div>You miss calls regularly while on jobs</div>
              <div>You want to automate follow-up without sounding robotic</div>
              <div>You understand this is a tool to support you, not replace your sales process</div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final" id="book">
        <div className="wrap">
          <div className="f-eyebrow">AI Follow-Up Layer</div>
          <h2 className="display">
            Stop losing leads<br />
            to slow response times.
          </h2>
          <p className="f-deck">
            Book a free 30-minute call. We&rsquo;ll look at where your leads are dropping
            off and show you exactly how the follow-up system would work for your company.
          </p>
          <div className="f-cta">
            <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">
              Book a Discovery Call
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </a>
            <a
              href="mailto:mvw@mattvincentwalker.com?subject=%F0%9F%94%A5%206%20Signal%20%F0%9F%94%A5"
              className="btn btn-ghost btn-lg"
            >
              Email Directly
            </a>
          </div>
          <div className="f-notes">
            <span>Secondary engagement</span>
            <span>Missed-call text-back</span>
            <span>Form follow-up</span>
            <span>AI receptionist</span>
          </div>
        </div>
      </section>

      <Footer />

      <div className="mobile-cta">
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer">
          Book a Call
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
