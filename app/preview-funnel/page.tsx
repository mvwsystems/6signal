"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMicroInteractions } from "../hooks/useMicroInteractions";

const LOADING_MSGS = [
  "Mapping buyer journey stages...",
  "Analyzing AI citation landscape...",
  "Scoring 6-signal framework...",
  "Identifying content gaps...",
  "Building intelligence brief...",
];

type Step = "form" | "loading-audit" | "audit-ready" | "loading-strategy" | "strategy-ready" | "error";

export default function PreviewFunnelPage() {
  useMicroInteractions();
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({ name: "", url: "", trade: "", city: "", competitors: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
  const [errorMsg, setErrorMsg] = useState("");

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.url.trim()) e.url = "Required";
    if (!form.trade.trim()) e.trade = "Required";
    if (!form.city.trim()) e.city = "Required";
    return e;
  };

  const runAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setStep("loading-audit");
    // Clear stale results from any previous business
    localStorage.removeItem("6sig_audit_result");
    localStorage.removeItem("6sig_strategy_result");
    localStorage.setItem("6sig_audit_data", JSON.stringify(form));

    let msgIdx = 0;
    setLoadingMsg(LOADING_MSGS[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[msgIdx]);
    }, 2200);

    try {
      const res = await fetch("/api/generate-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const reader = res.body!.getReader();
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
      const audit = parsed.audit ?? parsed;
      localStorage.setItem("6sig_audit_result", JSON.stringify(audit));
      setStep("audit-ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Audit generation failed.");
      setStep("error");
    } finally {
      clearInterval(interval);
    }
  };

  const runStrategy = async () => {
    setStep("loading-strategy");

    let msgIdx = 0;
    setLoadingMsg("Reading audit brief...");
    const stratMsgs = [
      "Reading audit brief...",
      "Building content architecture...",
      "Writing signal action plans...",
      "Mapping schema requirements...",
      "Drafting 90-day calendar...",
    ];
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % stratMsgs.length;
      setLoadingMsg(stratMsgs[msgIdx]);
    }, 2400);

    try {
      const stored = localStorage.getItem("6sig_audit_result");
      if (!stored) throw new Error("No audit data found.");
      const audit = JSON.parse(stored);

      const res = await fetch("/api/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audit }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const reader = res.body!.getReader();
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
      localStorage.setItem("6sig_strategy_result", JSON.stringify(strategyData));
      setStep("strategy-ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Strategy generation failed.");
      setStep("error");
    } finally {
      clearInterval(interval);
    }
  };

  const s = {
    page: {
      minHeight: "100vh",
      background: "#060606",
      fontFamily: "'Chakra Petch', monospace",
      color: "#f0f0f2",
      display: "flex",
      flexDirection: "column" as const,
    },
    header: {
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      padding: "18px 32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    brand: { display: "flex", alignItems: "center", gap: 8 },
    dot: { width: 7, height: 7, background: "#E6FF00", borderRadius: "50%" },
    brandName: { color: "#E6FF00", fontSize: 11, letterSpacing: "0.25em", fontWeight: 700 },
    badge: {
      background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
      color: "#ef4444", fontSize: 9, letterSpacing: "0.18em", padding: "4px 10px", borderRadius: 2,
    },
    wrap: { maxWidth: 680, margin: "0 auto", padding: "60px 24px", flex: 1 },
    eyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.3em", color: "#555553", marginBottom: 16, display: "block" as const },
    h1: { fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 300, letterSpacing: "-0.03em", lineHeight: 1.1, margin: "0 0 32px", color: "#f5f5f3" },
    label: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#555553", display: "block" as const, marginBottom: 7 },
    input: { width: "100%", background: "#0d0d10", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 3, padding: "13px 16px", color: "#f5f5f3", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const },
    errText: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#ef4444", marginTop: 4 },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
    field: { display: "flex", flexDirection: "column" as const },
    fieldFull: { display: "flex", flexDirection: "column" as const, marginBottom: 24 },
    btn: { background: "#E6FF00", color: "#060606", border: "none", borderRadius: 3, padding: "14px 28px", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", cursor: "pointer", fontFamily: "inherit" },
    btnGhost: { background: "transparent", color: "#f5f5f3", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 3, padding: "14px 28px", fontSize: 11, letterSpacing: "0.15em", cursor: "pointer", fontFamily: "inherit" },
    btnRow: { display: "flex", gap: 12, flexWrap: "wrap" as const },
    center: { display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", minHeight: 360, gap: 20, textAlign: "center" as const },
    loadDot: { width: 10, height: 10, background: "#E6FF00", borderRadius: "50%", animation: "pulse 1.8s ease-in-out infinite" },
    loadMsg: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: "#6b6b78" },
    successIcon: { width: 48, height: 48, borderRadius: "50%", border: "2px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", color: "#22c55e", fontSize: 22 },
    successTitle: { fontSize: 22, fontWeight: 400, color: "#f5f5f3", margin: 0 },
    successSub: { fontSize: 13, color: "#6b6b78", lineHeight: 1.6, maxWidth: 420, margin: 0 },
    divider: { width: "100%", height: 1, background: "rgba(255,255,255,0.07)", margin: "32px 0" },
    upsellBox: { background: "#0d0d10", border: "1px solid rgba(255,255,255,0.08)", borderTop: "2px solid #E6FF00", borderRadius: 4, padding: "28px 32px", display: "flex", flexDirection: "column" as const, gap: 12 },
    upsellTag: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#E6FF00" },
    upsellTitle: { fontSize: 18, fontWeight: 400, color: "#f5f5f3", margin: 0 },
    upsellDesc: { fontSize: 13, color: "#6b6b78", lineHeight: 1.6, margin: 0 },
    errorBox: { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 4, padding: "16px 20px", color: "#ef4444", fontSize: 13, lineHeight: 1.6 },
    step: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "#3a3a3a", marginBottom: 32 },
  };

  return (
    <div style={s.page}>
      <div id="cursor-dot" aria-hidden="true" />
      <div id="cursor-ring" aria-hidden="true" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #2a2a35; }
        input:focus { border-color: #E6FF00 !important; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.2} }
      `}</style>

      <header style={s.header}>
        <div style={s.brand}>
          <div style={s.dot} />
          <span style={s.brandName}>6SIGNAL</span>
        </div>
        <span style={s.badge}>INTERNAL PREVIEW — NOT FOR SHARING</span>
      </header>

      <div style={s.wrap}>

        {/* ── Step indicator ── */}
        {step !== "form" && (
          <div style={s.step}>
            {step === "loading-audit" && "STEP 1 OF 3 — GENERATING AUDIT BRIEF"}
            {step === "audit-ready" && "STEP 1 OF 3 — AUDIT BRIEF COMPLETE"}
            {step === "loading-strategy" && "STEP 2 OF 3 — GENERATING STRATEGY BRIEF"}
            {step === "strategy-ready" && "STEP 2 OF 3 — STRATEGY BRIEF COMPLETE"}
            {step === "error" && "ERROR"}
          </div>
        )}

        {/* ── Form ── */}
        {step === "form" && (
          <>
            <span style={s.eyebrow}>Internal Preview Tool</span>
            <h1 style={s.h1}>Preview the full<br />customer funnel.</h1>
            <p style={{ fontSize: 14, color: "#6b6b78", lineHeight: 1.65, marginBottom: 36 }}>
              Enter any business. This skips Stripe and goes straight to the output — so you can see exactly what customers receive at each step.
            </p>
            <form onSubmit={runAudit} noValidate>
              <div style={s.grid}>
                {[
                  { name: "name", label: "Business Name *", placeholder: "Acme Roofing" },
                  { name: "url", label: "Website URL *", placeholder: "https://acmeroofing.com" },
                  { name: "trade", label: "Trade / Service *", placeholder: "Roofing, Plumbing, HVAC..." },
                  { name: "city", label: "City / Market *", placeholder: "Fort Worth, TX" },
                ].map(f => (
                  <div style={{ ...s.field, borderColor: errors[f.name] ? "#ef4444" : undefined }} key={f.name}>
                    <label style={s.label}>{f.label}</label>
                    <input
                      style={{ ...s.input, borderColor: errors[f.name] ? "#ef4444" : "rgba(255,255,255,0.08)" }}
                      type="text"
                      placeholder={f.placeholder}
                      value={form[f.name as keyof typeof form]}
                      onChange={e => {
                        setForm(p => ({ ...p, [f.name]: e.target.value }));
                        setErrors(p => ({ ...p, [f.name]: "" }));
                      }}
                    />
                    {errors[f.name] && <span style={s.errText}>{errors[f.name]}</span>}
                  </div>
                ))}
              </div>
              <div style={s.fieldFull}>
                <label style={s.label}>Known Competitors (optional)</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="Competitor A, Competitor B..."
                  value={form.competitors}
                  onChange={e => setForm(p => ({ ...p, competitors: e.target.value }))}
                />
              </div>
              <button style={s.btn} type="submit">Generate Audit Brief →</button>
            </form>
          </>
        )}

        {/* ── Loading audit ── */}
        {step === "loading-audit" && (
          <div style={s.center}>
            <div style={s.loadDot} />
            <p style={s.loadMsg}>{loadingMsg}</p>
            <p style={{ fontSize: 12, color: "#3a3a3a" }}>Generating the $27 AI Visibility Audit...</p>
          </div>
        )}

        {/* ── Audit ready ── */}
        {step === "audit-ready" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={s.center}>
              <div style={s.successIcon}>✓</div>
              <h2 style={s.successTitle}>Audit Brief ready.</h2>
              <p style={s.successSub}>This is what your customer sees after paying $27. Click below to view the full 8-slide deck — exactly as they would.</p>
              <div style={s.btnRow}>
                <button style={s.btn} onClick={() => router.push("/audit-results")}>
                  View the $27 Audit →
                </button>
                <button style={{ ...s.btnGhost }} onClick={() => window.open("/audit-results", "_blank")}>
                  Open in new tab
                </button>
              </div>
            </div>
            <div style={s.divider} />
            <div style={s.upsellBox}>
              <span style={s.upsellTag}>Next step in funnel</span>
              <h3 style={s.upsellTitle}>Preview the $97 Strategy Brief</h3>
              <p style={s.upsellDesc}>Generate the full strategy document from this audit — content architecture, schema plan, signal action plans, and 90-day calendar. This is what customers see after the second upsell.</p>
              <div style={s.btnRow}>
                <button style={s.btn} onClick={runStrategy}>Generate Strategy Brief →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Loading strategy ── */}
        {step === "loading-strategy" && (
          <div style={s.center}>
            <div style={s.loadDot} />
            <p style={s.loadMsg}>{loadingMsg}</p>
            <p style={{ fontSize: 12, color: "#3a3a3a" }}>Generating the $97 Strategy Brief...</p>
          </div>
        )}

        {/* ── Strategy ready ── */}
        {step === "strategy-ready" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={s.center}>
              <div style={s.successIcon}>✓</div>
              <h2 style={s.successTitle}>Strategy Brief ready.</h2>
              <p style={s.successSub}>This is what your customer sees after paying $97. Click below to view the full strategy document — exactly as they would.</p>
              <div style={s.btnRow}>
                <button style={s.btn} onClick={() => router.push("/strategy-brief")}>
                  View the $97 Strategy Brief →
                </button>
                <button style={{ ...s.btnGhost }} onClick={() => window.open("/strategy-brief", "_blank")}>
                  Open in new tab
                </button>
              </div>
            </div>
            <div style={s.divider} />
            <div style={{ ...s.upsellBox, borderTopColor: "#6b6b78" }}>
              <span style={{ ...s.upsellTag, color: "#555553" }}>Final step in funnel</span>
              <h3 style={s.upsellTitle}>$197 Strategy Call</h3>
              <p style={s.upsellDesc}>Customers pay $197 via Stripe, then book the 1-hour Strategy Call via Calendly. That's the only step that requires your time.</p>
              <div style={s.btnRow}>
                <button style={s.btn} onClick={() => setStep("form")}>Preview a different business →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {step === "error" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={s.errorBox}>
              <strong>Error: </strong>{errorMsg}
            </div>
            <button style={s.btn} onClick={() => { setStep("form"); setErrorMsg(""); }}>
              Try again →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
