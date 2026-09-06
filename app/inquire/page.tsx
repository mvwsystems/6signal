"use client";
import { useEffect, useRef, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import { getAttribution } from "../lib/attribution";

const REGARDING_OPTIONS = [
  { value: "start", label: "Start — Website & Brand" },
  { value: "stabilize", label: "Stabilize — Front-Office AI" },
  { value: "scale", label: "Scale — AI Visibility" },
  { value: "systemize", label: "Systemize — AI Infrastructure" },
  { value: "training", label: "Team Training (free · qualified)" },
  { value: "general", label: "Something else" },
];

const MESSAGE_HINTS: Record<string, string> = {
  start: "Tell us about the business — trade, service area, and what's wrong with the current site (or the link to it).",
  stabilize: "What's leaking? Missed calls, slow follow-up, inbox chaos — describe a normal week and where opportunities get lost.",
  scale: "Your trade, your market, and who seems to be getting the calls you want. If you've run the $27 audit, mention it.",
  systemize: "Describe the operation — team size, the tools you run (HouseCall Pro, QuickBooks, etc.), and the process eating the most owner time.",
  training: "Team size, location, and what you'd want your people to walk away understanding. We'll confirm qualification and propose times.",
  general: "Whatever's on your mind — trade, market, and what prompted you to reach out.",
};

export default function InquirePage() {
  useMicroInteractions();

  const [form, setForm] = useState({
    regarding: "general",
    name: "",
    company: "",
    email: "",
    phone: "",
    url: "",
    message: "",
    hp: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  // When the form appeared — bots submit in well under a second, humans don't.
  const renderedAt = useRef(Date.now());

  // Preselect the rung from ?about= (linked from the Climb pages).
  useEffect(() => {
    const about = new URLSearchParams(window.location.search).get("about");
    if (about && REGARDING_OPTIONS.some((o) => o.value === about)) {
      setForm((prev) => ({ ...prev, regarding: about }));
    }
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "A valid email is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setStatus("sending");
    try {
      const r = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, attribution: getAttribution(), elapsedMs: Date.now() - renderedAt.current }),
      });
      setStatus(r.ok ? "sent" : "failed");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <>
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
      <Nav />

      <header className="inner-hero">
        <div className="wrap">
          <div className="inner-hero-inner">
            <span className="idx reveal">Direct line</span>
            <h1 className="display reveal">
              Tell us where you are<br />
              <em>on the climb.</em>
            </h1>
            <p className="hero-deck reveal">
              This goes straight to Matt Vincent Walker — the operator, not a sales
              inbox. Expect a reply the same day, usually within a few hours.
            </p>
          </div>
        </div>
      </header>

      <section className="vc2-form-section rule" id="inquiry-form">
        <div className="wrap">
          {status === "sent" ? (
            <div className="form-success">
              <h3>Got it. You&rsquo;ll hear from Matt directly.</h3>
              <p>
                Same day, usually within a few hours. In the meantime, the{" "}
                <a href="/visibility-check" style={{ color: "#f5f5f3" }}>$27 AI Visibility Audit</a>{" "}
                is the fastest way to see where your business stands — it generates instantly.
              </p>
            </div>
          ) : (
            <form className="vc2-form reveal" onSubmit={handleSubmit} noValidate>
              <div className="vc2-form-grid">
                {/* Regarding */}
                <div className="vc2-field vc2-field--full">
                  <label className="vc2-label">
                    This is regarding <span className="vc2-req">*</span>
                  </label>
                  <div className="vc2-select-wrap">
                    <select
                      className="vc2-select"
                      value={form.regarding}
                      onChange={(e) => handleChange("regarding", e.target.value)}
                    >
                      {REGARDING_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <svg className="vc2-select-arrow" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M1 1l4 4 4-4" />
                    </svg>
                  </div>
                </div>

                {/* Name */}
                <div className={`vc2-field${errors.name ? " vc2-field--error" : ""}`}>
                  <label className="vc2-label">
                    Your Name <span className="vc2-req">*</span>
                  </label>
                  <input
                    className="vc2-input"
                    type="text"
                    placeholder="First and last"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    autoComplete="name"
                  />
                  {errors.name && <span className="vc2-error">{errors.name}</span>}
                </div>

                {/* Company */}
                <div className="vc2-field">
                  <label className="vc2-label">
                    Company <span className="vc2-optional">(optional)</span>
                  </label>
                  <input
                    className="vc2-input"
                    type="text"
                    placeholder="Acme Plumbing"
                    value={form.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    autoComplete="organization"
                  />
                </div>

                {/* Email */}
                <div className={`vc2-field${errors.email ? " vc2-field--error" : ""}`}>
                  <label className="vc2-label">
                    Email <span className="vc2-req">*</span>
                  </label>
                  <input
                    className="vc2-input"
                    type="email"
                    placeholder="you@yourbusiness.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    autoComplete="email"
                  />
                  {errors.email && <span className="vc2-error">{errors.email}</span>}
                </div>

                {/* Phone */}
                <div className="vc2-field">
                  <label className="vc2-label">
                    Phone <span className="vc2-optional">(optional)</span>
                  </label>
                  <input
                    className="vc2-input"
                    type="tel"
                    placeholder="(817) 555-0100"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    autoComplete="tel"
                  />
                  <span className="idx avc-email-note">
                    By providing your number you agree to receive calls and texts from
                    6 Signal about your request. Msg &amp; data rates may apply; reply
                    STOP to opt out. <a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>Privacy</a>
                  </span>
                </div>

                {/* URL */}
                <div className="vc2-field vc2-field--full">
                  <label className="vc2-label">
                    Website URL <span className="vc2-optional">(optional)</span>
                  </label>
                  <input
                    className="vc2-input"
                    type="text"
                    placeholder="https://yourbusiness.com"
                    value={form.url}
                    onChange={(e) => handleChange("url", e.target.value)}
                    autoComplete="url"
                  />
                </div>

                {/* Message */}
                <div className="vc2-field vc2-field--full">
                  <label className="vc2-label">
                    What&rsquo;s going on? <span className="vc2-optional">(optional — but it helps)</span>
                  </label>
                  <textarea
                    className="vc2-input"
                    rows={5}
                    placeholder={MESSAGE_HINTS[form.regarding]}
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    style={{ resize: "vertical" }}
                  />
                </div>

                {/* Honeypot — humans never see this */}
                <input
                  type="text"
                  value={form.hp}
                  onChange={(e) => handleChange("hp", e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }}
                />
              </div>

              <div className="vc2-form-footer">
                <button
                  className="btn btn-primary btn-lg vc2-submit"
                  type="submit"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Sending..." : "Send to Matt"}
                  {status !== "sending" && (
                    <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M0 5h14M10 1l4 4-4 4" />
                    </svg>
                  )}
                </button>
                <p className="vc2-form-note">
                  {status === "failed"
                    ? "Something went wrong — email hello@6signal.co directly and it will reach the same place."
                    : "Goes directly to the operator. No sales sequence, no list, no follow-up chase."}
                </p>
              </div>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
