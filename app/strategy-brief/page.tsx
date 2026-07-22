"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import Nav from "../components/Nav";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import { trackEvent, clampScore } from "../lib/fbq";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignalPlan {
  signal: string;
  current_score: number;
  target_score: number;
  the_problem: string;
  the_fix: string;
  actions: { action: string; detail: string; timeline: string }[];
}

interface ContentPage {
  page_title: string;
  url_slug: string;
  purpose: string;
  h1: string;
  sections: string[];
  faq_questions: string[];
  priority: string;
  why_it_matters?: string;
}

interface SchemaType {
  type: string;
  why: string;
  required_fields: string[];
  example_value: string;
}

interface CalendarPeriod {
  period: string;
  focus: string;
  deliverables: string[] | string;
}

interface QuickWin {
  win: string;
  impact: string;
  effort: string;
}

interface Strategy {
  business_name: string;
  trade: string;
  city: string;
  signal_plans: SignalPlan[];
  content_architecture: { overview: string; pages: ContentPage[] };
  schema_plan: { overview: string; schemas: SchemaType[] };
  review_strategy: {
    current_gap: string;
    target: string;
    actions: string[];
    review_request_template?: string;
  };
  "90_day_calendar": CalendarPeriod[];
  quick_wins: QuickWin[];
  closing_note: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LOADING_MSGS = [
  "Reading your audit...",
  "Building content architecture...",
  "Writing signal action plans...",
  "Mapping schema requirements...",
  "Drafting 90-day calendar...",
  "Finalizing your strategy document...",
];

const SIGNAL_ORDER = ["GEO", "AEO", "LEO", "VEO", "PEO", "IEO"];

function parseDeliverables(d: string[] | string): string[] {
  if (Array.isArray(d)) return d;
  return d.split("\n").map(s => s.trim()).filter(Boolean);
}

// ─── Copy hook ────────────────────────────────────────────────────────────────

function useCopyButton(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), resetMs);
    } catch { /* ignore */ }
  }, [resetMs]);
  return { copied, copy };
}

// ─── Inner component ──────────────────────────────────────────────────────────

function StrategyBriefInner() {
  useMicroInteractions();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [auditScores, setAuditScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [error, setError] = useState<string | null>(null);
  const [copiedSchemas, setCopiedSchemas] = useState<Record<number, boolean>>({});
  const [copiedReview, setCopiedReview] = useState(false);

  const copySchema = useCallback(async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSchemas(prev => ({ ...prev, [idx]: true }));
      setTimeout(() => setCopiedSchemas(prev => ({ ...prev, [idx]: false })), 2000);
    } catch { /* ignore */ }
  }, []);

  const copyReview = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedReview(true);
      setTimeout(() => setCopiedReview(false), 2000);
    } catch { /* ignore */ }
  }, []);

  // Fire Purchase $97 once per audit on first strategy-brief load
  useEffect(() => {
    const auditId = (() => { try { return localStorage.getItem("6sig_audit_id"); } catch { return null; } })();
    const key = `6sig_pxl_p97_${auditId ?? "default"}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch { return; }
    trackEvent("Purchase", { value: 97.00, currency: "USD" });
  }, []);

  useEffect(() => {
    // Read current signal scores from audit result
    try {
      const auditRaw = localStorage.getItem("6sig_audit_result");
      if (auditRaw) {
        const parsed = JSON.parse(auditRaw);
        if (parsed?.signals) {
          const scores: Record<string, number> = {};
          Object.entries(parsed.signals).forEach(([key, val]) => {
            scores[key.toUpperCase()] = (val as { score: number }).score;
          });
          setAuditScores(scores);
        }
      }
    } catch { /* ignore */ }

    // Permalink: render a previously generated strategy without regenerating
    // (the durable link sent in the "your strategy is ready" email).
    const permalinkId = new URLSearchParams(window.location.search).get("id");
    if (permalinkId) {
      setLoading(true);
      (async () => {
        try {
          const rr = await fetch(`/api/audit/${permalinkId}`);
          if (rr.ok) {
            const saved = await rr.json();
            if (saved?.payload?.business_name) {
              setStrategy(saved.payload);
              localStorage.setItem("6sig_strategy_result", JSON.stringify(saved.payload));
              // On a fresh device the audit result may be absent — derive the
              // "current scores" column from the strategy's own signal plans.
              setAuditScores(prev => {
                if (Object.keys(prev).length) return prev;
                const sc: Record<string, number> = {};
                (saved.payload.signal_plans ?? []).forEach((sp: SignalPlan) => {
                  if (sp.signal) sc[sp.signal.toUpperCase()] = sp.current_score;
                });
                return sc;
              });
              return;
            }
          }
          setError("Something went wrong loading your strategy brief. Please contact hello@6signal.co.");
        } catch {
          setError("Something went wrong loading your strategy brief. Please contact hello@6signal.co.");
        } finally {
          setLoading(false);
        }
      })();
      return;
    }

    // Cache-first: use pre-generated strategy if available
    try {
      const cached = localStorage.getItem("6sig_strategy_result");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.business_name) { setStrategy(parsed); return; }
      }
    } catch { /* ignore */ }

    // Otherwise generate from audit data
    let audit: unknown = null;
    try {
      const stored = localStorage.getItem("6sig_audit_result");
      if (stored) audit = JSON.parse(stored);
    } catch { /* ignore */ }

    if (!audit) { setError("no_audit"); return; }

    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[msgIdx]);
    }, 2400);

    setLoading(true);

    (async () => {
      try {
        const r = await fetch("/api/generate-strategy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audit,
            intakeId: localStorage.getItem("6sig_intake_id") ?? undefined,
            // Fresh first generation — email the buyer their strategy brief.
            notify: true,
          }),
        });
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        const strategyId = r.headers.get("x-audit-id");
        if (strategyId) localStorage.setItem("6sig_strategy_id", strategyId);
        const reader = r.body!.getReader();
        const dec = new TextDecoder();
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += dec.decode(value, { stream: true });
        }
        const clean = text.replace(/```json\n?|```\n?/g, "").trim();
        const parsed = JSON.parse(clean);
        if (parsed.error) throw new Error(parsed.error);
        const strategyData = parsed.strategy ?? parsed;
        setStrategy(strategyData);
        localStorage.setItem("6sig_strategy_result", JSON.stringify(strategyData));
      } catch {
        setError("Something went wrong generating your strategy brief. Please contact hello@6signal.co.");
      } finally {
        clearInterval(interval);
        setLoading(false);
      }
    })();

    return () => clearInterval(interval);
  }, []);

  // ── Non-strategy states ──
  if (error === "no_audit" || (typeof error === "string" && error !== "no_audit") || loading || !strategy) {
    return (
      <div className="sb-page">
        <div id="cursor-dot" aria-hidden="true" />
        <div id="cursor-ring" aria-hidden="true" />
        <Nav />
        <div className="ar-state-wrap">
          {error === "no_audit" && (
            <div className="ar-error-block">
              <span className="idx">Missing Data</span>
              <h1 className="display ar-error-h1">We couldn&rsquo;t find your audit brief.</h1>
              <p className="ar-error-body">Your audit is required to generate the strategy document. Start with the AI Visibility Audit first.</p>
              <Link href="/visibility-check" className="btn btn-primary">Get the Audit Brief — $27 →</Link>
            </div>
          )}
          {typeof error === "string" && error !== "no_audit" && (
            <div className="ar-error-block">
              <span className="idx">Generation Failed</span>
              <h1 className="display ar-error-h1">Something went wrong.</h1>
              <p className="ar-error-body">{error}</p>
              <a href="mailto:hello@6signal.co" className="btn btn-primary">Contact hello@6signal.co</a>
            </div>
          )}
          {loading && (
            <div className="ar-loading-block">
              <div className="ar-loading-dot" />
              <p className="ar-loading-msg">{loadingMsg}</p>
              <p className="ar-loading-sub">Building your full strategy document...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Build signal score map from strategy plans
  const targetScores: Record<string, number> = {};
  strategy.signal_plans?.forEach(sp => {
    targetScores[sp.signal.toUpperCase()] = sp.target_score;
  });

  return (
    <div className="sb-page">
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
      <Nav />
      <main className="sb-main">
        <div className="wrap">

          {/* ─── SECTION 1: HEADER ─────────────────────────────────── */}
          <header className="sb-cover rule">
            <div className="sb-cover-inner">
              <span className="idx sb-cover-eyebrow">Strategy Brief</span>
              <h1 className="display sb-cover-name">{strategy.business_name}</h1>
              <div className="sb-cover-meta">
                <span>{strategy.trade}</span>
                <span className="sb-cover-sep">·</span>
                <span>{strategy.city}</span>
                <span className="sb-cover-sep">·</span>
                <span>6Signal — AI Visibility Strategy</span>
              </div>
            </div>
            <button className="btn btn-ghost sb-print-btn" onClick={() => window.print()}>
              Save / Print →
            </button>
          </header>

          {/* ─── SECTION 2: POSITIONING STATEMENT ─────────────────── */}
          <div className="sb-positioning-block">
            <div className="sb-positioning-label idx">What This Is</div>
            <p className="sb-positioning-body">
              Your AI Visibility Audit showed you where the gaps are. This Strategy Brief shows you
              exactly how to close them — signal by signal, week by week, with specific content specs,
              schema code, and review mechanics you can hand to a developer or execute yourself.
              This is the implementation manual.
            </p>
          </div>

          {/* ─── SECTION 3: SCORE COMPARISON BLOCK ────────────────── */}
          {(Object.keys(auditScores).length > 0 || strategy.signal_plans?.length > 0) && (
            <div className="sb-scores-block rule">
              <div className="sb-scores-grid">
                <div className="sb-scores-col">
                  <div className="idx sb-scores-col-head">Your Current Scores</div>
                  {SIGNAL_ORDER.map(sig => (
                    <div className="sb-scores-row" key={sig}>
                      <span className="sb-scores-sig">{sig}</span>
                      <span className="sb-scores-val">
                        {auditScores[sig] !== undefined ? `${clampScore(auditScores[sig])} / 100` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="sb-scores-col">
                  <div className="idx sb-scores-col-head">90-Day Targets</div>
                  {SIGNAL_ORDER.map(sig => (
                    <div className="sb-scores-row" key={sig}>
                      <span className="sb-scores-arrow">→</span>
                      <span className="sb-scores-target">
                        {targetScores[sig] !== undefined ? `${clampScore(targetScores[sig])} / 100` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── SECTION 4: QUICK WINS ─────────────────────────────── */}
          {strategy.quick_wins?.length > 0 && (
            <section className="sb-section rule">
              <div className="sb-section-head">
                <span className="idx">Start here</span>
                <h2 className="display sb-section-h2">Quick wins.</h2>
              </div>
              <div className="sb-qw-callout">
                <p className="sb-qw-callout-text">
                  These three actions require no budget and less than 4 hours total. They produce
                  measurable AI visibility improvement within 2–3 weeks. Do them before anything
                  else in this brief.
                </p>
              </div>
              <div className="sb-quick-wins">
                {strategy.quick_wins.map((w, i) => (
                  <div className="sb-quick-win" key={i}>
                    <div className="sb-qw-num">{i + 1}</div>
                    <div className="sb-qw-body">
                      <div className="sb-qw-win">{w.win}</div>
                      <div className="sb-qw-meta">
                        <span className="sb-qw-impact">{w.impact}</span>
                        <span className="sb-qw-effort">{w.effort}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── SECTION 5: SIGNAL ACTION PLANS ───────────────────── */}
          <section className="sb-section rule">
            <div className="sb-section-head">
              <span className="idx">Signal-by-signal</span>
              <h2 className="display sb-section-h2">Action plans.</h2>
            </div>
            <div className="sb-signal-plans">
              {(strategy.signal_plans ?? [])
                .sort((a, b) => SIGNAL_ORDER.indexOf(a.signal.toUpperCase()) - SIGNAL_ORDER.indexOf(b.signal.toUpperCase()))
                .map((s, i) => (
                  <div className="sb-signal-plan" key={i}>
                    <div className="sb-sp-head">
                      <div className="sb-sp-acro sb-sp-acro--solid">{s.signal}</div>
                      <div className="sb-sp-scores">
                        <span className="sb-sp-score sb-sp-score--current">{clampScore(s.current_score)} / 100 now</span>
                        <span className="sb-sp-arrow">→</span>
                        <span className="sb-sp-score sb-sp-score--target">{clampScore(s.target_score)} / 100 target</span>
                      </div>
                    </div>
                    <div className="sb-sp-problem">{s.the_problem}</div>
                    <div className="sb-sp-fix">{s.the_fix}</div>
                    <div className="sb-sp-actions">
                      {s.actions?.map((a, j) => (
                        <div className="sb-sp-action" key={j}>
                          <div className="sb-spa-header">
                            <span className="sb-spa-name">{a.action}</span>
                            <span className="sb-spa-time">{a.timeline}</span>
                          </div>
                          <p className="sb-spa-detail">{a.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>

          {/* ─── SECTION 6: CONTENT ARCHITECTURE ──────────────────── */}
          <section className="sb-section rule">
            <div className="sb-section-head">
              <span className="idx">Pages to build</span>
              <h2 className="display sb-section-h2">Content architecture.</h2>
            </div>
            <p className="sb-section-overview">{strategy.content_architecture?.overview}</p>
            <div className="sb-pages">
              {strategy.content_architecture?.pages?.map((p, i) => (
                <div className="sb-page-card" key={i}>
                  <div className="sb-pc-head">
                    <div className="sb-pc-title-wrap">
                      <span className={`sb-pc-priority${p.priority === "HIGH" ? " sb-pc-priority--high" : ""}`}>{p.priority}</span>
                      <span className="sb-pc-title">{p.page_title}</span>
                    </div>
                    <span className="sb-pc-slug">{p.url_slug}</span>
                  </div>
                  <p className="sb-pc-purpose">{p.purpose}</p>
                  <div className="sb-pc-h1-block">
                    <span className="sb-pc-h1-label">H1</span>
                    <span className="sb-pc-h1">{p.h1}</span>
                  </div>
                  {p.sections?.length > 0 && (
                    <div className="sb-pc-sections">
                      <div className="sb-pc-sub-label">Page sections</div>
                      <div className="sb-pc-items">
                        {p.sections.map((s, j) => <span className="sb-pc-item" key={j}>{s}</span>)}
                      </div>
                    </div>
                  )}
                  {p.faq_questions?.length > 0 && (
                    <div className="sb-pc-faqs">
                      <div className="sb-pc-sub-label">FAQ questions to answer</div>
                      <ul className="sb-pc-faq-list">
                        {p.faq_questions.map((q, j) => <li key={j}>{q}</li>)}
                      </ul>
                    </div>
                  )}
                  {p.why_it_matters && (
                    <div className="sb-pc-why">
                      <div className="sb-pc-sub-label">Why this page matters</div>
                      <p className="sb-pc-why-text">{p.why_it_matters}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ─── SECTION 7: SCHEMA PLAN ────────────────────────────── */}
          <section className="sb-section rule">
            <div className="sb-section-head">
              <span className="idx">Structured data</span>
              <h2 className="display sb-section-h2">Schema plan.</h2>
            </div>
            <p className="sb-section-overview">{strategy.schema_plan?.overview}</p>
            <div className="sb-schemas">
              {strategy.schema_plan?.schemas?.map((s, i) => (
                <div className="sb-schema" key={i}>
                  <div className="sb-schema-header">
                    <div className="sb-schema-type">{s.type}</div>
                    <span className="idx sb-schema-copy-label">Copy-Paste Ready</span>
                  </div>
                  <p className="sb-schema-why">{s.why}</p>
                  <div className="sb-schema-fields">
                    <div className="sb-pc-sub-label">Required fields</div>
                    <div className="sb-pc-items">
                      {s.required_fields?.map((f, j) => <span className="sb-pc-item" key={j}>{f}</span>)}
                    </div>
                  </div>
                  <div className="sb-schema-code-block">
                    <div className="sb-schema-code-top">
                      <span className="sb-pc-sub-label">Example value</span>
                      <button
                        className="sb-copy-btn"
                        onClick={() => copySchema(s.example_value, i)}
                      >
                        {copiedSchemas[i] ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    <div className="sb-schema-ex-val">{s.example_value}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── SECTION 8: REVIEW STRATEGY ────────────────────────── */}
          <section className="sb-section rule">
            <div className="sb-section-head">
              <span className="idx">Review velocity</span>
              <h2 className="display sb-section-h2">Review strategy.</h2>
            </div>
            <div className="sb-review-grid">
              <div className="sb-review-card sb-review-card--gap">
                <div className="sb-pc-sub-label">Current gap</div>
                <p className="sb-review-text">{strategy.review_strategy?.current_gap}</p>
              </div>
              <div className="sb-review-card sb-review-card--target">
                <div className="sb-pc-sub-label">Target</div>
                <p className="sb-review-text">{strategy.review_strategy?.target}</p>
              </div>
            </div>
            <div className="sb-review-actions">
              {strategy.review_strategy?.actions?.map((a, i) => (
                <div className="sb-review-action" key={i}>
                  <span className="sb-ra-num">{i + 1}</span>
                  <span className="sb-ra-text">{a}</span>
                </div>
              ))}
            </div>
            {strategy.review_strategy?.review_request_template && (
              <div className="sb-review-template">
                <div className="sb-review-template-header">
                  <div>
                    <div className="idx sb-review-template-label">Use This Exact Message</div>
                    <div className="idx sb-review-template-sub">Copy and send to past customers via SMS or email</div>
                  </div>
                  <button
                    className="sb-copy-btn"
                    onClick={() => copyReview(strategy.review_strategy!.review_request_template!)}
                  >
                    {copiedReview ? "Copied ✓" : "Copy message"}
                  </button>
                </div>
                <pre className="sb-review-template-text">
                  {strategy.review_strategy.review_request_template}
                </pre>
              </div>
            )}
          </section>

          {/* ─── SECTION 9: 90-DAY CALENDAR ────────────────────────── */}
          <section className="sb-section rule">
            <div className="sb-section-head">
              <span className="idx">Execution timeline</span>
              <h2 className="display sb-section-h2">90-day calendar.</h2>
            </div>
            <div className="sb-calendar">
              {strategy["90_day_calendar"]?.map((p, i) => {
                const isWeek1 = p.period === "Week 1-2";
                const isMonth3 = p.period === "Month 3";
                return (
                  <div
                    className={[
                      "sb-cal-period",
                      isWeek1 ? "sb-cal-period--urgent" : "",
                      isMonth3 ? "sb-cal-period--later" : "",
                    ].filter(Boolean).join(" ")}
                    key={i}
                  >
                    <div className="sb-cal-period-head">
                      <span className={`sb-cal-period-label${isMonth3 ? " sb-cal-period-label--muted" : ""}`}>
                        {p.period}
                      </span>
                      <span className={`sb-cal-focus${isMonth3 ? " sb-cal-focus--muted" : ""}`}>
                        {p.focus}
                      </span>
                    </div>
                    <ul className="sb-cal-deliverables">
                      {parseDeliverables(p.deliverables).map((d, j) => (
                        <li key={j}>{d}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ─── SECTION 10: CLOSING CTA ───────────────────────────── */}
          <section className="sb-close rule">
            <div className="sb-close-inner">
              <p className="sb-close-note">{strategy.closing_note}</p>

              <div className="sb-decision-block">
                <div className="idx sb-decision-eyebrow">Your Decision</div>
                <h2 className="display sb-decision-headline">
                  You have the map.<br />
                  <em>Now decide how you build.</em>
                </h2>
              </div>

              <div className="sb-decision-cards">
                {/* Card 1 — Execute Yourself */}
                <div className="sb-decision-card sb-decision-card--self">
                  <div className="idx sb-decision-tag">Execute It Yourself</div>
                  <h3 className="sb-decision-title">Everything you need is in this brief.</h3>
                  <p className="sb-decision-body sb-decision-body--muted">
                    Your Strategy Brief is a complete implementation manual. If you have a web
                    person, developer, or can implement it yourself — every task is spec&rsquo;d
                    with exact content requirements, schema code, and a week-by-week calendar. You
                    don&rsquo;t need us to execute this.
                  </p>
                  <p className="idx sb-decision-bottom-line">Good luck. We mean it.</p>
                </div>

                {/* Card 2 — Work With Us */}
                <div className="sb-decision-card sb-decision-card--featured">
                  <div className="idx sb-decision-tag sb-decision-tag--accent">Have Us Build It With You</div>
                  <h3 className="sb-decision-title">1-Hour Strategy Call</h3>
                  <p className="sb-decision-body">
                    Walk through this brief live with Matt Vincent Walker. Pressure-test every
                    recommendation against your actual business. Leave with a clear execution
                    decision — and the option to engage 6Signal&rsquo;s retainer directly.
                  </p>
                  <div className="sb-decision-price">$197</div>
                  <div className="idx sb-decision-price-sub">Includes this Strategy Brief at no extra charge.</div>
                  <button
                    className="btn btn-primary sb-decision-btn"
                    onClick={() => {
                      window.location.href = "https://buy.stripe.com/3cI00kcVUdjB8P76bf3ks0x";
                    }}
                  >
                    Book the Strategy Call — $197 →
                  </button>
                  {/* PDF-only URL */}
                  <div className="sb-decision-pdf-url">
                    Book the 1-Hour Strategy Call — $197: 6signal.co/strategy-call
                  </div>
                </div>
              </div>

              <div className="sb-close-footer">
                <p className="sb-close-retainer">
                  Want us to implement everything?{" "}
                  <Link href="/#pricing" className="sb-close-retainer-link">
                    See the 6Signal retainer →
                  </Link>
                </p>
                <p className="idx sb-close-contact">Questions? hello@6signal.co</p>
              </div>

            </div>
          </section>

          {/* ─── PDF BACK COVER ────────────────────────────────────── */}
          <div className="sb-pdf-back-cover">
            <img src="/6SIG_LOGO_FINAL_2.webp" alt="6Signal" className="sb-pdf-back-logo" />
            <div className="idx sb-pdf-back-tagline">AI Visibility Starts Here</div>
            <div className="sb-pdf-back-url">6signal.co</div>
            <div className="idx sb-pdf-back-email">hello@6signal.co</div>
            <div className="idx sb-pdf-back-retainer">To engage 6Signal directly: hello@6signal.co · 6signal.co/#pricing</div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function StrategyBriefPage() {
  return (
    <Suspense fallback={
      <div className="sb-page">
        <div id="cursor-dot" aria-hidden="true" />
        <div id="cursor-ring" aria-hidden="true" />
        <Nav />
        <div className="ar-state-wrap">
          <div className="ar-loading-block">
            <div className="ar-loading-dot" />
            <p className="ar-loading-msg">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <StrategyBriefInner />
    </Suspense>
  );
}
