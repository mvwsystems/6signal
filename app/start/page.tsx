"use client";
import { useEffect, useRef, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import { getAttribution } from "../lib/attribution";

// Self-serve website intake: trade in -> AI-generated questionnaire ->
// answers persisted server-side -> done. No payment in the flow: the intake
// is a link the operator sends, the answers come back, and V1 gets built from
// them. Setting STRIPE_DEPOSIT back to the buy-link restores the 50% deposit
// checkout at submit — the button, the form note, and the success screen all
// switch with it.
// const STRIPE_DEPOSIT = "https://buy.stripe.com/fZudRaaNM7Zhc1j7fj3ks0z";
const STRIPE_DEPOSIT: string | null = null;

const TRADES = [
  "Plumbing", "HVAC", "Roofing", "Electrical", "General Contracting",
  "Custom Home Builder", "Landscaping", "Pest Control",
  "Foundation / Concrete", "Tree Service", "Garage Doors", "Masonry",
  "Excavation / Utilities", "Other",
];

const GENERATING_MSGS = [
  "Reading how buyers search your trade...",
  "Building your question set...",
  "Tailoring for your services and market...",
  "Almost there...",
];

interface Question {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
  required?: boolean;
}
interface Section {
  title: string;
  questions: Question[];
}

export default function StartPage() {
  useMicroInteractions();

  const [step, setStep] = useState<"contact" | "generating" | "questions" | "submitting" | "done">("contact");
  const [contact, setContact] = useState({ name: "", email: "", phone: "", company: "", trade: "", tradeOther: "", currentSite: "", hp: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<Section[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [genMsg, setGenMsg] = useState(GENERATING_MSGS[0]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const restored = useRef(false);

  const trade = contact.trade === "Other" ? contact.tradeOther : contact.trade;

  // Answers survive refreshes — a long questionnaire should never eat work.
  useEffect(() => {
    if (restored.current) {
      try {
        localStorage.setItem("6sig_start_backup", JSON.stringify({ contact, answers, sections, step: step === "generating" || step === "submitting" ? "contact" : step }));
      } catch { /* ignore */ }
    }
  }, [contact, answers, sections, step]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("6sig_start_backup");
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.contact?.email && saved?.step === "questions" && saved?.sections?.length) {
          setContact(saved.contact);
          setAnswers(saved.answers ?? {});
          setSections(saved.sections);
          setStep("questions");
        }
      }
    } catch { /* ignore */ }
    restored.current = true;
  }, []);

  // The reveal observer only sees elements that exist at mount. Every step
  // swaps in fresh .reveal nodes (the questionnaire, the generating panel, the
  // success panel), which would otherwise stay at opacity 0 — a blank page.
  const stepped = useRef(false);
  useEffect(() => {
    if (!stepped.current) {
      // First paint — the observer already has these nodes; let it animate.
      stepped.current = true;
      return;
    }
    document
      .querySelectorAll<HTMLElement>(".vc2-form-section .reveal")
      .forEach((el) => el.classList.add("in"));
  }, [step, sections]);

  const setC = (field: string, value: string) => {
    setContact((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const startQuestionnaire = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!contact.name.trim()) errs.name = "Your name is required";
    if (!contact.company.trim()) errs.company = "Company name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) errs.email = "A valid email is required";
    if (!contact.trade) errs.trade = "Select your trade";
    if (contact.trade === "Other" && !contact.tradeOther.trim()) errs.tradeOther = "Tell us your trade";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setStep("generating");
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % GENERATING_MSGS.length;
      setGenMsg(GENERATING_MSGS[i]);
    }, 2200);
    try {
      const r = await fetch("/api/website-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade, company: contact.company, currentSite: contact.currentSite }),
      });
      const data = await r.json();
      let secs: Section[] = Array.isArray(data?.sections) && data.sections.length ? data.sections : [];
      // Current site already collected up front — drop any duplicate ask.
      if (contact.currentSite.trim()) {
        secs = secs
          .map((s) => ({ ...s, questions: s.questions.filter((q) => !/current.*(web)?site|existing site/i.test(q.label) && q.id !== "current_site") }))
          .filter((s) => s.questions.length > 0);
      }
      setSections(secs);
      setStep("questions");
      window.scrollTo({ top: 0 });
    } catch {
      setStep("contact");
      setSubmitError("Something went wrong generating your questionnaire. Please try again.");
    } finally {
      clearInterval(interval);
    }
  };

  const submitAll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const missing = sections.flatMap((s) => s.questions).filter((q) => q.required && !answers[q.id]?.trim());
    if (missing.length) {
      setSubmitError(`Please answer: ${missing.map((q) => `"${q.label}"`).join(", ")}`);
      return;
    }
    setSubmitError(null);
    setStep("submitting");
    try {
      const payload = {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        trade,
        currentSite: contact.currentSite,
        hp: contact.hp,
        attribution: getAttribution(),
        answers: sections.flatMap((s) =>
          s.questions
            .filter((q) => answers[q.id]?.trim())
            .map((q) => ({ section: s.title, label: q.label, answer: answers[q.id] }))
        ),
      };
      const r = await fetch("/api/website-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("submit failed");
      const { id } = await r.json();
      try { localStorage.removeItem("6sig_start_backup"); } catch { /* ignore */ }
      if (STRIPE_DEPOSIT) {
        window.location.href = id ? `${STRIPE_DEPOSIT}?client_reference_id=${id}` : STRIPE_DEPOSIT;
        return;
      }
      setStep("done");
      window.scrollTo({ top: 0 });
    } catch {
      setStep("questions");
      setSubmitError("Something went wrong submitting. Your answers are saved on this device — please try again, or email hello@6signal.co.");
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
            <span className="idx reveal">The Climb · Start — Website Build</span>
            <h1 className="display reveal">
              {step === "done" ? (
                <>Answers received.<br /><em>Your build is queued.</em></>
              ) : (
                <>Let&rsquo;s build your website.<br /><em>Start with your trade.</em></>
              )}
            </h1>
            {step !== "done" && (
              <p className="hero-deck reveal">
                Answer a questionnaire built for your specific trade — it takes about
                ten minutes and it&rsquo;s what lets us build an upscale site without
                weeks of back-and-forth. $1,500 flat, and nothing to pay to get
                started.
              </p>
            )}
          </div>
        </div>
      </header>

      <section className="vc2-form-section rule">
        <div className="wrap">
          {step === "contact" && (
            <form className="vc2-form reveal" onSubmit={startQuestionnaire} noValidate>
              <div className="vc2-form-grid">
                <div className={`vc2-field${errors.name ? " vc2-field--error" : ""}`}>
                  <label className="vc2-label">Your Name <span className="vc2-req">*</span></label>
                  <input className="vc2-input" type="text" placeholder="First and last" value={contact.name}
                    onChange={(e) => setC("name", e.target.value)} autoComplete="name" />
                  {errors.name && <span className="vc2-error">{errors.name}</span>}
                </div>
                <div className={`vc2-field${errors.company ? " vc2-field--error" : ""}`}>
                  <label className="vc2-label">Company <span className="vc2-req">*</span></label>
                  <input className="vc2-input" type="text" placeholder="Acme Plumbing" value={contact.company}
                    onChange={(e) => setC("company", e.target.value)} autoComplete="organization" />
                  {errors.company && <span className="vc2-error">{errors.company}</span>}
                </div>
                <div className={`vc2-field${errors.email ? " vc2-field--error" : ""}`}>
                  <label className="vc2-label">Email <span className="vc2-req">*</span></label>
                  <input className="vc2-input" type="email" placeholder="you@yourbusiness.com" value={contact.email}
                    onChange={(e) => setC("email", e.target.value)} autoComplete="email" />
                  {errors.email && <span className="vc2-error">{errors.email}</span>}
                </div>
                <div className="vc2-field">
                  <label className="vc2-label">Phone <span className="vc2-optional">(optional)</span></label>
                  <input className="vc2-input" type="tel" placeholder="(817) 555-0100" value={contact.phone}
                    onChange={(e) => setC("phone", e.target.value)} autoComplete="tel" />
                  <span className="idx avc-email-note">
                    By providing your number you agree to receive calls and texts from
                    6 Signal about your project. Msg &amp; data rates may apply; reply
                    STOP to opt out. <a href="/privacy" style={{ color: "inherit", textDecoration: "underline" }}>Privacy</a>
                  </span>
                </div>
                <div className={`vc2-field${errors.trade ? " vc2-field--error" : ""}`}>
                  <label className="vc2-label">Your Trade <span className="vc2-req">*</span></label>
                  <div className="vc2-select-wrap">
                    <select className="vc2-select" value={contact.trade} onChange={(e) => setC("trade", e.target.value)}>
                      <option value="">Select your trade...</option>
                      {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <svg className="vc2-select-arrow" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path d="M1 1l4 4 4-4" />
                    </svg>
                  </div>
                  {errors.trade && <span className="vc2-error">{errors.trade}</span>}
                </div>
                {contact.trade === "Other" && (
                  <div className={`vc2-field${errors.tradeOther ? " vc2-field--error" : ""}`}>
                    <label className="vc2-label">What&rsquo;s your trade? <span className="vc2-req">*</span></label>
                    <input className="vc2-input" type="text" placeholder="e.g., Gutters, Fencing, Pool Service" value={contact.tradeOther}
                      onChange={(e) => setC("tradeOther", e.target.value)} />
                    {errors.tradeOther && <span className="vc2-error">{errors.tradeOther}</span>}
                  </div>
                )}
                <div className="vc2-field vc2-field--full">
                  <label className="vc2-label">Current Website URL <span className="vc2-optional">(optional)</span></label>
                  <input className="vc2-input" type="text" placeholder="https://yourbusiness.com — we'll pull what's worth keeping from it" value={contact.currentSite}
                    onChange={(e) => setC("currentSite", e.target.value)} autoComplete="url" />
                </div>
                <input type="text" value={contact.hp} onChange={(e) => setC("hp", e.target.value)} tabIndex={-1}
                  autoComplete="off" aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }} />
              </div>
              <div className="vc2-form-footer">
                <button className="btn btn-primary btn-lg vc2-submit" type="submit">
                  Build My Questionnaire
                  <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M0 5h14M10 1l4 4-4 4" />
                  </svg>
                </button>
                <p className="vc2-form-note">
                  {submitError ?? "Your questionnaire is generated for your trade specifically — about ten minutes to complete."}
                </p>
              </div>
            </form>
          )}

          {step === "generating" && (
            <div className="form-success reveal">
              <h3>Building your questionnaire...</h3>
              <p>{genMsg}</p>
            </div>
          )}

          {(step === "questions" || step === "submitting") && (
            <form className="vc2-form reveal" onSubmit={submitAll} noValidate>
              {sections.map((s) => (
                <div key={s.title} style={{ marginBottom: "48px" }}>
                  <div className="vc2-form-head" style={{ marginBottom: "28px" }}>
                    <h2 className="display vc2-form-headline" style={{ fontSize: "clamp(20px, 2.4vw, 28px)" }}>{s.title}</h2>
                  </div>
                  <div className="vc2-form-grid">
                    {s.questions.map((q) => (
                      <div key={q.id} className="vc2-field vc2-field--full">
                        <label className="vc2-label">
                          {q.label} {q.required ? <span className="vc2-req">*</span> : <span className="vc2-optional">(optional)</span>}
                        </label>
                        {q.type === "select" && q.options?.length ? (
                          <div className="vc2-select-wrap">
                            <select className="vc2-select" value={answers[q.id] ?? ""}
                              onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}>
                              <option value="">Select...</option>
                              {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                            <svg className="vc2-select-arrow" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.4">
                              <path d="M1 1l4 4 4-4" />
                            </svg>
                          </div>
                        ) : q.type === "textarea" ? (
                          <textarea className="vc2-input" rows={4} placeholder={q.placeholder ?? ""} value={answers[q.id] ?? ""}
                            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))} style={{ resize: "vertical" }} />
                        ) : (
                          <input className="vc2-input" type="text" placeholder={q.placeholder ?? ""} value={answers[q.id] ?? ""}
                            onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="vc2-form-footer">
                <button className="btn btn-primary btn-lg vc2-submit" type="submit" disabled={step === "submitting"}>
                  {step === "submitting" ? "Submitting..." : STRIPE_DEPOSIT ? "Submit & Pay 50% Deposit — $750" : "Submit My Answers"}
                  {step !== "submitting" && (
                    <svg className="arrow" viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M0 5h14M10 1l4 4-4 4" />
                    </svg>
                  )}
                </button>
                <p className="vc2-form-note">
                  {submitError ?? (STRIPE_DEPOSIT
                    ? "Secure payment via Stripe. $750 now, $750 at launch. After your deposit clears, expect a direction call from the operator — then the build starts."
                    : "No payment now. Your answers go straight to Matt Vincent Walker, and the first version of your site gets built from them.")}
                </p>
              </div>
            </form>
          )}

          {step === "done" && (
            <div className="form-success reveal">
              <h3>Got it — everything we need is in.</h3>
              <p>
                Your answers just landed with Matt Vincent Walker directly. Nothing to
                pay, nothing else to do. He reads every answer himself, then builds the
                first version of your site from them and sends it to you to look at —
                a real site you can click through, not a mockup. From there you tell
                him what to change. One operator, no project managers, no ticket
                numbers. Most sites are live within 2–3 weeks.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
