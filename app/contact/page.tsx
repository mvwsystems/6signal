"use client";
import { useRef, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import AuditPopupButton from "../components/AuditPopupButton";
import { getAttribution } from "../lib/attribution";

const MAILTO = "hello@6signal.co";

export default function ContactPage() {
  useMicroInteractions();
  const [submitted, setSubmitted] = useState(false);
  // When the form appeared — bots submit in well under a second, humans don't.
  const renderedAt = useRef(Date.now());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (id: string) => (form.elements.namedItem(id) as HTMLInputElement | null)?.value ?? "";
    const name = get("name");
    const company = get("company");
    const email = get("email");
    const phone = get("phone");
    const trade = get("trade");
    const message = get("message");
    const hp = get("website");

    // Server-side send (works without a configured mail client). The old
    // mailto composer stays as the fallback if the API is unreachable.
    try {
      const r = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attribution: getAttribution(),
          name,
          company,
          email,
          phone,
          regarding: "general",
          message: [trade ? `Trade: ${trade}` : "", message].filter(Boolean).join("\n\n"),
          hp,
          elapsedMs: Date.now() - renderedAt.current,
        }),
      });
      if (r.ok) { setSubmitted(true); return; }
    } catch { /* fall through to mailto */ }

    const body = [
      name ? `Name: ${name}` : "",
      company ? `Company: ${company}` : "",
      email ? `Email: ${email}` : "",
      phone ? `Phone: ${phone}` : "",
      trade ? `Trade: ${trade}` : "",
      message ? `\nMessage:\n${message}` : "",
    ].filter(Boolean).join("\n");

    window.location.href = `mailto:${MAILTO}?subject=${encodeURIComponent("🔥 6 Signal 🔥")}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
  };

  return (
    <>
      <Nav />

      {/* INNER HERO */}
      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">Contact</span>
            <h1 className="display reveal">
              Let&rsquo;s talk about<br />
              <em>your market.</em>
            </h1>
            <p className="hero-deck reveal">
              Get the AI Visibility Audit or send a message. Straight answers — no pitch,
              no pressure, no follow-up chase if it&rsquo;s not the right fit.
            </p>
          </div>
        </div>
      </header>

      {/* CONTACT GRID */}
      <section className="contact-section rule">
        <div className="wrap">
          <div className="contact-grid reveal">
            {/* LEFT */}
            <div className="contact-left">
              <h2 className="display">
                The fastest way<br />
                <em>is the audit.</em>
              </h2>
              <p className="contact-deck">
                The $27 AI Visibility Audit answers more than a week of email
                back-and-forth. It runs your company through all six layers instantly —
                no call, no waiting on a calendar. The full read and priority list are
                yours regardless of what you decide next.
              </p>
              <AuditPopupButton className="btn btn-primary btn-lg" style={{ marginBottom: "48px" }}>
                Get the AI Visibility Audit
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </AuditPopupButton>
              <div className="contact-ways">
                <div className="contact-way">
                  <span className="contact-way-label">Email</span>
                  <a
                    href="mailto:hello@6signal.co?subject=%F0%9F%94%A5%206%20Signal%20%F0%9F%94%A5"
                    className="contact-way-val"
                  >
                    hello@6signal.co
                  </a>
                </div>
                <div className="contact-way">
                  <span className="contact-way-label">Response</span>
                  <span className="contact-way-val">Same day, usually within a few hours</span>
                </div>
                <div className="contact-way">
                  <span className="contact-way-label">Based</span>
                  <span className="contact-way-val">Dallas/Fort Worth, TX · Serving contractors in DFW and select markets beyond Texas</span>
                </div>
              </div>

              <div className="contact-steps">
                <div className="contact-step">
                  <div className="contact-step-num">01</div>
                  <div className="contact-step-body">
                    <strong>Get the $27 AI Visibility Audit</strong>
                    Tell us your trade, service area, and top competitors. Your six-layer audit generates instantly — no call, no waiting.
                  </div>
                </div>
                <div className="contact-step">
                  <div className="contact-step-num">02</div>
                  <div className="contact-step-body">
                    <strong>Go deeper with the $97 Strategy Brief</strong>
                    Optional. Turns your gaps into a specific implementation plan — still instant, still self-serve.
                  </div>
                </div>
                <div className="contact-step">
                  <div className="contact-step-num">03</div>
                  <div className="contact-step-body">
                    <strong>Book the $197 Strategy Call</strong>
                    For serious buyers: one hour live with Matt Vincent Walker, walking through your results in detail.
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — FORM */}
            <div className="contact-right">
              {submitted ? (
                <div className="form-success">
                  <h3>Got it. We&rsquo;ll be in touch.</h3>
                  <p>
                    Expect a response within a few hours. In the meantime, you can also{" "}
                    <a href="/visibility-check" style={{ color: "#f5f5f3" }}>
                      get your $27 AI Visibility Audit
                    </a>
                    {" "}— it generates instantly.
                  </p>
                </div>
              ) : (
                <>
                  <h3>Or send a message</h3>
                  <p className="form-note" style={{ marginTop: "8px", marginBottom: "24px" }}>
                    Sends directly to Matt — no email client needed. Same-day reply, usually within a few hours.
                  </p>
                  <form onSubmit={handleSubmit}>
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="name">Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          placeholder="Your name"
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="company">Company</label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          placeholder="Company name"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          placeholder="you@yourcompany.com"
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="phone">Phone</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          placeholder="(555) 000-0000"
                        />
                        <span style={{ display: "block", marginTop: "6px", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "10px", letterSpacing: "0.04em", color: "#7a7a78" }}>
                          Providing a number = consent to calls/texts about your request.
                          Reply STOP to opt out. <a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>Privacy</a>
                        </span>
                      </div>
                    </div>

                    <div className="form-field">
                      <label htmlFor="trade">Trade</label>
                      <select id="trade" name="trade">
                        <option value="">Select your trade</option>
                        <option>Roofing</option>
                        <option>Plumbing</option>
                        <option>HVAC</option>
                        <option>Electrical</option>
                        <option>Remodeling / General Contractor</option>
                        <option>Garage Doors</option>
                        <option>Landscaping</option>
                        <option>Tree Service</option>
                        <option>Pest Control</option>
                        <option>Foundation / Concrete</option>
                        <option>Commercial Contracting</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label htmlFor="message">Tell us about your market and what you&rsquo;re trying to fix.</label>
                      <textarea
                        id="message"
                        name="message"
                        placeholder="Your city, your trade, and what's not working right now."
                        required
                      />
                    </div>

                    {/* Honeypot — offscreen, unlabeled, never shown to humans. Named
                        "website" because form-filling bots reach for that field. */}
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }}
                    />

                    <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                      Send Message
                      <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <path d="M0 5h14M10 1l4 4-4 4" />
                      </svg>
                    </button>
                    <p className="form-note">
                      We respond same day — usually within a few hours.
                    </p>
                  </form>
                </>
              )}
            </div>
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
