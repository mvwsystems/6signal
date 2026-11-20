import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

export const dynamic = "force-dynamic";

// Matt's typed-style signature as a PNG, applied to the Provider signature
// field when a client signs (DocuSeal takes a public image URL). Replace it
// with a real scanned signature by setting CLOSE_SIGNATURE_IMAGE_URL.
let cache: Buffer | null = null;

async function fetchTtf(family: string): Promise<ArrayBuffer> {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}`, { headers: { "User-Agent": "curl/8" } }).then((r) => r.text());
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) throw new Error(`No TTF url for ${family}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

export async function GET() {
  if (!cache) {
    const name = process.env.CLOSE_SIGNER_NAME?.trim() || "Matt Vincent Walker";
    const font = await fetchTtf("Mrs Saint Delafield");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const el: any = { type: "div", props: { style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Sig", fontSize: 96, color: "#13235b" }, children: name } };
    const svg = await satori(el, { width: 900, height: 240, fonts: [{ name: "Sig", data: font, weight: 400, style: "normal" }] });
    cache = Buffer.from(new Resvg(svg, { fitTo: { mode: "width", value: 900 } }).render().asPng());
  }
  return new Response(new Uint8Array(cache), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
}
