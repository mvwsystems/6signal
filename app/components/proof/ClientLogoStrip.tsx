import { CLIENT_LOGOS } from "../../proof-data";
import ProofNeededPlaceholder from "./ProofNeededPlaceholder";

export default function ClientLogoStrip() {
  const published = CLIENT_LOGOS.filter((l) => l.status === "real" && l.logoSrc);

  if (published.length === 0) {
    return (
      <ProofNeededPlaceholder
        type="logos"
        note="Request white/transparent SVG or PNG from each client after onboarding. Confirm permission before publishing."
      />
    );
  }

  return (
    <div className="logo-strip">
      <span className="logo-strip-label">Working with</span>
      <div className="logo-strip-logos">
        {published.map((logo) => (
          <div key={logo.id} className="logo-item">
            <img src={logo.logoSrc!} alt={logo.name} />
          </div>
        ))}
      </div>
    </div>
  );
}
