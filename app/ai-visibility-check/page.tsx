"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import Nav from "../components/Nav";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import { trackEvent } from "../lib/fbq";
import { getAttribution } from "../lib/attribution";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignalSummaryItem {
  signal: string;
  finding: string;
}

interface FreeCheckResult {
  ai_response: string;
  found: boolean;
  signal_summary: SignalSummaryItem[];
}

// ─── Zone 2 data (preserved exactly) ─────────────────────────────────────────

const SIGNALS = [
  {
    num: "01",
    name: "GEO — Generative Engine Optimization",
    short: "Can AI recommend you?",
    body: "When someone asks ChatGPT, Gemini, or Perplexity who to call, your name is either in the answer or it isn't.",
  },
  {
    num: "02",
    name: "AEO — Answer Engine Optimization",
    short: "Do you show up in the answers above the results?",
    body: "Google answers questions directly now. Companies cited in those answers get seen before anyone scrolls.",
  },
  {
    num: "03",
    name: "LEO — Local Entity Optimization",
    short: "Do Maps, reviews, and directories agree about you?",
    body: "Every listing, citation, and review feeds the trust signals AI checks before recommending anyone. Inconsistent data — or thin, generic reviews — makes machines skip you.",
  },
  {
    num: "04",
    name: "VEO — Voice Engine Optimization",
    short: "Are you the answer when someone asks Siri or Alexa?",
    body: "Hands-free, urgent, local queries return one or two names. VEO makes sure yours is one of them.",
  },
  {
    num: "05",
    name: "PEO — Prompt Engine Optimization",
    short: "Do you surface in the searches your customers actually type?",
    body: "'Emergency AC repair open now.' 'Roofer for storm damage.' PEO covers the real query language.",
  },
  {
    num: "06",
    name: "IEO — Index Engine Optimization",
    short: "Can machines read and understand your site?",
    body: "Schema, structure, and clean business data so no system misses you or misreads you.",
  },
];

const CHECKLIST_GROUPS = [
  {
    label: "Website Clarity",
    items: [
      "Can someone understand what you do within five seconds?",
      "Do you clearly state your services?",
      "Do you clearly state your service area?",
      "Do your headlines say something specific?",
      "Do you explain who you help and what problem you solve?",
    ],
  },
  {
    label: "Service Pages",
    items: [
      "Do you have a separate page for each major service?",
      "Does each page answer common customer questions?",
      "Does each page include location relevance?",
      "Does each page include proof, photos, or examples?",
      "Does each page have a clear call to action?",
    ],
  },
  {
    label: "AI & Search Readiness",
    items: [
      "Does your site have useful FAQs?",
      "Does your site use structured headings?",
      "Does your site include schema markup?",
      "Does your site load quickly?",
      "Is your business information consistent everywhere?",
      "Can AI easily summarize what your business does?",
    ],
  },
  {
    label: "Local Trust",
    items: [
      "Do you have recent reviews?",
      "Do your reviews mention specific services?",
      "Do your reviews mention your location or service area?",
      "Are you listed correctly in relevant directories?",
      "Do you have project photos or real proof of work?",
    ],
  },
  {
    label: "Content",
    items: [
      "Do you answer the questions customers ask before calling?",
      "Do you have comparison content?",
      "Do you explain pricing factors?",
      "Do you explain warning signs?",
      "Do you explain your process?",
      "Do you publish helpful local content?",
    ],
  },
  {
    label: "Conversion",
    items: [
      "Is your phone number easy to find?",
      "Is your quote form simple?",
      "Do you have strong calls to action?",
      "Does your website work well on mobile?",
      "Do you follow up quickly with leads?",
      "Do you have tracking in place?",
    ],
  },
];

const FIRST_MOVES = [
  {
    step: "01",
    title: "Clarify your homepage",
    body: "Make it unmistakably clear what you do, who you serve, where you serve them, and why customers should call you — not a competitor.",
  },
  {
    step: "02",
    title: "Build or improve your top service pages",
    body: "Each major service needs its own dedicated page with specific language, local relevance, proof, and a clear conversion path.",
  },
  {
    step: "03",
    title: "Strengthen your Google Business Profile",
    body: "Your GBP is one of the first things AI reads. Services, categories, photos, posts, and reviews must be complete, accurate, and current.",
  },
  {
    step: "04",
    title: "Add customer-question content",
    body: "Publish answers to the questions your customers ask before they call. This is what AI references when building a recommendation shortlist.",
  },
  {
    step: "05",
    title: "Make proof impossible to miss",
    body: "Recent reviews mentioning specific services, real project photos, and verifiable outcomes are the proof signals AI and customers both trust.",
  },
];

const TRADES = [
  "Plumbing", "HVAC", "Roofing", "Electrical", "General Contracting",
  "Custom Home Builder", "Landscaping", "Pest Control",
  "Foundation / Concrete", "Tree Service", "Garage Doors", "Other",
];

const ARROW = (
  <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M0 5h14M10 1l4 4-4 4" />
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIVisibilityCheckPage() {
  useMicroInteractions();

  const [form, setForm] = useState({ name: "", trade: "", city: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FreeCheckResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Business name is required";
    if (!form.trade) e.trade = "Please select your trade";
    if (!form.city.trim()) e.city = "City / market is required";
    if (!form.email.trim()) e.email = "Email address is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiError(null);

    // Save form data to localStorage
    try {
      localStorage.setItem("6sig_free_check_data", JSON.stringify({
        name: form.name,
        trade: form.trade,
        city: form.city,
        email: form.email,
      }));
    } catch { /* ignore */ }

    try {
      const res = await fetch("/api/free-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, attribution: getAttribution() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setApiError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult(data as FreeCheckResult);
      trackEvent("Lead");

      // TODO: POST to /api/send-free-check-email
      // Sends the check result to the user's email via Kit/Resend
      // Input: { email, name, trade, city, ai_response, signal_summary, found }
      // Build this route separately
      fetch("/api/send-free-check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          name: form.name,
          trade: form.trade,
          city: form.city,
          ai_response: data.ai_response,
          signal_summary: data.signal_summary,
          found: data.found,
        }),
      }).catch(() => {});

    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("free-check-form")?.scrollIntoView({ behavior: "smooth" });
  };

  // Pre-populate audit data when user clicks $27 CTA
  const handleGoToPaid = useCallback(() => {
    try {
      const raw = localStorage.getItem("6sig_free_check_data");
      if (raw) {
        const { name, trade, city } = JSON.parse(raw);
        localStorage.setItem("6sig_audit_data", JSON.stringify({
          name: name ?? "",
          url: "",
          trade: trade ?? "",
          city: city ?? "",
          competitors: "",
        }));
      }
    } catch { /* ignore */ }
  }, []);

  // Two-option CTA block (used in Zone 2)
  const Zone2CTA = () => (
    <div className="lp-cta-pair">
      <Link
        href={`/visibility-check${form.trade ? `?trade=${encodeURIComponent(form.trade)}` : ""}`}
        className="btn btn-primary btn-lg"
        onClick={handleGoToPaid}
      >
        Get My AI Visibility Audit — $27 {ARROW}
      </Link>
      <a href="#free-check-form" className="btn btn-ghost" onClick={scrollToForm}>
        Check My Business Free →
      </a>
    </div>
  );

  return (
    <>
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
      <Nav />

      {/* ════════════════════════════════════════════════════════
          ZONE 1 — THE FREEBIE
      ════════════════════════════════════════════════════════ */}

      {/* ── STEP A: HERO ──────────────────────────────────────── */}
      <section className="avc-hero">
        <div className="hero-glow" />
        <div className="wrap avc-hero-inner">
          <span className="idx avc-hero-eyebrow">Free AI Visibility Check</span>
          <h1 className="display avc-hero-headline reveal">
            Find out if AI recommends your business —<br />
            <em>in 60 seconds, for free.</em>
          </h1>
          <p className="avc-hero-sub reveal">
            Enter your business below. We&rsquo;ll show you how AI engines answer when a
            customer asks for your trade in your city — and whether your name is in
            the answer set.
          </p>
          <div className="avc-hero-cta reveal">
            <button className="btn btn-primary btn-lg" onClick={scrollToForm}>
              Check My Business — Free {ARROW}
            </button>
          </div>
          <p className="idx avc-hero-trust reveal">
            No payment. No credit card. Instant result.
          </p>
        </div>
      </section>

      {/* ── STEP B: FREE CHECK FORM ───────────────────────────── */}
      <section className="avc-form-section rule" id="free-check-form">
        <div className="wrap">
          {!result ? (
            <>
              <div className="avc-form-head reveal">
                <span className="idx avc-form-step">Step 1 of 2 — Enter Your Business</span>
                <h2 className="display avc-form-headline">Who are you? Where do you work?</h2>
              </div>

              <form className="avc-form reveal" onSubmit={handleSubmit} noValidate>
                <div className="vc2-form-grid">
                  {/* Business Name */}
                  <div className={`vc2-field${errors.name ? " vc2-field--error" : ""}`}>
                    <label className="vc2-label">
                      Business Name <span className="vc2-req">*</span>
                    </label>
                    <input
                      className="vc2-input"
                      type="text"
                      placeholder="X-Act Plumbing"
                      value={form.name}
                      onChange={e => handleChange("name", e.target.value)}
                      autoComplete="organization"
                    />
                    {errors.name && <span className="vc2-error">{errors.name}</span>}
                  </div>

                  {/* Trade */}
                  <div className={`vc2-field${errors.trade ? " vc2-field--error" : ""}`}>
                    <label className="vc2-label">
                      Trade <span className="vc2-req">*</span>
                    </label>
                    <div className="vc2-select-wrap">
                      <select
                        className="vc2-select"
                        value={form.trade}
                        onChange={e => handleChange("trade", e.target.value)}
                      >
                        <option value="">Select your trade...</option>
                        {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <svg className="vc2-select-arrow" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <path d="M1 1l4 4 4-4" />
                      </svg>
                    </div>
                    {errors.trade && <span className="vc2-error">{errors.trade}</span>}
                  </div>

                  {/* City */}
                  <div className={`vc2-field${errors.city ? " vc2-field--error" : ""}`}>
                    <label className="vc2-label">
                      City / Market <span className="vc2-req">*</span>
                    </label>
                    <input
                      className="vc2-input"
                      type="text"
                      placeholder="Fort Worth, TX"
                      value={form.city}
                      onChange={e => handleChange("city", e.target.value)}
                    />
                    {errors.city && <span className="vc2-error">{errors.city}</span>}
                  </div>

                  {/* Email */}
                  <div className={`vc2-field${errors.email ? " vc2-field--error" : ""}`}>
                    <label className="vc2-label">
                      Email Address <span className="vc2-req">*</span>
                    </label>
                    <input
                      className="vc2-input"
                      type="email"
                      placeholder="you@yourbusiness.com"
                      value={form.email}
                      onChange={e => handleChange("email", e.target.value)}
                      autoComplete="email"
                    />
                    {errors.email && <span className="vc2-error">{errors.email}</span>}
                    <span className="idx avc-email-note">
                      Your check gets emailed to you. No spam. Unsubscribe anytime.
                    </span>
                  </div>
                </div>

                <div className="avc-form-footer">
                  <button
                    className={`btn btn-primary btn-lg avc-submit${loading ? " avc-submit--loading" : ""}`}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Running your check..." : "Show Me My AI Check → Free"}
                  </button>
                  {apiError && (
                    <p className="avc-api-error">{apiError}</p>
                  )}
                </div>
              </form>
            </>
          ) : null}

          {/* ── STEP C: RESULT DISPLAY ──────────────────────────── */}
          {result && (
            <div className="avc-result">
              {/* Top bar */}
              <div className="avc-result-topbar">
                <span className="idx">AI Visibility Check</span>
                <span className="idx avc-result-meta">
                  {form.name} · {form.trade} · {form.city}
                </span>
              </div>

              {/* Mock AI interface */}
              <div className="avc-mock-ai">
                <div className="idx avc-mock-label">How AI Answers When a Customer Asks:</div>
                <div className="avc-mock-query">
                  &ldquo;Who is the best {form.trade.toLowerCase()} in {form.city}?&rdquo;
                </div>
                <div className="avc-ai-response-block">
                  <div className="idx avc-ai-label">Projected AI Response</div>
                  <p className="avc-ai-text">{result.ai_response}</p>
                  <p className={`avc-found-line${result.found ? " avc-found-line--present" : " avc-found-line--absent"}`}>
                    {result.found
                      ? `${form.name} appears in this answer set.`
                      : `${form.name} does not appear in this answer set.`}
                  </p>
                  <p className="idx avc-ai-disclaimer">
                    Projection based on current AI recommendation patterns for your trade and market. Engines vary by user and day — the full audit maps where you stand across all of them.
                  </p>
                </div>
              </div>

              {/* Signal summary */}
              {result.signal_summary?.length > 0 && (
                <div className="avc-signal-summary">
                  {result.signal_summary.map((item, i) => (
                    <div className="avc-signal-item" key={i}>
                      <span className="idx avc-signal-name">{item.signal}</span>
                      <span className="avc-signal-finding">{item.finding}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Upsell block */}
              <div className="avc-upsell">
                <div className="idx avc-upsell-label">What This Means</div>
                <h3 className="avc-upsell-headline">
                  {result.found
                    ? "You're visible. Here's how to dominate."
                    : "You're invisible. Here's how to fix it."}
                </h3>
                <p className="avc-upsell-body">
                  This check shows the surface. Your AI Visibility Audit goes six
                  layers deep — buyer journey mapping, citation landscape, content gap analysis,
                  and a prioritized 90-day roadmap specific to {form.trade} businesses in {form.city}.
                </p>

                <div className="avc-upsell-opts">
                  <div className="avc-upsell-opt-wrap">
                    <Link
                      href={`/visibility-check${form.trade ? `?trade=${encodeURIComponent(form.trade)}` : ""}`}
                      className="btn btn-primary btn-lg avc-upsell-btn"
                      onClick={handleGoToPaid}
                    >
                      Get My AI Visibility Audit — $27 {ARROW}
                    </Link>
                    <p className="idx avc-upsell-opt-note">
                      Your business details carry forward — no re-entry needed.
                    </p>
                  </div>
                </div>
                <p className="idx avc-upsell-footer">
                  $27 · Full 6-signal analysis · PDF included · Results in 60 seconds
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          ZONE 2 — EDUCATION CONTENT (preserved exactly)
      ════════════════════════════════════════════════════════ */}

      {/* ── PROBLEM / THE SHIFT ───────────────────────────────── */}
      <section className="lp-section rule" id="what-we-check">
        <div className="wrap">
          <div className="lp-section-head reveal">
            <span className="lp-label">The Shift</span>
            <h2 className="lp-h2">
              Search used to send customers to options.<br />
              <em>AI sends them to conclusions.</em>
            </h2>
          </div>
          <div className="lp-two-col reveal">
            <div className="lp-col">
              <div className="lp-journey-label">The old customer journey</div>
              <div className="lp-journey">
                <div className="lp-journey-step">Google search</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step">Browse results + Maps</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step">Check reviews</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step">Visit website</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step lp-journey-step--final">Call and compare</div>
              </div>
            </div>
            <div className="lp-col">
              <div className="lp-journey-label lp-journey-label--new">The new customer journey</div>
              <div className="lp-journey">
                <div className="lp-journey-step">Ask ChatGPT, Siri, or Gemini</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step">AI reads + summarizes signals</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step">AI recommends 1–3 companies</div>
                <div className="lp-journey-arrow">↓</div>
                <div className="lp-journey-step lp-journey-step--final lp-journey-step--accent">Buyer calls one of them</div>
              </div>
            </div>
          </div>
          <blockquote className="lp-pull-quote reveal">
            Search used to send customers to options.<br />
            AI sends customers to conclusions.
          </blockquote>
        </div>
      </section>

      {/* ── STAKES / THE RISK ─────────────────────────────────── */}
      <section className="lp-section rule">
        <div className="wrap">
          <div className="lp-section-head reveal">
            <span className="lp-label">The Risk</span>
            <h2 className="lp-h2">
              You may not be losing leads because<br />
              <em>your service is worse.</em>
            </h2>
          </div>
          <p className="lp-section-deck reveal">
            You may be losing because AI does not understand why it should recommend you.
          </p>
          <ul className="lp-bullets reveal">
            <li>Your website may be too vague.</li>
            <li>Your service pages may be too thin.</li>
            <li>Your Google Business Profile may be incomplete.</li>
            <li>Your reviews may be generic.</li>
            <li>Your directories may be inconsistent.</li>
            <li>Your business may not answer customer questions online.</li>
            <li>Your competitors may be easier for AI to understand.</li>
          </ul>
          <div className="lp-cta-row reveal">
            <Zone2CTA />
          </div>
        </div>
      </section>

      {/* ── AI REPEATS WINNERS ────────────────────────────────── */}
      <section className="lp-section rule lp-section--alt">
        <div className="wrap">
          <h2 className="lp-h2 lp-h2--wide reveal">
            AI repeats the companies it can understand,<br />
            <em>verify, and trust.</em>
          </h2>
          <p className="lp-body-center reveal">
            AI systems compress choices into shortlists and surface the same companies repeatedly.
            Businesses with stronger, clearer signals become easier to recommend. Businesses with
            weak or vague signals become easier to skip — and the gap compounds over time.
          </p>
          <div className="lp-compound-block reveal">
            The companies that are already clear become more visible.<br />
            The companies that are unclear become easier to skip.
          </div>
        </div>
      </section>

      {/* ── SIX SIGNALS ───────────────────────────────────────── */}
      <section className="lp-section rule">
        <div className="wrap">
          <div className="lp-section-head reveal">
            <span className="lp-label">The 6Signal System</span>
            <h2 className="lp-h2">
              Six signals decide whether you get<br />
              <em>found, trusted, and chosen.</em>
            </h2>
          </div>
          <div className="lp-signals-list">
            {SIGNALS.map((s) => (
              <div className="lp-signal-row reveal" key={s.num}>
                <div className="lp-signal-meta">
                  <span className="lp-signal-num">{s.num}</span>
                  <span className="lp-signal-name">{s.name}</span>
                </div>
                <div className="lp-signal-body">
                  <p className="lp-signal-short">{s.short}</p>
                  <p className="lp-signal-detail">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-cta-row reveal">
            <Zone2CTA />
          </div>
        </div>
      </section>

      {/* ── CHECKLIST ─────────────────────────────────────────── */}
      <section className="lp-section rule">
        <div className="wrap">
          <div className="lp-section-head reveal">
            <span className="lp-label">The Check</span>
            <h2 className="lp-h2">The AI Visibility Checklist</h2>
          </div>
          <div className="lp-checklist-grid reveal">
            {CHECKLIST_GROUPS.map((group) => (
              <div className="lp-check-group" key={group.label}>
                <div className="lp-check-group-label">{group.label}</div>
                <ul className="lp-check-list">
                  {group.items.map((item) => (
                    <li className="lp-check-item" key={item}>
                      <span className="lp-check-box" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="lp-checklist-conclusion reveal">
            If you answered &ldquo;no&rdquo; to several of these, you probably do not have a traffic problem.
            You have a signal problem.
          </p>
        </div>
      </section>

      {/* ── FIRST MOVES ───────────────────────────────────────── */}
      <section className="lp-section rule">
        <div className="wrap">
          <div className="lp-section-head reveal">
            <span className="lp-label">The First Moves</span>
            <h2 className="lp-h2">
              Do not fix everything.<br />
              <em>Fix the signals that matter first.</em>
            </h2>
          </div>
          <div className="lp-steps">
            {FIRST_MOVES.map((move) => (
              <div className="lp-step reveal" key={move.step}>
                <div className="lp-step-num">{move.step}</div>
                <div className="lp-step-content">
                  <div className="lp-step-title">{move.title}</div>
                  <p className="lp-step-detail">{move.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUTHORITY ─────────────────────────────────────────── */}
      <section className="lp-section rule lp-section--alt">
        <div className="wrap">
          <h2 className="lp-h2 lp-h2--wide reveal">
            The businesses that win next will have<br />
            <em>the clearest signals.</em>
          </h2>
          <p className="lp-body-center reveal">
            They will not simply have the biggest ad budget. They will have the clearest message,
            strongest proof, best-structured presence, most useful answers, consistent reputation,
            and clearest conversion path.
          </p>
          <div className="lp-compound-block reveal">
            In the old world, being online was enough.<br />
            In the new world, being understood is the advantage.
          </div>
        </div>
      </section>

      {/* ── FINAL WARNING ─────────────────────────────────────── */}
      <section className="lp-section rule">
        <div className="wrap">
          <div className="lp-section-head reveal">
            <span className="lp-label lp-label--accent">Final Warning</span>
            <h2 className="lp-h2">
              Most owners will ignore this<br />
              <em>until the phone slows down.</em>
            </h2>
          </div>
          <div className="lp-warning-lines reveal">
            <p>They will blame the economy.</p>
            <p>They will blame ads.</p>
            <p>They will blame customers.</p>
            <p>Then they will scramble.</p>
          </div>
          <p className="lp-warning-close reveal">
            But the smart ones will fix the signal now.
          </p>
          <div className="lp-cta-row reveal">
            <Zone2CTA />
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="lp-final-section">
        <div className="wrap">
          <div className="lp-final-inner">
            <div className="lp-eyebrow lp-eyebrow--center">
              <span className="lp-eyebrow-dot" />
              Visibility Audit
            </div>
            <h2 className="lp-final-h2 reveal">
              Want to know if your business<br />
              <em>is part of the answer?</em>
            </h2>
            <p className="lp-final-deck reveal">
              6Signal reviews your current visibility across Google, AI search, voice search,
              Maps, reviews, directories, and your website — then shows you where your signal
              is strong, where it is weak, and what to fix first.
            </p>
            <div className="lp-final-cta-wrap reveal">
              <Zone2CTA />
            </div>
            <p className="lp-final-micro reveal">
              $27 · Full 6-signal analysis · PDF included · Results in 60 seconds
            </p>
          </div>
        </div>
      </section>

      {/* ── MINIMAL FOOTER ────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="wrap">
          <div className="lp-footer-inner">
            <Link href="/" aria-label="6Signal — return to main site">
              <img src="/6SIG_LOGO_FINAL_2.webp" alt="6Signal" className="lp-footer-logo" />
            </Link>
            <nav className="lp-footer-links" aria-label="Footer">
              <Link href="/" className="lp-footer-link">6signal.co</Link>
              <Link href="/contact" className="lp-footer-link">Contact</Link>
            </nav>
            <span className="lp-footer-copy">© 6Signal · All rights reserved</span>
          </div>
        </div>
      </footer>

      {/* ── MOBILE STICKY ─────────────────────────────────────── */}
      <div className="mobile-cta">
        <Link href="/visibility-check" className="btn" onClick={handleGoToPaid}>
          Get My Audit — $27
          <svg width="14" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M0 5h14M10 1l4 4-4 4" />
          </svg>
        </Link>
      </div>
    </>
  );
}
