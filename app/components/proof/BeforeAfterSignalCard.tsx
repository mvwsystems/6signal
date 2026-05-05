import { BeforeAfterSignal } from "../../proof-data";
import ProofNeededPlaceholder from "./ProofNeededPlaceholder";

export default function BeforeAfterSignalCard({ ba }: { ba: BeforeAfterSignal }) {
  if (ba.status === "needed") {
    return <ProofNeededPlaceholder type="before-after" note={ba.whatChanged} />;
  }

  return (
    <div className="ba-card">
      <div className="ba-layer-tag">{ba.layer}</div>
      <div className="ba-cols">
        <div className="ba-col">
          <span className="ba-col-label">Before</span>
          {ba.beforeScreenshot ? (
            <img src={ba.beforeScreenshot} alt="Signal before retainer work" className="ba-img" />
          ) : (
            <div className="ba-img-placeholder">Screenshot needed</div>
          )}
        </div>
        <div className="ba-col">
          <span className="ba-col-label">After</span>
          {ba.afterScreenshot ? (
            <img src={ba.afterScreenshot} alt="Signal after retainer work" className="ba-img" />
          ) : (
            <div className="ba-img-placeholder">Screenshot needed</div>
          )}
        </div>
      </div>
      <p className="ba-what">{ba.whatChanged}</p>
    </div>
  );
}
