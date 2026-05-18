import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Geometry — all values in px on a 512×512 canvas
const ARM_LEN = 190;
const ARM_THICK = 48;
const ANGLE = 40; // degrees

// Horizontal span of one arm: 190 × cos(40°) ≈ 146px
// Three tips at 100px intervals, centred at x=256:
//   leftEdge = tip0 − 146, rightEdge = tip2
//   (tip0 − 146 + tip0 + 200) / 2 = 256  →  tip0 = 229
const TIP = [229, 329, 429] as const;
const CY = 256; // vertical centre

const COLORS = ["#E6FF00", "#f0f0f0", "#707070"] as const;

// Returns style for one arm rectangle
function arm(
  tipX: number,
  color: string,
  dir: 1 | -1
): React.CSSProperties {
  return {
    position: "absolute",
    width: ARM_LEN,
    height: ARM_THICK,
    backgroundColor: color,
    left: tipX - ARM_LEN,
    top: CY - ARM_THICK / 2,
    transformOrigin: "right center",
    transform: `rotate(${dir * ANGLE}deg)`,
  };
}

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#060606",
          display: "flex",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Chevron 1 — yellow */}
        <div style={arm(TIP[0], COLORS[0], -1)} />
        <div style={arm(TIP[0], COLORS[0], 1)} />

        {/* Chevron 2 — white */}
        <div style={arm(TIP[1], COLORS[1], -1)} />
        <div style={arm(TIP[1], COLORS[1], 1)} />

        {/* Chevron 3 — dim */}
        <div style={arm(TIP[2], COLORS[2], -1)} />
        <div style={arm(TIP[2], COLORS[2], 1)} />
      </div>
    ),
    { ...size }
  );
}
