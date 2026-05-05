import { Testimonial } from "../../proof-data";
import ProofNeededPlaceholder from "./ProofNeededPlaceholder";

export default function TestimonialCard({ t }: { t: Testimonial }) {
  if (t.status === "needed") {
    return <ProofNeededPlaceholder type="testimonial" />;
  }

  return (
    <div className="tc-card">
      {t.status === "anonymized" && (
        <span className="proof-badge proof-badge--anonymized">Anonymized</span>
      )}
      <blockquote className="tc-quote">&ldquo;{t.quote}&rdquo;</blockquote>
      <div className="tc-meta">
        <span className="tc-name">{t.clientName}</span>
        <span className="tc-company">{t.company}</span>
        <span className="tc-detail">
          {t.trade} · {t.location}
        </span>
        <span className="tc-service">{t.serviceUsed}</span>
      </div>
    </div>
  );
}
