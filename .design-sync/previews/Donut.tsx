import React from "react";
import { Donut } from "6signal-site";

// Components presume the 6 Signal dark ground — wrap every cell in it.
const Ground = ({ children, width }: { children: React.ReactNode; width?: number }) => (
  <div style={{ background: "#060606", padding: 20, display: "inline-block", ...(width ? { width } : {}) }}>{children}</div>
);

export const ShareOfVoice = () => (
  <Ground>
    <Donut
      segments={[
        { label: "X-Act Plumbing", value: 30, color: "#E6FF00" },
        { label: "Republic Home Services", value: 20, color: "#74746e" },
        { label: "Options Plumbing", value: 18, color: "#8e8e86" },
        { label: "Roto-Rooter", value: 14, color: "#a8a8a0" },
        { label: "Verity Plumbing", value: 13, color: "#c2c2b8" },
      ]}
    />
  </Ground>
);

export const MarketLeader = () => (
  <Ground>
    <Donut
      size={180}
      segments={[
        { label: "Summit HVAC", value: 61, color: "#E6FF00" },
        { label: "Competitor A", value: 22, color: "#74746e" },
        { label: "Competitor B", value: 17, color: "#8e8e86" },
      ]}
    />
  </Ground>
);
