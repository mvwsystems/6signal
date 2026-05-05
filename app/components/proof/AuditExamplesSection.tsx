import { AUDIT_EXAMPLES } from "../../proof-data";
import AuditExampleCard from "./AuditExampleCard";

interface Props {
  trade?: string;
  maxItems?: number;
  idx?: string;
  headlineTop?: string;
  headlineEm?: string;
  deckRight?: string;
}

export default function AuditExamplesSection({
  trade,
  maxItems = 4,
  idx = "What audits find",
  headlineTop = "Common findings.",
  headlineEm = "Live on the call.",
  deckRight = "These are the types of gaps that come up across trades and markets — shown as illustrative format examples of how the audit read works.",
}: Props) {
  const items = AUDIT_EXAMPLES.filter((a) =>
    trade ? a.trade.toLowerCase() === trade.toLowerCase() : true
  ).slice(0, maxItems);

  if (items.length === 0) return null;

  return (
    <section className="proof-section rule">
      <div className="wrap">
        <div className="sec-head">
          <div className="left">
            <span className="idx">{idx}</span>
            <h2 className="display">
              {headlineTop}
              <br />
              <em>{headlineEm}</em>
            </h2>
          </div>
          <div className="right">{deckRight}</div>
        </div>
        <div className="proof-grid">
          {items.map((a) => (
            <AuditExampleCard key={a.id} a={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
