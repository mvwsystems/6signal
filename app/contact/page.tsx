"use client";
import { useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import { AUDIT_INTAKE_URL } from "@/app/lib/links";

const MAILTO = "mvw@mattvincentwalker.com";

export default function ContactPage() {
  useMicroInteractions();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const get = (id: string) => (form.elements.namedItem(id) as HTMLInputElement | null)?.value ?? "";
    const name = get("name");
    const company = get("company");
    const phone = get("phone");
    const trade = get("trade");
    const message = get("message");

    const body = [
      name ? `Name: ${name}` : "",
      company ? `Company: ${company}` : "",
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
              Book the visibility audit, fill out the form, or email directly. Straight
              answers — no pitch, no pressure, no follow-up chase if it&rsquo;s not the
              right fit.
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
                <em>is a call.</em>
              </h2>
              <p className="contact-deck">
                Thirty minutes on a call does more than a week of email back-and-forth.
                We run the pre-audit before the call, then walk through the findings with
                you live — layer by layer. You leave with the full read regardless of
                what you decide.
              </p>
              <a href={AUDIT_INTAKE_URL} className="btn btn-primary btn-lg" style={{ marginBottom: "48px" }}>
                Book the Visibility Audit
                <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M0 5h14M10 1l4 4-4 4" />
                </svg>
              </a>
              <div className="contact-ways">
                <div className="contact-way">
                  <span className="contact-way-label">Email</span>
                  <a
                    href="mailto:mvw@mattvincentwalker.com?subject=%F0%9F%94%A5%206%20Signal%20%F0%9F%94%A5"
                    className="contact-way-val"
                  >
                    mvw@mattvincentwalker.com
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
                    <strong>Complete the intake</strong>
                    Tell us your trade, service area, and top competitors. Takes a few minutes — the scheduling link appears right after.
                  </div>
                </div>
                <div className="contact-step">
                  <div className="contact-step-num">02</div>
                  <div className="contact-step-body">
                    <strong>Pre-audit</strong>
                    Before the call, we run your company through all six visibility layers. Your top competitors get the same read.
                  </div>
                </div>
                <div className="contact-step">
                  <div className="contact-step-num">03</div>
                  <div className="contact-step-body">
                    <strong>Readout</strong>
                    30 minutes on video. We walk through the findings — layer by layer, gap by gap. Full priority list is yours to keep regardless of what you decide.
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
                    <a href={AUDIT_INTAKE_URL} style={{ color: "#f5f5f3" }}>
                      complete the intake
                    </a>
                    {" "}and schedule your readout.
                  </p>
                </div>
              ) : (
                <>
                  <h3>Or send a message</h3>
                  <p className="form-note" style={{ marginTop: "8px", marginBottom: "24px" }}>
                    Clicking Send opens your email client with these details pre-filled — the message sends from your address.
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

                    <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                      Send Message
                      <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                        <path d="M0 5h14M10 1l4 4-4 4" />
                      </svg>
                    </button>
                    <p className="form-note">
                      We respond same day — if it&rsquo;s urgent, book a call directly.
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
        <a href={AUDIT_INTAKE_URL}>
          Book the Audit
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
