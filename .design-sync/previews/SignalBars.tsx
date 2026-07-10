import React from "react";
import { SignalBars } from "6signal-site";

// Components presume the 6 Signal dark ground — wrap every cell in it.
const Ground = ({ children, width }: { children: React.ReactNode; width?: number }) => (
  <div style={{ background: "#060606", padding: 20, display: "inline-block", ...(width ? { width } : {}) }}>{children}</div>
);

export const ScoresOnly = () => (
  <Ground width={440}>
    <SignalBars scores={{ geo: 71, aeo: 46, leo: 24, veo: 39, peo: 66, ieo: 88 }} />
  </Ground>
);

export const WithFindings = () => (
  <Ground width={480}>
    <SignalBars
      scores={{ geo: 71, aeo: 46, leo: 24, veo: 39, peo: 66, ieo: 88 }}
      findings={{
        geo: { finding: "Named in 8 of 12 ChatGPT answers for plumbing queries in Red Oak.", gap: "Absent from Claude recommendations entirely." },
        leo: { finding: "12 Google reviews vs. 210 for the market leader.", gap: "Not in the top-10 map results for any tracked buyer question." },
      }}
    />
  </Ground>
);
