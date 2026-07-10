import React from "react";
import { Sparkline } from "6signal-site";

// Components presume the 6 Signal dark ground — wrap every cell in it.
const Ground = ({ children, width }: { children: React.ReactNode; width?: number }) => (
  <div style={{ background: "#060606", padding: 20, display: "inline-block", ...(width ? { width } : {}) }}>{children}</div>
);

export const Rising = () => <Ground><Sparkline values={[25, 33, 41, 50, 58, 67]} color="#5ad1ff" /></Ground>;
export const Falling = () => <Ground><Sparkline values={[92, 92, 83, 83, 75, 67]} color="#f97316" /></Ground>;
export const Flat = () => <Ground><Sparkline values={[50, 50, 50, 58, 50, 50]} color="#b48aff" width={200} height={34} /></Ground>;
