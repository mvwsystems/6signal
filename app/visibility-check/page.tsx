"use client";
import { useState } from "react";
import Link from "next/link";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

const SIGNALS = [
  { acro: "GEO", label: "Generative Engine Optimization", desc: "Whether ChatGPT, Gemini, and Perplexity name you when a buyer asks who to call for your trade in your city." },
  { acro: "AEO", label: "Answer Engine Optimization", desc: "Whether your site answers the exact questions your buyers type before they ever click a result." },
  { acro: "LEO", label: "Local Entity Optimization", desc: "How consistent and complete your presence is across Maps, directories, and every local citation source AI reads." },
  { acro: "VEO", label: "Voice Engine Optimization", desc: "Whether you surface when someone asks Siri or Alexa for your trade in your city, hands-free." },
  { acro: "PEO", label: "Prompt Engine Optimization", desc: "Whether your business gets named when a buyer uses ChatGPT or Perplexity to find a specific provider." },
  { acro: "IEO", label: "Index Engine Optimization", desc: "How readable, structured, and citable your web presence is to AI systems that scan and summarize it." },
];

const FAQS = [
  {
    q: "Is this the same as the 30-minute strategy call?",
    a: "No. The $27 brief is a full 8-slide AI Visibility Intelligence Brief specific to your business, built by the same system 6Signal uses for retainer clients. The strategy call is a separate engagement. This is a written brief you keep.",
  },
  {
    q: "How long does it take?",
    a: "Under 60 seconds after payment. The brief generates immediately on screen — no waiting for an email, no scheduling required.",
  },
  {
    q: "What if I want help acting on the results?",
    a: "You can upgrade to a full strategy brief for $97 or book a 30-minute strategy call for $197 directly from your results page.",
  },
  {
    q: "Is this just a generic scorecard?",
    a: "No. Every brief is generated specifically for your business name, URL, trade, and city. The buyer journey analysis, citation gaps, and content gaps are specific to your market — not templated.",
  },
];

export default function VisibilityCheckPage() {
  useMicroInteractions();

  const [form, setForm] = useState({ name: "", url: "", trade: "", city: "", competitors: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Business name is required";
    if (!form.url.trim()) e.url = "Website URL is required";
    if (!form.trade.trim()) e.trade = "Trade / service category is required";
    if (!form.city.trim()) e.city = "City / market is required";
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);

    // Clear any stale results from a previous business before redirecting
    localStorage.removeItem("6sig_audit_result");
    localStorage.removeItem("6sig_strategy_result");
    localStorage.setItem("6sig_audit_data", JSON.stringify(form));

    window.location.href = "https://buy.stripe.com/28EeVebRQ3J1ghz6bf3ks0p";
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  return (
    <>
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
      <header className="vc-minimal-nav">
        <div className="wrap">
          <Link href="/" className="logo" aria-label="6 Signal">
            <img src="/6SIG_LOGO_FINAL_2.webp" alt="6 Signal" className="logo-img" />
          </Link>
        </div>
      </header>
      <main className="vc-page">

        {/* ── HERO ── */}
        <section className="vc-hero">
          <div className="wrap">
            <div className="vc-hero-content reveal">
              <span className="idx vc-eyebrow">AI Visibility Audit</span>
              <h1 className="display vc-h1">
                AI is already recommending contractors in your city. Find out if it's you —<br />
                <em>or the guy down the street.</em>
              </h1>
              <p className="vc-sub">
                Enter your business info. Pay $27. Get your full AI Visibility Intelligence Brief in under 60 seconds.
              </p>
            </div>
          </div>
        </section>

        {/* ── TRUST ROW ── */}
        <section className="vc-trust-section rule">
          <div className="wrap">
            <div className="vc-trust-row reveal">
              <div className="vc-trust-item">
                <div className="vc-trust-title">6-Signal Framework</div>
                <div className="vc-trust-sub">GEO · AEO · LEO · VEO · PEO · IEO</div>
              </div>
              <div className="vc-trust-item">
                <div className="vc-trust-title">60-Second Results</div>
                <div className="vc-trust-sub">Your brief generates immediately after payment</div>
              </div>
              <div className="vc-trust-item">
                <div className="vc-trust-title">Real Intelligence</div>
                <div className="vc-trust-sub">Specific to your business, your trade, your market</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHAT YOU'LL SEE ── */}
        <section className="vc-signals-section rule">
          <div className="wrap">
            <div className="sec-head">
              <div className="left">
                <span className="idx">What you'll see</span>
                <h2 className="display">
                  Your brief covers<br /><em>all six signals.</em>
                </h2>
              </div>
              <div className="right">
                Every score comes with a specific finding, the evidence behind it, and a named gap that explains exactly why you're not getting cited on that surface.
              </div>
            </div>
            <div className="vc-signal-grid">
              {SIGNALS.map(s => (
                <div className="vc-signal-card reveal" key={s.acro}>
                  <div className="vc-signal-acro">{s.acro}</div>
                  <div className="vc-signal-label">{s.label}</div>
                  <p className="vc-signal-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FORM / CHECKOUT ── */}
        <section className="vc-checkout-section rule" id="checkout">
          <div className="wrap">
            <p className="vc-urgency">Audit briefs reflect live AI index data — results shift weekly as AI systems update their local rankings.</p>
            <form className="vc-form reveal" onSubmit={handleSubmit} noValidate>
              <div className="vc-form-grid">
                <div className={`vc-field${errors.name ? " vc-field--error" : ""}`}>
                  <label className="vc-label">Business Name <span className="vc-req">*</span></label>
                  <input
                    className="vc-input"
                    type="text"
                    placeholder="Acme Roofing"
                    value={form.name}
                    onChange={e => handleChange("name", e.target.value)}
                    autoComplete="organization"
                  />
                  {errors.name && <span className="vc-error-msg">{errors.name}</span>}
                </div>

                <div className={`vc-field${errors.url ? " vc-field--error" : ""}`}>
                  <label className="vc-label">Website URL <span className="vc-req">*</span></label>
                  <input
                    className="vc-input"
                    type="text"
                    placeholder="https://acmeroofing.com"
                    value={form.url}
                    onChange={e => handleChange("url", e.target.value)}
                    autoComplete="url"
                  />
                  {errors.url && <span className="vc-error-msg">{errors.url}</span>}
                </div>

                <div className={`vc-field${errors.trade ? " vc-field--error" : ""}`}>
                  <label className="vc-label">Trade / Service Category <span className="vc-req">*</span></label>
                  <input
                    className="vc-input"
                    type="text"
                    placeholder="Roofing, Plumbing, HVAC, Electrical..."
                    value={form.trade}
                    onChange={e => handleChange("trade", e.target.value)}
                  />
                  {errors.trade && <span className="vc-error-msg">{errors.trade}</span>}
                </div>

                <div className={`vc-field${errors.city ? " vc-field--error" : ""}`}>
                  <label className="vc-label">City / Market <span className="vc-req">*</span></label>
                  <input
                    className="vc-input"
                    type="text"
                    placeholder="Fort Worth, TX"
                    value={form.city}
                    onChange={e => handleChange("city", e.target.value)}
                  />
                  {errors.city && <span className="vc-error-msg">{errors.city}</span>}
                </div>

                <div className="vc-field vc-field--full">
                  <label className="vc-label">Known Competitors <span className="vc-optional">(optional)</span></label>
                  <input
                    className="vc-input"
                    type="text"
                    placeholder="Competitor A, Competitor B..."
                    value={form.competitors}
                    onChange={e => handleChange("competitors", e.target.value)}
                  />
                </div>
              </div>

              <div className="vc-form-footer">
                <button
                  className="btn btn-primary btn-lg vc-submit"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Redirecting..." : "Get My Audit — $27"}
                </button>
                <p className="vc-form-note">
                  Secure payment via Stripe. Brief generates immediately after checkout.
                </p>
              </div>
            </form>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="vc-faq-section rule">
          <div className="wrap">
            <div className="sec-head">
              <div className="left">
                <span className="idx">Common questions</span>
                <h2 className="display">
                  Before you<br /><em>pay $27.</em>
                </h2>
              </div>
              <div className="right">
                The brief is the same system we use for retainer clients. The $27 version gives you the full intelligence output — no gatekeeping.
              </div>
            </div>
            <div className="faq-list">
              {FAQS.map((item, i) => (
                <div className="faq-item reveal" key={i}>
                  <div className="faq-q">
                    <span className="q-idx">{String(i + 1).padStart(2, "0")}</span>
                    <span className="q-text">{item.q}</span>
                    <span className="q-icon" aria-hidden />
                  </div>
                  <div className="faq-a">
                    <div className="faq-a-inner">{item.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section className="vc-bottom-cta rule">
          <div className="wrap">
            <div className="vc-bottom-inner reveal">
              <p className="idx">Ready?</p>
              <h2 className="display vc-bottom-h2">
                Know where you stand<br /><em>in 60 seconds.</em>
              </h2>
              <a
                href="#checkout"
                className="btn btn-primary btn-lg"
                onClick={e => { e.preventDefault(); document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" }); }}
              >
                Get My Audit — $27
              </a>
            </div>
          </div>
        </section>

        {/* ── GUARANTEE ── */}
        <section className="vc-guarantee-section rule">
          <div className="wrap">
            <div className="vc-guarantee-inner reveal">
              <div className="vc-guarantee-badge">
                <div className="vc-guarantee-badge-ring">
                  <div className="vc-guarantee-badge-inner">
                    <div className="vc-guarantee-badge-days">30</div>
                    <div className="vc-guarantee-badge-label">DAY</div>
                    <div className="vc-guarantee-badge-sub">GUARANTEE</div>
                  </div>
                </div>
              </div>
              <div className="vc-guarantee-copy">
                <h3 className="vc-guarantee-title">30-Day Money-Back Guarantee</h3>
                <p className="vc-guarantee-body">
                  If you don't feel the brief was worth $27, email us within 30 days and we'll refund you in full. No questions asked.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── META DISCLAIMER ── */}
        <footer className="vc-disclaimer-footer">
          <div className="wrap">
            <p className="vc-disclaimer-text">
              This site is not a part of the Facebook website or Facebook Inc. Additionally, this site is NOT endorsed by Facebook in any way. FACEBOOK is a trademark of META PLATFORMS, INC. Results mentioned are not typical. Individual results will vary based on business, market, trade, and implementation effort. The AI Visibility Intelligence Brief is an analytical tool — not a guarantee of leads, rankings, or revenue.
            </p>
          </div>
        </footer>

      </main>
    </>
  );
}
