import { AuditExample } from "../../proof-data";

export default function AuditExampleCard({ a }: { a: AuditExample }) {
  return (
    <div className="ae-card">
      <div className="ae-header">
        <div className="ae-meta">
          <span className="ae-trade">{a.trade}</span>
          <span className="ae-sep">·</span>
          <span className="ae-market">{a.market}</span>
        </div>
        {(a.status === "real" || a.status === "anonymized") && (
          <span className={`proof-badge proof-badge--${a.status}`}>{a.statusLabel}</span>
        )}
      </div>
      <div className="ae-body">
        <div className="ae-row">
          <span className="ae-label">Issue found</span>
          <span className="ae-value">{a.issueFound}</span>
        </div>
        <div className="ae-row">
          <span className="ae-label">Appearing instead</span>
          <span className="ae-value">{a.competitorAppearing}</span>
        </div>
        <div className="ae-row ae-row--last">
          <span className="ae-label">First fix</span>
          <span className="ae-value ae-value--fix">{a.firstFixRecommended}</span>
        </div>
      </div>
    </div>
  );
}
