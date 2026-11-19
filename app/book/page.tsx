"use client";
import { useEffect } from "react";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import { trackEvent } from "../lib/fbq";
import { PHONE_DISPLAY, PHONE_HREF } from "../lib/site";

// The "6 Signal — Book an Appointment" event type (30 min, free, Zoom / phone /
// on-site). Embedded rather than linked so the booking URL stays on the domain.
// Calendly's colour params degrade silently if the plan does not support them —
// the embed still renders, just in Calendly's default light theme.
const CALENDLY_EMBED =
  "https://calendly.com/mvw-mattvincentwalker/6signal" +
  "?embed_domain=6signal.co&embed_type=Inline&hide_gdpr_banner=1" +
  "&background_color=060606&text_color=f5f5f3&primary_color=E6FF00";

const CALENDLY_DIRECT = "https://calendly.com/mvw-mattvincentwalker/6signal";

const covered = [
  "How work actually moves through your company today — call to cash, not the org chart version",
  "Where information gets retyped, lost, or delivered late",
  "Which rung to start on: brand and web, front office, visibility, or internal operations",
  "What the first system would cost to build and to run, in ranges",
  "Whether your trade and market are still open — one client per market per trade",
];

const notFor = [
  "A pitch deck. There isn't one.",
  "A free audit of your AI visibility — that's the $27 audit, and it's self-serve.",
  "A proposal on the call. Scoping comes first, and scoping is paid.",
];

export default function BookPage() {
  useMicroInteractions();

  // Calendly posts a message to the parent frame when a booking completes.
  // That — not the page view — is the conversion worth recording, so the
  // listener fires the event instead of firing one on mount.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!/^https:\/\/([a-z0-9-]+\.)?calendly\.com$/.test(e.origin)) return;
      const data = e.data as { event?: string } | null;
      if (data?.event === "calendly.event_scheduled") {
        trackEvent("Schedule", { content_name: "book-appointment" });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <>
      <Nav />

      {/* INNER HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">Book an appointment · 30 minutes · No charge</span>
            <h1 className="display reveal">
              Find the first seam<br />
              <em>worth closing.</em>
            </h1>
            <p className="hero-deck reveal">
              Thirty minutes on how work moves through your company — where information
              gets retyped, lost, or delivered late, and which system is worth connecting
              first. One operator. The person you talk to is the person who does the work.
              No pitch, and no follow-up chase if it isn&rsquo;t a fit.
            </p>
            <div className="hero-cta-row reveal">
              <a href="#calendar" className="btn btn-primary btn-lg">
                Pick a Time
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
              <Link href="/capabilities" className="btn btn-ghost btn-lg">See the Climb</Link>
            </div>
          </div>
        </div>
      </header>

      {/* CALENDAR */}
      <section className="book-section rule" id="calendar">
        <div className="wrap">
          <div className="sec-head">
            <div className="left">
              <span className="idx">The calendar</span>
              <h2 className="display">
                Pick a time.<br />
                <em>That&rsquo;s the whole step.</em>
              </h2>
            </div>
            <div className="right">
              Zoom, a phone call, or your office if you&rsquo;re in Dallas&ndash;Fort Worth —
              choose when you book. If you run $10M or more in revenue, ask about the free
              on-site AI team training while we&rsquo;re on the call.
            </div>
          </div>

          <div className="book-embed reveal">
            <iframe
              src={CALENDLY_EMBED}
              title="Book a 30-minute appointment with Matt Vincent Walker"
              loading="lazy"
            />
          </div>

          <p className="book-fallback">
            Calendar not loading?{" "}
            <a href={CALENDLY_DIRECT} target="_blank" rel="noopener noreferrer">
              Open it in a new tab
            </a>
            , call{" "}
            <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>, or email{" "}
            <a href="mailto:hello@6signal.co?subject=%F0%9F%94%A5%206%20Signal%20%F0%9F%94%A5">
              hello@6signal.co
            </a>{" "}
            with two or three times that work.
          </p>
        </div>
      </section>

      {/* WHAT WE COVER */}
      <section className="problem-section rule">
        <div className="wrap">
          <span className="idx">What we cover</span>
          <p className="problem-lead">
            Thirty minutes is enough to find the bottleneck.{" "}
            <em>It is not enough to fix it.</em>
          </p>
          <div className="problem-cols">
            <div className="problem-text">
              The call is a working conversation, not a discovery script. You describe a
              normal week; we find the seam where the money or the hours leak out.
              <br /><br />
              If there&rsquo;s a clear next step, it&rsquo;s a paid scoping session —
              $500 remote or $1,000 on-site in DFW, credited in full toward the build if
              you move within 30 days. If there isn&rsquo;t one, you&rsquo;ll hear that
              instead.
              <br /><br />
              <span className="dim">
                Already know the problem is visibility — that AI engines name your
                competitors and not you? Skip the call. The{" "}
                <Link href="/visibility-check" style={{ color: "#f5f5f3", textDecoration: "underline" }}>
                  $27 audit
                </Link>{" "}
                answers that in minutes without a calendar.
              </span>
            </div>
            <div className="problem-bullets">
              {covered.map((c, i) => (
                <div key={i} className="problem-bullet">{c}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IT ISN'T */}
      <section className="book-notfor rule">
        <div className="wrap">
          <div className="sec-head reveal">
            <div className="left">
              <span className="idx">What it isn&rsquo;t</span>
              <h2 className="display">
                Three things<br />
                <em>this call is not.</em>
              </h2>
            </div>
            <div className="right">
              Said plainly so the thirty minutes stays useful for both of us.
            </div>
          </div>
          <div className="feat-list reveal">
            {notFor.map((n, i) => (
              <div key={i} className="feat-item">{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final">
        <div className="wrap">
          <div className="f-eyebrow">Book an appointment</div>
          <h2 className="display">
            One operator.<br />
            Thirty minutes.
          </h2>
          <p className="f-deck">
            No charge, no pitch, and a straight answer on whether there&rsquo;s work here
            worth doing.
          </p>
          <div className="f-cta">
            <a href="#calendar" className="btn btn-primary btn-lg">
              Pick a Time
              <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M0 5h14M10 1l4 4-4 4" />
              </svg>
            </a>
            <a href={PHONE_HREF} className="btn btn-ghost btn-lg">
              Call {PHONE_DISPLAY}
            </a>
            <a
              href="mailto:hello@6signal.co?subject=%F0%9F%94%A5%206%20Signal%20%F0%9F%94%A5"
              className="btn btn-ghost btn-lg"
            >
              Email Directly
            </a>
          </div>
          <div className="f-notes">
            <span>30 minutes</span>
            <span>No charge</span>
            <span>Zoom, phone, or on-site</span>
            <span>Dallas&ndash;Fort Worth</span>
          </div>
        </div>
      </section>

      <Footer />

      <div className="mobile-cta">
        <a href="#calendar">
          Pick a Time
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
