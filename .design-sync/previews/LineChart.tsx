import React from "react";
import { LineChart } from "6signal-site";

// Components presume the 6 Signal dark ground — wrap every cell in it.
const Ground = ({ children, width }: { children: React.ReactNode; width?: number }) => (
  <div style={{ background: "#060606", padding: 20, display: "inline-block", ...(width ? { width } : {}) }}>{children}</div>
);

const days = ["07-01", "07-08", "07-15", "07-22", "07-29", "08-05"];

export const MultiEngine = () => (
  <Ground width={700}>
    <LineChart
      days={days}
      series={[
        { label: "ChatGPT", color: "#5ad1ff", values: [42, 50, 58, 58, 67, 75] },
        { label: "Gemini", color: "#ffd166", values: [83, 83, 92, 92, 92, 92] },
        { label: "Perplexity", color: "#b48aff", values: [50, 50, 58, 67, 67, 69] },
        { label: "Overall", color: "#E6FF00", values: [48, 55, 61, 66, 70, 74] },
      ]}
    />
  </Ground>
);

export const SingleTrend = () => (
  <Ground width={700}>
    <LineChart days={days} series={[{ label: "Overall", color: "#E6FF00", values: [22, 31, 38, 47, 55, 63] }]} height={150} />
  </Ground>
);
