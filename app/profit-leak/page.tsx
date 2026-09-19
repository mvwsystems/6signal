"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import Nav from "../components/Nav";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import { trackEvent } from "../lib/fbq";
import { getAttribution } from "../lib/attribution";
import { SECTIONS, QUESTION_COUNT, bandFor, scoreAnswers, PDF_PATH } from "./audit-data";

// /profit-leak — Field Guide No. 01 as a lead magnet. Two paths share one
// contact form: download the PDF, or score the twenty-one-question audit on
// the page and get the result immediately. Both capture name, email, phone
// and company, subscribe to Kit, and alert the owner. Mirrors the
// /ai-visibility-check landing-page shell (Nav + minimal footer).

type Mode = "audit" | "download";

interface Form {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string; // honeypot — stays empty for humans
}

interface Result {
  score?: number;
  sections?: number[];
  band?: { label: string; text: string };
  downloadUrl: string;
  emailed: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfitLeakPage() {
  useMicroInteractions();

  const [mode, setMode] = useState<Mode>("audit");
  const [form, setForm] = useState<Form>({ name: "", email: "", phone: "", company: "", website: "" });
  const [answers, setAnswers] = useState<boolean[]>(() => Array(QUESTION_COUNT).fill(false));
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const live = scoreAnswers(answers);

  const setField = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const toggle = (i: number) =>
    setAnswers((a) => {
      const next = a.slice();
      next[i] = !next[i];
      return next;
    });

  const goTo = useCallback((m: Mode) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMode(m);
    document.getElementById("profit-leak-form")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (form.name.trim().length < 2) next.name = "Enter your name";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email";
    if (form.phone.replace(/\D/g, "").length < 7) next.phone = "Enter a phone number";
    if (form.company.trim().length < 2) next.company = "Enter your company name";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/profit-leak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          ...form,
          ...(mode === "audit" ? { answers } : {}),
          attribution: getAttribution(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setApiError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult(data as Result);
      trackEvent("Lead", { content_name: mode === "audit" ? "profit-leak-audit" : "profit-leak-download" });
      setTimeout(() => document.getElementById("profit-leak-result")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const band = result?.score !== undefined ? bandFor(result.score) : null;

  return (
    <>
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="avc-hero">
        <div className="hero-glow" />
        <div className="wrap avc-hero-inner">
          <span className="idx avc-hero-eyebrow">Field Guide No. 01 / For General Contractors</span>
          <h1 className="display avc-hero-headline reveal">
            The Contractor Profit Leak Audit
          </h1>
          <p className="avc-hero-sub reveal">
            Seven places general contractors lose money that never show up as a line item — and the one
            question that exposes each of them. Score the twenty-one-question audit here in about fifteen
            minutes, or take the guide with you.
          </p>
          <div className="avc-hero-cta reveal">
            <a href="#profit-leak-form" className="btn btn-primary btn-lg" onClick={goTo("audit")}>
              Score the audit here
            </a>
            <a href="#profit-leak-form" className="btn btn-ghost" onClick={goTo("download")}>
              Download the PDF
            </a>
          </div>
          <p className="idx avc-hero-trust reveal">
            Free · Your result immediately · Your copy of the guide by email
          </p>
        </div>
      </section>

      {/* ── THE MODEL ────────────────────────────────────────── */}
      <section className="pl-model rule">
        <div className="wrap">
          <div className="pl-model-inner reveal">
            <span className="idx pl-model-label">Modeled exposure</span>
            <span className="pl-model-figure">$610,000 – $1,400,000</span>
            <p className="pl-model-note">
              Annual leakage for a $20M general contractor with ordinary controls. A model built from
              line-item assumptions, not a survey — the guide shows every input so you can run it against
              your own numbers. At a typical 3% net, the low end is the entire year&apos;s profit.
            </p>
          </div>
        </div>
      </section>

      {/* ── THE SEVEN LEAKS ──────────────────────────────────── */}
      <section className="pl-leaks rule">
        <div className="wrap">
          <div className="avc-form-head reveal">
            <span className="idx avc-form-step">The map</span>
            <h2 className="display avc-form-headline">Seven leaks, ranked by how rarely they&apos;re measured.</h2>
          </div>
          <ol className="pl-leak-list reveal">
            {SECTIONS.map((s) => (
              <li key={s.num} className="pl-leak">
                <span className="idx pl-leak-num">{s.num}</span>
                <span className="pl-leak-name">{s.leak}</span>
                <span className="idx pl-leak-where">{s.livesIn}</span>
              </li>
            ))}
          </ol>
          <p className="pl-leak-note reveal">
            Not one of these lives in the field where the work happens, and not one lives in estimating
            where the price gets set. They live in the seams between departments — which is precisely why
            no department owns them.
          </p>
        </div>
      </section>

      {/* ── THE FORM ─────────────────────────────────────────── */}
      <section className="avc-form-section rule" id="profit-leak-form">
        <div className="wrap">
          {!result ? (
            <>
              <div className="avc-form-head reveal">
                <span className="idx avc-form-step">
                  {mode === "audit" ? "Twenty-one questions · about fifteen minutes" : "Field Guide No. 01 · PDF"}
                </span>
                <h2 className="display avc-form-headline">
                  {mode === "audit" ? "Score the audit." : "Take the guide with you."}
                </h2>
                <div className="pl-mode" role="tablist" aria-label="Choose a path">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "audit"}
                    className={`pl-mode-btn${mode === "audit" ? " is-on" : ""}`}
                    onClick={() => setMode("audit")}
                  >
                    Score it here
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "download"}
                    className={`pl-mode-btn${mode === "download" ? " is-on" : ""}`}
                    onClick={() => setMode("download")}
                  >
                    Just send me the PDF
                  </button>
                </div>
              </div>

              <form className="avc-form reveal" onSubmit={handleSubmit} noValidate>
                <div className="vc2-form-grid">
                  <div className={`vc2-field${errors.name ? " vc2-field--error" : ""}`}>
                    <label className="vc2-label" htmlFor="pl-name">Name <span className="vc2-req">*</span></label>
                    <input id="pl-name" className="vc2-input" type="text" autoComplete="name" value={form.name} onChange={setField("name")} />
                    {errors.name && <span className="vc2-error">{errors.name}</span>}
                  </div>
                  <div className={`vc2-field${errors.company ? " vc2-field--error" : ""}`}>
                    <label className="vc2-label" htmlFor="pl-company">Company <span className="vc2-req">*</span></label>
                    <input id="pl-company" className="vc2-input" type="text" autoComplete="organization" value={form.company} onChange={setField("company")} />
                    {errors.company && <span className="vc2-error">{errors.company}</span>}
                  </div>
                  <div className={`vc2-field${errors.email ? " vc2-field--error" : ""}`}>
                    <label className="vc2-label" htmlFor="pl-email">Email <span className="vc2-req">*</span></label>
                    <input id="pl-email" className="vc2-input" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={setField("email")} />
                    {errors.email && <span className="vc2-error">{errors.email}</span>}
                  </div>
                  <div className={`vc2-field${errors.phone ? " vc2-field--error" : ""}`}>
                    <label className="vc2-label" htmlFor="pl-phone">Phone <span className="vc2-req">*</span></label>
                    <input id="pl-phone" className="vc2-input" type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={setField("phone")} />
                    {errors.phone && <span className="vc2-error">{errors.phone}</span>}
                  </div>
                  {/* honeypot — off-screen, never shown to people */}
                  <div className="pl-hp" aria-hidden="true">
                    <label htmlFor="pl-website">Website</label>
                    <input id="pl-website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={setField("website")} />
                  </div>
                </div>

                {mode === "audit" && (
                  <div className="pl-audit">
                    <p className="pl-audit-rule">
                      Check the box only if the answer is an unqualified yes — meaning someone in your company
                      could produce the document or the number today, without building it first.
                      &ldquo;We could probably pull that&rdquo; is a no.
                    </p>
                    {SECTIONS.map((s, si) => (
                      <fieldset key={s.num} className="pl-section">
                        <legend className="idx pl-section-title">
                          <span>{s.num} / {s.leak}</span>
                          <span className="pl-section-score">{live.sections[si]} of 3</span>
                        </legend>
                        {s.questions.map((q, qi) => {
                          const i = si * 3 + qi;
                          return (
                            <label key={i} className={`pl-q${answers[i] ? " is-yes" : ""}`}>
                              <input type="checkbox" checked={answers[i]} onChange={() => toggle(i)} />
                              <span className="pl-q-box" aria-hidden="true" />
                              <span className="pl-q-text">{q}</span>
                            </label>
                          );
                        })}
                      </fieldset>
                    ))}
                    <div className="pl-live">
                      <span className="idx">Running score</span>
                      <span className="pl-live-num">{live.total}<i>/ {QUESTION_COUNT}</i></span>
                    </div>
                  </div>
                )}

                <div className="avc-form-footer">
                  <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                    {loading ? "Sending…" : mode === "audit" ? "Score my audit" : "Send me the guide"}
                  </button>
                  <span className="idx avc-email-note">
                    {mode === "audit"
                      ? "Your result appears here and a copy goes to your inbox with the guide."
                      : "The guide goes straight to your inbox."}
                  </span>
                  {apiError && <p className="avc-api-error">{apiError}</p>}
                </div>
              </form>
            </>
          ) : (
            <div className="pl-result" id="profit-leak-result">
              {band && result.score !== undefined ? (
                <>
                  <span className="idx avc-form-step">Your score</span>
                  <div className="pl-result-score">
                    <span className="pl-result-num">{result.score}</span>
                    <span className="idx pl-result-of">out of {QUESTION_COUNT}</span>
                  </div>
                  <h2 className="display pl-result-band">{band.label}.</h2>
                  <p className="pl-result-text">{band.text}</p>
                  <ol className="pl-result-sections">
                    {SECTIONS.map((s, i) => (
                      <li key={s.num} className={`pl-result-row${(result.sections?.[i] ?? 0) <= 1 ? " is-low" : ""}`}>
                        <span className="idx">{s.num}</span>
                        <span className="pl-result-row-name">{s.leak}</span>
                        <span className="pl-result-bar"><i style={{ width: `${((result.sections?.[i] ?? 0) / 3) * 100}%` }} /></span>
                        <span className="idx pl-result-row-n">{result.sections?.[i] ?? 0} / 3</span>
                      </li>
                    ))}
                  </ol>
                  <p className="pl-result-text">
                    A low score is not a judgment about how well you build. It&apos;s a measurement of how much
                    of your company still lives in one person&apos;s head. Pick the two sections where you
                    scored lowest. Ignore the rest until those are running without you.
                  </p>
                </>
              ) : (
                <>
                  <span className="idx avc-form-step">On its way</span>
                  <h2 className="display pl-result-band">Your copy is in your inbox.</h2>
                  <p className="pl-result-text">
                    If it hasn&apos;t landed in a minute, check the folder your mail client hides new senders in — or take it now.
                  </p>
                </>
              )}
              <div className="lp-cta-pair">
                <a href={result.downloadUrl} className="btn btn-primary btn-lg" download>
                  Download the Field Guide (PDF)
                </a>
                <Link href="/visibility-check" className="btn btn-ghost">
                  Get My AI Visibility Audit — $27
                </Link>
              </div>
              <p className="idx avc-email-note">
                {result.emailed
                  ? "A copy of everything above was sent to your email."
                  : "The download works now; email delivery is delayed."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── MINIMAL FOOTER ────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="wrap">
          <div className="lp-footer-inner">
            <Link href="/" aria-label="6Signal — return to main site">
              <img src="/6SIGDashboardLogo.png" alt="6Signal" className="lp-footer-logo" />
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
      {!result && (
        <div className="mobile-cta">
          <a href="#profit-leak-form" className="btn" onClick={goTo("audit")}>
            Score the audit
            <svg width="14" height="10" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M0 5h14M10 1l4 4-4 4" />
            </svg>
          </a>
        </div>
      )}
    </>
  );
}
