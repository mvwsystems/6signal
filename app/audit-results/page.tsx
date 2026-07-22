"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import Nav from "../components/Nav";
import { useMicroInteractions } from "../hooks/useMicroInteractions";
import { trackEvent, clampScore } from "../lib/fbq";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Signal {
  label: string;
  score: number;
  what_it_measures: string;
  finding: string;
  evidence: string;
  gap: string;
}

interface BuyerStage {
  stage: number;
  label: string;
  buyer_question: string;
  what_they_need: string;
  who_answers_now: string;
  is_business_present: boolean;
  gap: string;
}

interface AuditData {
  business: {
    name: string;
    url: string;
    trade: string;
    city: string;
    market_context: string;
    critical_finding?: string;
  };
  executive_summary: {
    headline: string;
    situation: string;
    bottom_line: string;
    cost_of_invisibility?: string;
  };
  overall: { score: number; grade: string; risk_level: string; visibility_status: string };
  buyer_journey: { persona: string; stages: BuyerStage[] };
  signals: Record<string, Signal>;
  citation_landscape: {
    summary: string;
    sources_winning: { source_type: string; why_they_win: string; threat_level: string }[];
    what_it_takes_to_win: string;
  };
  content_gap_analysis: {
    summary: string;
    missing_content: { content_type: string; buyer_stage: string; why_it_matters: string; priority: string }[];
  };
  priority_roadmap: {
    rank: number;
    timeframe: string;
    category: string;
    action: string;
    expected_impact: string;
    effort: string;
  }[];
  retainer_case: { hook: string; what_6signal_builds: string; cost_of_inaction: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SLIDE_LABELS = ["COVER", "SUMMARY", "JOURNEY", "SIGNALS", "CITATIONS", "CONTENT", "ROADMAP", "CLOSE"];

const LOADING_MSGS = [
  "Mapping buyer journey stages...",
  "Analyzing AI citation landscape...",
  "Scoring 6-signal framework...",
  "Identifying content gaps...",
  "Building your audit...",
];

const gradeColor = (g: string) =>
  ({ A: "#22c55e", B: "#84cc16", C: "#eab308", D: "#f97316", F: "#ef4444" }[g] ?? "#E6FF00");

const riskColor = (r: string) =>
  ({ CRITICAL: "#ef4444", HIGH: "#f97316", MODERATE: "#eab308", STRONG: "#22c55e" }[r] ?? "#E6FF00");

// 0–100 scale thresholds
const scoreColor = (s: number) =>
  s < 45 ? "#ef4444" : s < 60 ? "#f97316" : s < 75 ? "#eab308" : "#22c55e";

const effortColor = (e: string) =>
  e === "LOW" ? "#22c55e" : e === "MEDIUM" ? "#eab308" : "#f97316";

// ─── Slide Components ────────────────────────────────────────────────────────

function SlideCover({ a }: { a: AuditData }) {
  const vColor = ["DOMINANT", "COMPETITIVE"].includes(a.overall.visibility_status) ? "#22c55e"
    : a.overall.visibility_status === "PARTIAL" ? "#eab308" : "#ef4444";

  return (
    <div className="ar-slide-inner">
      <span className="ar-slide-label">AI Visibility Audit</span>
      <h2 className="ar-cover-name">{a.business.name}</h2>
      <div className="ar-cover-rule" />
      <p className="ar-cover-context">{a.business.market_context}</p>
      {a.business.critical_finding && (
        <div className="ar-cover-critical">
          {a.business.critical_finding}
        </div>
      )}
      <div className="ar-cover-meta">
        {[
          { label: "TRADE", value: a.business.trade, color: "#f0f0f2" },
          { label: "MARKET", value: a.business.city, color: "#f0f0f2" },
          { label: "AI STATUS", value: a.overall.visibility_status, color: vColor },
          { label: "RISK", value: a.overall.risk_level, color: riskColor(a.overall.risk_level) },
        ].map(({ label, value, color }) => (
          <div className="ar-cover-meta-item" key={label}>
            <div className="ar-meta-key">{label}</div>
            <div className="ar-meta-val" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideExecutive({ a }: { a: AuditData }) {
  return (
    <div className="ar-slide-inner">
      <span className="ar-slide-label">Executive Summary</span>
      <p className="ar-exec-headline">{a.executive_summary.headline}</p>
      <div className="ar-exec-grid">
        <div className="ar-exec-scores">
          <div className="ar-score-ring" style={{ borderColor: gradeColor(a.overall.grade) }}>
            <div className="ar-score-val" style={{ color: gradeColor(a.overall.grade) }}>{a.overall.grade}</div>
            <div className="ar-score-sub">GRADE</div>
          </div>
          <div className="ar-score-ring ar-score-ring--yellow">
            <div className="ar-score-val ar-score-val--lg">{a.overall.score}</div>
            <div className="ar-score-sub">/ 100</div>
          </div>
        </div>
        <div className="ar-exec-situation">
          <div className="ar-card ar-card--accent" style={{ "--card-accent": riskColor(a.overall.risk_level) } as React.CSSProperties}>
            <div className="ar-card-label" style={{ color: riskColor(a.overall.risk_level) }}>Situation Assessment</div>
            <p className="ar-card-body">{a.executive_summary.situation}</p>
          </div>
        </div>
      </div>
      {a.executive_summary.cost_of_invisibility && (
        <div className="ar-cost-block">
          <div className="ar-cost-label">Cost of Invisibility</div>
          <p className="ar-cost-body">{a.executive_summary.cost_of_invisibility}</p>
        </div>
      )}
      <div className="ar-card ar-card--red">
        <div className="ar-card-label ar-card-label--red">If nothing changes</div>
        <p className="ar-card-body ar-card-body--red">{a.executive_summary.bottom_line}</p>
      </div>
    </div>
  );
}

function SlideJourney({ a }: { a: AuditData }) {
  return (
    <div className="ar-slide-inner">
      <span className="ar-slide-label">Buyer Journey Analysis</span>
      <p className="ar-journey-persona">
        <span className="ar-journey-persona-label">Primary Buyer: </span>
        {a.buyer_journey.persona}
      </p>
      <div className="ar-stages">
        {a.buyer_journey.stages.map(s => (
          <div className="ar-stage" key={s.stage}>
            <div className={`ar-stage-num${s.is_business_present ? " ar-stage-num--present" : " ar-stage-num--absent"}`}>
              {s.stage}
            </div>
            <div className="ar-stage-body">
              <div className="ar-stage-header">
                <span className="ar-stage-label">{s.label.toUpperCase()}</span>
                <span className={`ar-presence-tag${s.is_business_present ? " ar-presence-tag--present" : " ar-presence-tag--absent"}`}>
                  {s.is_business_present ? "PRESENT" : "ABSENT"}
                </span>
              </div>
              <p className="ar-stage-question">&ldquo;{s.buyer_question}&rdquo;</p>
              <p className="ar-stage-source">Answered by: <span className="ar-stage-source-name">{s.who_answers_now}</span></p>
              <p className="ar-stage-gap">↳ {s.gap}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SIGNAL_ORDER = ["geo", "aeo", "leo", "veo", "peo", "ieo"];

function SlideSignals({ a }: { a: AuditData }) {
  // Ensure all 6 signals render in canonical order
  const signalEntries = SIGNAL_ORDER
    .map(key => [key, a.signals[key]] as [string, Signal])
    .filter(([, s]) => !!s);

  return (
    <div className="ar-slide-inner">
      <span className="ar-slide-label">6-Signal Intelligence Breakdown</span>
      <div className="ar-signal-grid">
        {signalEntries.map(([key, s]) => {
          const col = scoreColor(s.score);
          return (
            <div className="ar-signal-card" key={key} style={{ "--signal-color": col } as React.CSSProperties}>
              <div className="ar-signal-head">
                <span className="ar-signal-acro">{key.toUpperCase()}</span>
                <span className="ar-signal-score" style={{ color: col }}>
                  {clampScore(s.score)}<span className="ar-signal-denom"> / 100</span>
                </span>
              </div>
              <p className="ar-signal-finding">{s.finding}</p>
              <div className="ar-gap-block">
                <div className="ar-gap-label">Gap</div>
                <p className="ar-gap-text">{s.gap}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlideCitations({ a }: { a: AuditData }) {
  return (
    <div className="ar-slide-inner">
      <span className="ar-slide-label">Citation Landscape</span>
      <p className="ar-citation-summary">{a.citation_landscape.summary}</p>
      <div className="ar-citations">
        {a.citation_landscape.sources_winning.map((s, i) => (
          <div className="ar-citation-item" key={i}>
            <div className="ar-citation-dot" style={{ background: riskColor(s.threat_level) }} />
            <div className="ar-citation-body">
              <div className="ar-citation-header">
                <span className="ar-citation-source">{s.source_type}</span>
                <span className="ar-threat-tag" style={{ color: riskColor(s.threat_level), borderColor: `${riskColor(s.threat_level)}33`, background: `${riskColor(s.threat_level)}11` }}>
                  {s.threat_level} THREAT
                </span>
              </div>
              <p className="ar-citation-why">{s.why_they_win}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="ar-card ar-card--accent" style={{ "--card-accent": "#E6FF00" } as React.CSSProperties}>
        <div className="ar-card-label">What It Takes to Win</div>
        <p className="ar-card-body">{a.citation_landscape.what_it_takes_to_win}</p>
      </div>
    </div>
  );
}

function SlideContent({ a }: { a: AuditData }) {
  return (
    <div className="ar-slide-inner">
      <span className="ar-slide-label">Content Gap Analysis</span>
      <p className="ar-content-summary">{a.content_gap_analysis.summary}</p>
      <div className="ar-content-list">
        {a.content_gap_analysis.missing_content.map((c, i) => (
          <div className="ar-content-item" key={i}>
            <div className={`ar-content-num${c.priority === "HIGH" ? " ar-content-num--high" : " ar-content-num--med"}`}>
              {i + 1}
            </div>
            <div className="ar-content-body">
              <div className="ar-content-header">
                <span className="ar-content-type">{c.content_type}</span>
                <span className={`ar-priority-tag${c.priority === "HIGH" ? " ar-priority-tag--high" : " ar-priority-tag--med"}`}>
                  {c.priority}
                </span>
                <span className="ar-stage-ref">{c.buyer_stage}</span>
              </div>
              <p className="ar-content-why">{c.why_it_matters}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideRoadmap({ a }: { a: AuditData }) {
  return (
    <div className="ar-slide-inner">
      <span className="ar-slide-label">90-Day Priority Roadmap</span>
      <div className="ar-roadmap">
        {a.priority_roadmap.map(r => {
          const isUrgent = r.timeframe.startsWith("Week");
          const isLater = r.timeframe === "Month 3";
          const numClass = [
            "ar-roadmap-num",
            r.rank === 1 ? "ar-roadmap-num--first" : "",
            isUrgent && r.rank !== 1 ? "ar-roadmap-num--urgent" : "",
            isLater ? "ar-roadmap-num--later" : "",
          ].filter(Boolean).join(" ");

          return (
            <div className={`ar-roadmap-item${isUrgent ? " ar-roadmap-item--urgent" : ""}`} key={r.rank}>
              <div className={numClass}>{r.rank}</div>
              <div className="ar-roadmap-body">
                <div className="ar-roadmap-meta">
                  <span className="ar-roadmap-time">{r.timeframe}</span>
                  <span className="ar-roadmap-cat">{r.category.toUpperCase()}</span>
                  <span className="ar-effort-tag" style={{ color: effortColor(r.effort) }}>{r.effort}</span>
                </div>
                <p className="ar-roadmap-action">{r.action}</p>
                <p className="ar-roadmap-impact">→ {r.expected_impact}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SlideClose({ a }: { a: AuditData }) {
  return (
    <div className="ar-slide-inner">
      <span className="ar-slide-label">The 6Signal Recommendation</span>
      <p className="ar-close-hook">{a.retainer_case.hook}</p>
      <div className="ar-card ar-card--accent" style={{ "--card-accent": "#E6FF00" } as React.CSSProperties}>
        <div className="ar-card-label">What 6Signal Builds in 90 Days</div>
        <p className="ar-card-body">{a.retainer_case.what_6signal_builds}</p>
      </div>
      <div className="ar-card ar-card--red">
        <div className="ar-card-label ar-card-label--red">Cost of Inaction</div>
        <p className="ar-card-body ar-card-body--red">{a.retainer_case.cost_of_inaction}</p>
      </div>

      {/* ── Three-option upgrade block ── */}
      <div className="ar-upgrade-section">
        <div className="ar-upgrade-eyebrow">Your Next Step</div>
        <div className="ar-upgrade-grid">

          {/* Card 1 — What you have */}
          <div className="ar-upgrade-card ar-upgrade-card--subdued">
            <div className="ar-upgrade-tag">What You Have</div>
            <div className="ar-upgrade-title">AI Visibility Audit</div>
            <p className="ar-upgrade-body ar-upgrade-body--muted">
              The complete audit you&rsquo;re reading now — all 6 signals diagnosed,
              buyer journey mapped, citation landscape and content gaps identified.
            </p>
            <div className="ar-upgrade-price ar-upgrade-price--muted">$27 — complete</div>
            <div className="ar-upgrade-you-are-here">You&rsquo;re here.</div>
          </div>

          {/* Card 2 — Strategy Brief (featured) */}
          <div className="ar-upgrade-card ar-upgrade-card--featured">
            <div className="ar-upgrade-tag ar-upgrade-tag--accent">Recommended Next Step</div>
            <div className="ar-upgrade-title ar-upgrade-title--lg">Strategy Brief</div>
            <p className="ar-upgrade-body">
              Every gap in your audit becomes an exact implementation plan. Signal-by-signal
              action plans with weekly tasks, content architecture with specific page specs and
              H1s, schema code ready to deploy, review velocity strategy, and a week-by-week
              90-day calendar.
            </p>
            <div className="ar-upgrade-price ar-upgrade-price--lg">$97</div>
            <div className="ar-upgrade-price-sub">Delivered immediately. PDF included.</div>
            <div className="ar-upgrade-btn-wrap">
              <button
                className="btn btn-primary ar-upgrade-btn"
                onClick={() => {
                  localStorage.setItem("6sig_audit_result", JSON.stringify(a));
                  window.location.href = "https://buy.stripe.com/cNi3cw4pogvN6GZfLP3ks0q";
                }}
              >
                Get the Strategy Brief →
              </button>
            </div>
            {/* PDF-only text link */}
            <div className="ar-upgrade-pdf-link">
              Get the Strategy Brief: 6signal.co/strategy-brief
            </div>
          </div>

          {/* Card 3 — Strategy Call */}
          <div className="ar-upgrade-card ar-upgrade-card--outlined">
            <div className="ar-upgrade-tag">Fastest Path to Results</div>
            <div className="ar-upgrade-title">1-Hour Strategy Call</div>
            <p className="ar-upgrade-body ar-upgrade-body--muted">
              Walk through your audit live with Matt Vincent Walker. Pressure-test the roadmap.
              Leave with a clear execution decision — and the option to engage 6Signal&rsquo;s
              retainer directly.
            </p>
            <div className="ar-upgrade-price ar-upgrade-price--lg">$197</div>
            <div className="ar-upgrade-price-sub ar-upgrade-price-sub--muted">Includes the Strategy Brief at no extra charge.</div>
            <div className="ar-upgrade-btn-wrap">
              <button
                className="btn btn-ghost ar-upgrade-btn"
                onClick={() => {
                  localStorage.setItem("6sig_audit_result", JSON.stringify(a));
                  window.location.href = "https://buy.stripe.com/3cI00kcVUdjB8P76bf3ks0x";
                }}
              >
                Book the Call →
              </button>
            </div>
            {/* PDF-only text link */}
            <div className="ar-upgrade-pdf-link">
              Book the 1-Hour Call — $197: 6signal.co/strategy-call
            </div>
          </div>

        </div>
        <div className="ar-upgrade-contact">Questions? hello@6signal.co</div>
      </div>
    </div>
  );
}

const SLIDE_COMPONENTS = [
  SlideCover, SlideExecutive, SlideJourney, SlideSignals,
  SlideCitations, SlideContent, SlideRoadmap, SlideClose,
];

// ─── Main Results Inner ───────────────────────────────────────────────────────

function AuditResultsInner() {
  useMicroInteractions();

  const [audit, setAudit] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [auditPermalinkId, setAuditPermalinkId] = useState<string | null>(() => {
    try { return localStorage.getItem("6sig_audit_id"); } catch { return null; }
  });

  const handlePrint = useCallback(() => { window.print(); }, []);

  // Fire Purchase $27 once for fresh post-purchase arrivals (not permalink/recovery loads)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("id") || params.get("intake")) return;
    const intakeId = (() => { try { return localStorage.getItem("6sig_intake_id"); } catch { return null; } })();
    const key = `6sig_pxl_p27_${intakeId ?? "default"}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch { return; }
    trackEvent("Purchase", { value: 27.00, currency: "USD" });
  }, []);

  const getFormData = () => {
    try {
      const stored = localStorage.getItem("6sig_audit_data");
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return null;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const permalinkId = params.get("id");
    const intakeParam = params.get("intake");

    // Cache-first: use pre-generated result if available (skip when following
    // a permalink — the stored version is the source of truth there)
    if (!permalinkId) {
      try {
        const cached = localStorage.getItem("6sig_audit_result");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.business?.name) {
            setAudit(parsed);
            return;
          }
        }
      } catch { /* ignore */ }
    }

    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[msgIdx]);
    }, 2200);

    (async () => {
      // Permalink: render a previously generated brief without regenerating.
      // A permalink id names one specific report — if it fails to load, show
      // an error. Never fall through to whatever business data happens to be
      // cached locally from an unrelated earlier session on this browser.
      if (permalinkId) {
        setLoading(true);
        setAuditPermalinkId(permalinkId);
        try {
          const r = await fetch(`/api/audit/${permalinkId}`);
          if (r.ok) {
            const saved = await r.json();
            if (saved?.payload?.business?.name) {
              setAudit(saved.payload);
              localStorage.setItem("6sig_audit_result", JSON.stringify(saved.payload));
              clearInterval(interval);
              setLoading(false);
              return;
            }
          }
        } catch { /* handled below */ }
        clearInterval(interval);
        setLoading(false);
        setError("Couldn't load this report. Please contact hello@6signal.co.");
        return;
      }

      // Form data: localStorage first, then server-side intake (recovery link
      // from the purchase email — works on any device)
      let data = getFormData();
      let intakeId: string | null = localStorage.getItem("6sig_intake_id");
      if ((!data || !data.name) && intakeParam) {
        try {
          const r = await fetch(`/api/intake/${intakeParam}`);
          if (r.ok) {
            const intake = await r.json();
            if (intake?.form?.name) {
              data = intake.form;
              intakeId = intakeParam;
              localStorage.setItem("6sig_audit_data", JSON.stringify(intake.form));
            }
          }
        } catch { /* ignore */ }
      }
      if (intakeParam) intakeId = intakeParam;

      if (!data || !data.name) {
        clearInterval(interval);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const r = await fetch("/api/generate-audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // notify=true only on a genuine first generation — not when
          // re-viewing via a recovery link (?intake=) or permalink (?id=).
          body: JSON.stringify({ ...data, intakeId: intakeId ?? undefined, notify: !intakeParam }),
        });
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        const auditId = r.headers.get("x-audit-id");
        if (auditId) { localStorage.setItem("6sig_audit_id", auditId); setAuditPermalinkId(auditId); }
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
        const auditData = parsed.audit ?? parsed;
        setAudit(auditData);
        localStorage.setItem("6sig_audit_result", JSON.stringify(auditData));
      } catch {
        setError("Something went wrong generating your audit. Please contact hello@6signal.co.");
      } finally {
        clearInterval(interval);
        setLoading(false);
      }
    })();

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = SLIDE_LABELS.length;
  const hasData = !!getFormData()?.name;
  const hasRecoveryParam =
    typeof window !== "undefined" && /[?&](id|intake)=/.test(window.location.search);

  // ─── No data ───
  if (!hasData && !hasRecoveryParam && !loading && !audit) {
    return (
      <div className="ar-page">
        <div id="cursor-dot" aria-hidden="true" />
        <div id="cursor-ring" aria-hidden="true" />
        <Nav />
        <div className="ar-state-wrap">
          <div className="ar-error-block">
            <span className="idx">Error</span>
            <h1 className="display ar-error-h1">We couldn&rsquo;t find your audit data.</h1>
            <p className="ar-error-body">This usually happens when a session expired or you navigated directly to this page.</p>
            <Link href="/visibility-check" className="btn btn-primary">Start the audit →</Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Loading ───
  if (loading) {
    return (
      <div className="ar-page">
        <div id="cursor-dot" aria-hidden="true" />
        <div id="cursor-ring" aria-hidden="true" />
        <Nav />
        <div className="ar-state-wrap">
          <div className="ar-loading-block">
            <div className="ar-loading-dot" />
            <p className="ar-loading-msg">{loadingMsg}</p>
            <p className="ar-loading-sub">Generating your AI Visibility Audit...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <div className="ar-page">
        <div id="cursor-dot" aria-hidden="true" />
        <div id="cursor-ring" aria-hidden="true" />
        <Nav />
        <div className="ar-state-wrap">
          <div className="ar-error-block">
            <span className="idx">Generation Failed</span>
            <h1 className="display ar-error-h1">Something went wrong.</h1>
            <p className="ar-error-body">{error}</p>
            <a href="mailto:hello@6signal.co" className="btn btn-primary">Contact hello@6signal.co</a>
          </div>
        </div>
      </div>
    );
  }

  if (!audit) return null;

  return (
    <div className="ar-page">
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
      <Nav />
      <main className="ar-main">
        <div className="wrap">

          {/* ── Deck header ── */}
          <div className="ar-deck-header">
            <div>
              <span className="idx">AI Visibility Audit</span>
              <h1 className="ar-deck-name">{audit.business.name}</h1>
            </div>
            <div className="ar-deck-meta">
              <span className="ar-deck-meta-item">{audit.business.trade}</span>
              <span className="ar-deck-meta-sep">·</span>
              <span className="ar-deck-meta-item">{audit.business.city}</span>
              <span className="ar-deck-meta-sep">·</span>
              <button className="ar-print-btn" onClick={handlePrint}>Download PDF</button>
            </div>
          </div>

          {/* ── Tab nav ── */}
          <div className="ar-tabs" role="tablist">
            {SLIDE_LABELS.map((label, i) => (
              <button
                key={i}
                className={`ar-tab${slide === i ? " ar-tab--active" : ""}`}
                onClick={() => setSlide(i)}
                role="tab"
                aria-selected={slide === i}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Slides ── */}
          {SLIDE_COMPONENTS.map((Comp, i) => (
            <div className={`ar-slide-wrap${i !== slide ? " ar-slide-inactive" : ""}`} key={i}>
              <div className="ar-slide-shell">
                <div className="ar-slide-grid-bg" aria-hidden />
                <div className="ar-slide-top-bar">
                  <div className="ar-slide-top-brand">
                    <div className="ar-brand-dot" />
                    <span className="ar-brand-name">6SIGNAL</span>
                  </div>
                  <span className="ar-slide-top-title">AI VISIBILITY INTELLIGENCE BRIEF</span>
                </div>
                <Comp a={audit} />
                <div className="ar-slide-footer">
                  <span className="ar-slide-footer-biz">{audit.business.name.toUpperCase()} · {audit.business.city.toUpperCase()}</span>
                  <span className="ar-slide-footer-num">{i + 1} / {total}</span>
                </div>
              </div>
            </div>
          ))}

          {/* ── PDF back cover — hidden on screen, visible in print ── */}
          <div className="ar-slide-wrap ar-slide-inactive ar-pdf-back-cover-wrap">
            <div className="ar-pdf-back-cover">
              <img src="/6SIG_LOGO_FINAL_2.webp" alt="6Signal" className="ar-pdf-back-logo" />
              <div className="ar-pdf-back-tagline">AI Visibility Starts Here</div>
              <div className="ar-pdf-back-url">6signal.co</div>
              <div className="ar-pdf-back-email">hello@6signal.co</div>
              <div className="ar-pdf-back-next">
                {auditPermalinkId
                  ? `Next step: Upgrade to the Strategy Brief — $97. Available anytime on your results page: 6signal.co/audit-results?id=${auditPermalinkId}`
                  : "Next step: Upgrade to the Strategy Brief — $97. Available anytime on your results page at 6signal.co"}
              </div>
            </div>
          </div>

          {/* ── Prev / Next ── */}
          <div className="ar-nav">
            <button
              className="btn btn-ghost ar-nav-btn"
              onClick={() => setSlide(s => Math.max(0, s - 1))}
              disabled={slide === 0}
            >
              ← Prev
            </button>
            <span className="ar-nav-counter">{slide + 1} / {total}</span>
            <button
              className={`ar-nav-btn${slide < total - 1 ? " btn btn-primary" : " btn btn-ghost"}`}
              onClick={() => setSlide(s => Math.min(total - 1, s + 1))}
              disabled={slide === total - 1}
            >
              Next →
            </button>
          </div>

          {/* ── Upsell (below slides, screen only) ── */}
          <div className="ar-upsell-section rule">
            <div className="sec-head">
              <div className="left">
                <span className="idx">Next steps</span>
                <h2 className="display">
                  What happens<br /><em>after the brief.</em>
                </h2>
              </div>
              <div className="right">
                You have the intelligence. The question is what you do with it. Three options below — choose what fits where you are right now.
              </div>
            </div>

            <div className="ar-upsell-grid">
              <div className="ar-upsell-card">
                <div className="ar-upsell-tag">What You Have</div>
                <h3 className="ar-upsell-title">AI Visibility Audit</h3>
                <p className="ar-upsell-desc">The 8-slide audit you just received — buyer journey, signal scores, citation gaps, content gaps, and 90-day roadmap.</p>
                <div className="ar-upsell-price">$27 — complete</div>
              </div>

              <div className="ar-upsell-card ar-upsell-card--featured">
                <div className="ar-upsell-tag ar-upsell-tag--featured">Recommended Next Step</div>
                <h3 className="ar-upsell-title">Strategy Brief</h3>
                <p className="ar-upsell-desc">Written strategy document with prioritized action plan, content architecture recommendations, and schema implementation guide — built from your audit.</p>
                <div className="ar-upsell-price">$97</div>
                <button
                  className="btn btn-primary ar-upsell-cta"
                  onClick={() => {
                    if (audit) localStorage.setItem("6sig_audit_result", JSON.stringify(audit));
                    window.location.href = "https://buy.stripe.com/cNi3cw4pogvN6GZfLP3ks0q";
                  }}
                >
                  Get the Strategy Brief →
                </button>
              </div>

              <div className="ar-upsell-card">
                <div className="ar-upsell-tag">Fastest Path</div>
                <h3 className="ar-upsell-title">1-Hour Strategy Call</h3>
                <p className="ar-upsell-desc">Live call with Matt Vincent Walker. Walk through your brief together and leave with a clear action plan and the option to engage 6Signal directly.</p>
                <div className="ar-upsell-price">$197</div>
                <button
                  className="btn btn-ghost ar-upsell-cta"
                  onClick={() => {
                    if (audit) localStorage.setItem("6sig_audit_result", JSON.stringify(audit));
                    window.location.href = "https://buy.stripe.com/3cI00kcVUdjB8P76bf3ks0x";
                  }}
                >
                  Book the Call →
                </button>
              </div>
            </div>

            <p className="ar-contact-line">
              Questions? <a href="mailto:hello@6signal.co" className="ar-contact-link">hello@6signal.co</a>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}

// ─── Export with Suspense boundary ───────────────────────────────────────────

export default function AuditResultsPage() {
  return (
    <Suspense fallback={
      <div className="ar-page">
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
      <AuditResultsInner />
    </Suspense>
  );
}
