import React from "react";
import { Ring } from "6signal-site";

// Components presume the 6 Signal dark ground — wrap every cell in it.
const Ground = ({ children, width }: { children: React.ReactNode; width?: number }) => (
  <div style={{ background: "#060606", padding: 20, display: "inline-block", ...(width ? { width } : {}) }}>{children}</div>
);

export const Dominant = () => <Ground><Ring score={86} /></Ground>;
export const Visible = () => <Ground><Ring score={64} /></Ground>;
export const Emerging = () => <Ground><Ring score={52} /></Ground>;
export const Invisible = () => <Ground><Ring score={23} size={140} /></Ground>;
