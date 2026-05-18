import { ImageResponse } from "next/og";
import { getAllPosts, getPostBySlug } from "../../lib/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "6 Signal Research";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

const BG = "#060606";
const ACCENT = "#E6FF00";
const TEXT = "#f5f5f3";
const MUTED = "#5a5a5a";
const DIM = "#383838";

function titleSize(title: string): number {
  if (title.length > 65) return 44;
  if (title.length > 45) return 52;
  return 60;
}

let _fontCache: { data: ArrayBuffer | null } | null = null;

async function loadFont(): Promise<ArrayBuffer | null> {
  if (_fontCache) return _fontCache.data;
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&display=swap",
      {
        headers: {
          // IE UA causes Google Fonts to return woff (supported by satori)
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko",
        },
      }
    ).then((r) => r.text());
    const url = css.match(
      /src:\s*url\((.+?)\)\s*format\('(?:woff|truetype)'\)/
    )?.[1];
    const data = url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
    _fontCache = { data };
    return data;
  } catch {
    _fontCache = { data: null };
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return new Response("Not found", { status: 404 });

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
  const display = fontData ? '"Chakra Petch"' : "system-ui, sans-serif";

  const isWP =
    post.category === "White Paper" || post.contentType === "White Paper";

  // ── White Paper: minimal brand card, no post-specific title ──────────────
  if (isWP) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            backgroundColor: BG,
            padding: "72px 80px",
          }}
        >
          {/* Wordmark */}
          <div
            style={{
              display: "flex",
              color: ACCENT,
              fontSize: 12,
              fontFamily: display,
              fontWeight: 700,
              letterSpacing: "0.25em",
            }}
          >
            6 SIGNAL
          </div>

          {/* Spacer */}
          <div style={{ display: "flex", flex: 1 }} />

          {/* Label */}
          <div
            style={{
              display: "flex",
              color: MUTED,
              fontSize: 12,
              letterSpacing: "0.2em",
              marginBottom: 24,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            WHITE PAPER
          </div>

          {/* Site */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              paddingTop: 20,
              borderTopWidth: 1,
              borderTopColor: "rgba(230, 255, 0, 0.18)",
              borderTopStyle: "solid",
            }}
          >
            <span
              style={{
                color: DIM,
                fontSize: 13,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              6signal.co
            </span>
          </div>
        </div>
      ),
      { ...size, fonts }
    );
  }

  // ── Post card ─────────────────────────────────────────────────────────────
  const label = (post.contentType || post.category).toUpperCase();
  const fs = titleSize(post.title);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: BG,
          padding: "72px 80px",
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            color: ACCENT,
            fontSize: 12,
            fontFamily: display,
            fontWeight: 700,
            letterSpacing: "0.25em",
          }}
        >
          6 SIGNAL
        </div>

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Category */}
        <div
          style={{
            display: "flex",
            color: MUTED,
            fontSize: 12,
            letterSpacing: "0.18em",
            marginBottom: 20,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {label}
        </div>

        {/* Accent bar + Title */}
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "flex-start",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 4,
              backgroundColor: ACCENT,
              alignSelf: "stretch",
              flexShrink: 0,
            }}
          />
          <div
            style={{
              display: "flex",
              color: TEXT,
              fontSize: fs,
              fontFamily: display,
              fontWeight: 700,
              lineHeight: 1.15,
            }}
          >
            {post.title}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: "rgba(230, 255, 0, 0.18)",
            borderTopStyle: "solid",
          }}
        >
          <span
            style={{
              color: DIM,
              fontSize: 13,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            6signal.co
          </span>
          <span
            style={{
              color: "#252525",
              fontSize: 13,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            ·
          </span>
          <span
            style={{
              color: DIM,
              fontSize: 13,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {post.readTime}
          </span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
