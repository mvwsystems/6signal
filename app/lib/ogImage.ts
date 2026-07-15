// Branded social share cards (1200×630 PNG) for published guides. satori lays
// the card out (flexbox → SVG, text converted to paths using fonts fetched
// from Google Fonts at runtime), resvg rasterizes. Brand fonts/colors are
// passed per client so every site's cards match its own identity.

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

interface FontSet { display: ArrayBuffer; body: ArrayBuffer; mono: ArrayBuffer }
const fontCache = new Map<string, FontSet>();

async function fetchTtf(family: string, weight: number): Promise<ArrayBuffer> {
  // Without a browser UA, Google Fonts serves TTF urls — which satori needs.
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`, {
    headers: { "User-Agent": "curl/8" },
  }).then((r) => r.text());
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) throw new Error(`No TTF url for ${family}:${weight}`);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Font fetch ${family} → ${r.status}`);
  return r.arrayBuffer();
}

async function loadFonts(displayFamily: string, bodyFamily: string): Promise<FontSet> {
  const key = `${displayFamily}|${bodyFamily}`;
  const hit = fontCache.get(key);
  if (hit) return hit;
  const [display, body, mono] = await Promise.all([
    fetchTtf(displayFamily, 800).catch(() => fetchTtf(displayFamily, 700)),
    fetchTtf(bodyFamily, 400),
    fetchTtf("JetBrains Mono", 500),
  ]);
  const set = { display, body, mono };
  fontCache.set(key, set);
  return set;
}

export interface OgBrand {
  name: string;            // "X-Act Plumbing LLC"
  accent: string;          // "#b42824"
  bg: string;              // "#0b0a0a"
  displayFamily: string;   // "Barlow Condensed"
  bodyFamily: string;      // "Barlow"
  domain: string;          // "www.x-actplumbing.com"
  phone?: string | null;   // "(469) 505-8362"
}

/** Render a guide share card. Returns a PNG buffer. */
export async function generateOgPng(brand: OgBrand, title: string, eyebrow = "Field Guide"): Promise<Buffer> {
  const fonts = await loadFonts(brand.displayFamily, brand.bodyFamily);
  const titleSize = title.length > 70 ? 58 : title.length > 45 ? 68 : 80;

  // satori element trees (no JSX in this codebase's lib layer). satori accepts
  // plain {type, props} objects; the ReactNode cast satisfies its signature.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const el = (type: string, style: Record<string, unknown>, children?: unknown): any =>
    ({ type, props: { style, children } });

  const svg = await satori(
    el("div", {
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      background: brand.bg, padding: "64px 72px 56px 88px", position: "relative",
    }, [
      // accent spine + faint oversize watermark bar
      el("div", { position: "absolute", left: 0, top: 0, bottom: 0, width: 18, background: brand.accent }),
      el("div", { position: "absolute", right: -140, top: -140, width: 420, height: 420, transform: "rotate(24deg)", border: `2px solid ${brand.accent}`, opacity: 0.12 }),
      el("div", { position: "absolute", right: -80, top: -180, width: 420, height: 420, transform: "rotate(24deg)", border: `2px solid ${brand.accent}`, opacity: 0.07 }),
      // eyebrow
      el("div", {
        display: "flex", fontFamily: "Mono", fontSize: 26, letterSpacing: 8,
        color: brand.accent, textTransform: "uppercase",
      }, `${eyebrow} — ${brand.name}`.toUpperCase()),
      // title
      el("div", {
        display: "flex", marginTop: 34, fontFamily: "Display", fontWeight: 800,
        fontSize: titleSize, lineHeight: 1.04, color: "#f6f6f6",
        textTransform: "uppercase", maxWidth: 980,
      }, title),
      el("div", { display: "flex", flexGrow: 1 }),
      // footer
      el("div", { display: "flex", justifyContent: "space-between", alignItems: "center" }, [
        el("div", { display: "flex", fontFamily: "Mono", fontSize: 26, color: "rgba(246,246,246,0.55)" }, brand.domain),
        brand.phone
          ? el("div", { display: "flex", fontFamily: "Mono", fontSize: 26, color: brand.accent }, brand.phone)
          : el("div", { display: "flex" }),
      ]),
    ]),
    {
      width: 1200, height: 630,
      fonts: [
        { name: "Display", data: fonts.display, weight: 800 as const, style: "normal" as const },
        { name: "Body", data: fonts.body, weight: 400 as const, style: "normal" as const },
        { name: "Mono", data: fonts.mono, weight: 500 as const, style: "normal" as const },
      ],
    }
  );
  return Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng());
}
