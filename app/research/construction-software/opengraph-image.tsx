import { ImageResponse } from "next/og";
import {
  CONSTRUCTION_SOFTWARE,
  SOFTWARE_CATEGORIES,
  CATALOG_UPDATED,
} from "../../data/constructionSoftware";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The Construction Software Catalog | 6Signal Market Map";

const BG = "#060606";
const ACCENT = "#E6FF00";
const TEXT = "#f5f5f3";
const MUTED = "#5a5a5a";
const DIM = "#2e2e2c";
const RULE = "rgba(255,255,255,0.06)";

const CATEGORIES = SOFTWARE_CATEGORIES;

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&display=swap",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko",
        },
      }
    ).then((r) => r.text());
    const url = css.match(
      /src:\s*url\((.+?)\)\s*format\('(?:woff|truetype)'\)/
    )?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const fontData = await loadFont();
  const fonts = fontData
    ? [
        {
          name: "Chakra Petch",
          data: fontData,
          weight: 700 as const,
          style: "normal" as const,
        },
      ]
    : [];
  const ch = fontData ? '"Chakra Petch"' : "system-ui, sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: BG,
        }}
      >
        {/* ── LEFT PANEL ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "60px 56px 56px",
            borderRightWidth: 1,
            borderRightColor: RULE,
            borderRightStyle: "solid",
          }}
        >
          {/* Wordmark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: ACCENT,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: ch,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: "0.28em",
                color: ACCENT,
              }}
            >
              6 SIGNAL
            </span>
          </div>

          {/* Spacer */}
          <div style={{ display: "flex", flex: 1 }} />

          {/* Market Map label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 22,
            }}
          >
            <div
              style={{
                width: 28,
                height: 1,
                backgroundColor: ACCENT,
                opacity: 0.5,
              }}
            />
            <span
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 11,
                letterSpacing: "0.3em",
                color: ACCENT,
              }}
            >
              MARKET MAP
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: 36,
            }}
          >
            <span
              style={{
                fontFamily: ch,
                fontWeight: 700,
                fontSize: 58,
                letterSpacing: "-0.025em",
                lineHeight: 1.02,
                color: TEXT,
              }}
            >
              The Construction
            </span>
            <span
              style={{
                fontFamily: ch,
                fontWeight: 700,
                fontSize: 58,
                letterSpacing: "-0.025em",
                lineHeight: 1.02,
                color: "#7a7a78",
              }}
            >
              Software Catalog
            </span>
          </div>

          {/* Bottom meta */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              paddingTop: 20,
              borderTopWidth: 1,
              borderTopColor: "rgba(230,255,0,0.15)",
              borderTopStyle: "solid",
            }}
          >
            <span
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 12,
                color: MUTED,
                letterSpacing: "0.04em",
              }}
            >
              6signal.co
            </span>
            <span
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 12,
                color: "#1e1e1c",
              }}
            >
              ·
            </span>
            <span
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 12,
                color: DIM,
                letterSpacing: "0.04em",
              }}
            >
              {`${CONSTRUCTION_SOFTWARE.length} products · ${CATEGORIES.length} workflows · Sourced`}
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL — category index ───────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 370,
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "40px 28px 12px",
              gap: 16,
              borderBottomWidth: 1,
              borderBottomColor: RULE,
              borderBottomStyle: "solid",
            }}
          >
            <span
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 10,
                letterSpacing: "0.24em",
                color: "#252523",
                textTransform: "uppercase",
              }}
            >
              #
            </span>
            <span
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 10,
                letterSpacing: "0.24em",
                color: "#252523",
                textTransform: "uppercase",
              }}
            >
              CATEGORY
            </span>
          </div>

          {/* Category rows */}
          {CATEGORIES.map((cat, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "5px 28px",
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255,255,255,0.035)",
                borderBottomStyle: "solid",
                backgroundColor:
                  i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)",
              }}
            >
              <span
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: "#222220",
                  minWidth: 18,
                  flexShrink: 0,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                style={{
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 10.5,
                  letterSpacing: "0.01em",
                  color: i < 4 ? "#4a4a48" : "#2e2e2c",
                  lineHeight: 1.35,
                  flex: 1,
                }}
              >
                {cat}
              </span>
            </div>
          ))}

          {/* Bottom accent */}
          <div style={{ display: "flex", flex: 1 }} />
          <div
            style={{
              display: "flex",
              padding: "16px 28px",
              borderTopWidth: 1,
              borderTopColor: RULE,
              borderTopStyle: "solid",
            }}
          >
            <span
              style={{
                fontFamily: "system-ui, sans-serif",
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "#1e1e1c",
                textTransform: "uppercase",
              }}
            >
              {CATALOG_UPDATED}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
