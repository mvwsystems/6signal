type ProofType =
  | "testimonial"
  | "before-after"
  | "logos"
  | "case-study"
  | "audit-example"
  | "generic";

interface Props {
  type: ProofType;
  note?: string;
}

const LABELS: Record<ProofType, string> = {
  testimonial: "Client testimonial needed",
  "before-after": "Before/after screenshot needed",
  logos: "Client logos needed",
  "case-study": "Case study needed (90+ days of retainer work)",
  "audit-example": "Real audit example needed",
  generic: "Proof content needed",
};

const INSTRUCTIONS: Record<ProofType, string> = {
  testimonial:
    "Ask retainer clients for a specific quote after the first 30-day check-in. Two questions: what surprised you in the audit, and what changed in the first 60–90 days.",
  "before-after":
    "Screenshot AI prompt responses and Maps listings before any retainer work begins. Same screenshots at 60 and 90 days.",
  logos:
    "Request white/transparent SVG or PNG from each client after onboarding. Confirm permission before publishing.",
  "case-study":
    "Document after 90 days: starting audit findings, work completed per layer, measurable outcomes the client can verify. Never claim results you can't attribute directly.",
  "audit-example":
    "After each paid audit, ask if you can document the finding — anonymized or named. Screenshot before remediation begins.",
  generic: "Replace this placeholder with real proof when available.",
};

export default function ProofNeededPlaceholder({ type, note }: Props) {
  return (
    <div className="proof-placeholder">
      <div className="pp-header">
        <span className="pp-badge">PLACEHOLDER</span>
        <span className="pp-type">{LABELS[type]}</span>
      </div>
      <p className="pp-instruction">{INSTRUCTIONS[type]}</p>
      {note && <p className="pp-note">{note}</p>}
    </div>
  );
}
