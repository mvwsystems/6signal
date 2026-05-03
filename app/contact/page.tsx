"use client";
import { useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

const CALENDLY = "https://calendly.com/mvw-mattvincentwalker/business-growth-audit";
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
              <em>your website.</em>
            </h1>
            <p className="hero-deck reveal">
              Book a free 30-minute call, fill out the form, or email directly. We give
              straight answers and we don&rsquo;t pitch you on things you don&rsquo;t need.
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
                Book a time that works for you — we look at your current site, hear what
                you need, and give you a straight answer.
              </p>
              <a href={CALENDLY} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg" style={{ marginBottom: "48px" }}>
                Book a Free 30-Min Call
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
                  <span className="contact-way-label">Calendly</span>
                  <a
                    href={CALENDLY}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-way-val"
                  >
                    Book a time directly →
                  </a>
                </div>
                <div className="contact-way">
                  <span className="contact-way-label">Response</span>
                  <span className="contact-way-val">Same day, usually within a few hours</span>
                </div>
              </div>
            </div>

            {/* RIGHT — FORM */}
            <div className="contact-right">
              {submitted ? (
                <div className="form-success">
                  <h3>Got it. We&rsquo;ll be in touch.</h3>
                  <p>
                    Expect a response within a few hours. In the meantime, feel free to{" "}
                    <a href={CALENDLY} target="_blank" rel="noopener noreferrer" style={{ color: "#f5f5f3" }}>
                      book a call directly
                    </a>
                    .
                  </p>
                </div>
              ) : (
                <>
                  <h3>Or send a message</h3>
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
                        <option>General Contractor</option>
                        <option>Landscaping</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label htmlFor="message">What&rsquo;s going on with your website?</label>
                      <textarea
                        id="message"
                        name="message"
                        placeholder="Tell us what you have now and what you're trying to fix."
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
                      We respond same day. If it&rsquo;s urgent, book a call directly.
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
        <a href={CALENDLY} target="_blank" rel="noopener noreferrer">
          Book a Free Call
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
