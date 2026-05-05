import { CaseStudy } from "../../proof-data";
import ProofNeededPlaceholder from "./ProofNeededPlaceholder";

export default function CaseStudyCard({ cs }: { cs: CaseStudy }) {
  if (cs.status === "needed") {
    return (
      <ProofNeededPlaceholder
        type="case-study"
        note={`${cs.trade} · ${cs.market} — ${cs.summary}`}
      />
    );
  }

  return (
    <div className="cs-card">
      <div className="cs-meta">
        <span className="cs-trade">{cs.trade}</span>
        <span className="cs-market">{cs.market}</span>
        {cs.status === "anonymized" && (
          <span className="proof-badge proof-badge--anonymized">Anonymized</span>
        )}
      </div>
      <h3 className="cs-headline">{cs.headline}</h3>
      <p className="cs-summary">{cs.summary}</p>
      {cs.results.length > 0 && (
        <ul className="cs-results">
          {cs.results.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      {cs.slug && (
        <a href={`/work/${cs.slug}`} className="cs-link">
          Read the full case study →
        </a>
      )}
    </div>
  );
}
