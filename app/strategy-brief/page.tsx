"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Nav from "../components/Nav";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

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
  deliverables: string[];
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
  content_architecture: {
    overview: string;
    pages: ContentPage[];
  };
  schema_plan: {
    overview: string;
    schemas: SchemaType[];
  };
  review_strategy: {
    current_gap: string;
    target: string;
    actions: string[];
  };
  "90_day_calendar": CalendarPeriod[];
  quick_wins: QuickWin[];
  closing_note: string;
}

// ─── Loading messages ─────────────────────────────────────────────────────────

const LOADING_MSGS = [
  "Reading your audit brief...",
  "Building content architecture...",
  "Writing signal action plans...",
  "Mapping schema requirements...",
  "Drafting 90-day calendar...",
  "Finalizing your strategy document...",
];

// ─── Main component ───────────────────────────────────────────────────────────

function StrategyBriefInner() {
  useMicroInteractions();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use pre-generated result if available (from preview funnel or a reload)
    try {
      const cached = localStorage.getItem("6sig_strategy_result");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.business_name) {
          setStrategy(parsed);
          return;
        }
      }
    } catch { /* ignore */ }

    // Otherwise generate from audit data (production Stripe flow)
    let audit: unknown = null;
    try {
      const stored = localStorage.getItem("6sig_audit_result");
      if (stored) audit = JSON.parse(stored);
    } catch { /* ignore */ }

    if (!audit) {
      setError("no_audit");
      return;
    }

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
          body: JSON.stringify({ audit }),
        });
        if (!r.ok) throw new Error(`Server error ${r.status}`);
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

  // ── Non-strategy states (cursor elements always rendered so the hook finds them) ──
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
              <h1 className="display ar-error-h1">We couldn't find your audit brief.</h1>
              <p className="ar-error-body">Your audit brief is required to generate the strategy document. Start with the AI Visibility Brief first.</p>
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

  return (
    <div className="sb-page">
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
      <Nav />
      <main className="sb-main">
        <div className="wrap">

          {/* ── Cover ── */}
          <header className="sb-cover rule">
            <div className="sb-cover-inner">
              <span className="idx sb-cover-eyebrow">Full Strategy Brief</span>
              <h1 className="display sb-cover-name">{strategy.business_name}</h1>
              <div className="sb-cover-meta">
                <span>{strategy.trade}</span>
                <span className="sb-cover-sep">·</span>
                <span>{strategy.city}</span>
                <span className="sb-cover-sep">·</span>
                <span>6Signal — AI Visibility Strategy</span>
              </div>
            </div>
            <button
              className="btn btn-ghost sb-print-btn"
              onClick={() => window.print()}
            >
              Save / Print →
            </button>
          </header>

          {/* ── Quick Wins ── */}
          {strategy.quick_wins?.length > 0 && (
            <section className="sb-section rule">
              <div className="sb-section-head">
                <span className="idx">Start here</span>
                <h2 className="display sb-section-h2">Quick wins.</h2>
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

          {/* ── Signal Action Plans ── */}
          <section className="sb-section rule">
            <div className="sb-section-head">
              <span className="idx">Signal-by-signal</span>
              <h2 className="display sb-section-h2">Action plans.</h2>
            </div>
            <div className="sb-signal-plans">
              {strategy.signal_plans?.map((s, i) => (
                <div className="sb-signal-plan" key={i}>
                  <div className="sb-sp-head">
                    <div className="sb-sp-acro">{s.signal}</div>
                    <div className="sb-sp-scores">
                      <span className="sb-sp-score sb-sp-score--current">{s.current_score}/10 now</span>
                      <span className="sb-sp-arrow">→</span>
                      <span className="sb-sp-score sb-sp-score--target">{s.target_score}/10 target</span>
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

          {/* ── Content Architecture ── */}
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
                </div>
              ))}
            </div>
          </section>

          {/* ── Schema Plan ── */}
          <section className="sb-section rule">
            <div className="sb-section-head">
              <span className="idx">Structured data</span>
              <h2 className="display sb-section-h2">Schema plan.</h2>
            </div>
            <p className="sb-section-overview">{strategy.schema_plan?.overview}</p>
            <div className="sb-schemas">
              {strategy.schema_plan?.schemas?.map((s, i) => (
                <div className="sb-schema" key={i}>
                  <div className="sb-schema-type">{s.type}</div>
                  <p className="sb-schema-why">{s.why}</p>
                  <div className="sb-schema-fields">
                    <div className="sb-pc-sub-label">Required fields</div>
                    <div className="sb-pc-items">
                      {s.required_fields?.map((f, j) => <span className="sb-pc-item" key={j}>{f}</span>)}
                    </div>
                  </div>
                  <div className="sb-schema-example">
                    <span className="sb-pc-sub-label">Example: </span>
                    <span className="sb-schema-ex-val">{s.example_value}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Review Strategy ── */}
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
          </section>

          {/* ── 90-Day Calendar ── */}
          <section className="sb-section rule">
            <div className="sb-section-head">
              <span className="idx">Execution timeline</span>
              <h2 className="display sb-section-h2">90-day calendar.</h2>
            </div>
            <div className="sb-calendar">
              {strategy["90_day_calendar"]?.map((p, i) => (
                <div className="sb-cal-period" key={i}>
                  <div className="sb-cal-period-head">
                    <span className="sb-cal-period-label">{p.period}</span>
                    <span className="sb-cal-focus">{p.focus}</span>
                  </div>
                  <ul className="sb-cal-deliverables">
                    {p.deliverables?.map((d, j) => <li key={j}>{d}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── Closing Note ── */}
          <section className="sb-close rule">
            <div className="sb-close-inner">
              <p className="sb-close-note">{strategy.closing_note}</p>
              <div className="sb-close-ctas">
                <a href="https://calendly.com/mvw-mattvincentwalker/ai-audit" className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                  Book the 1-Hour Strategy Call — $197 →
                </a>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

export default function StrategyBriefPage() {
  return (
    <Suspense fallback={
      <div className="sb-page">
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
