import React from "react";
import { Radar } from "6signal-site";

// Components presume the 6 Signal dark ground — wrap every cell in it.
const Ground = ({ children, width }: { children: React.ReactNode; width?: number }) => (
  <div style={{ background: "#060606", padding: 20, display: "inline-block", ...(width ? { width } : {}) }}>{children}</div>
);

export const StrongProfile = () => (
  <Ground><Radar scores={{ geo: 82, aeo: 74, leo: 88, veo: 61, peo: 79, ieo: 90 }} /></Ground>
);

export const InvisibleBusiness = () => (
  <Ground><Radar scores={{ geo: 12, aeo: 8, leo: 34, veo: 15, peo: 22, ieo: 41 }} /></Ground>
);

export const MixedSignals = () => (
  <Ground><Radar scores={{ geo: 77, aeo: 45, leo: 20, veo: 38, peo: 69, ieo: 85 }} size={240} /></Ground>
);
