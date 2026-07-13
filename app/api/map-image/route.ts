import { NextRequest, NextResponse } from "next/server";

// Dark-styled Google Static Map proxy for the coverage heat map. Proxied so
// the Google key stays server-side (share pages are public). Requires the
// "Maps Static API" to be enabled on the same Google Cloud key as Places.

const STYLES = [
  "feature:all|element:geometry|color:0x101010",
  "feature:all|element:labels.text.fill|color:0x8a8a82",
  "feature:all|element:labels.text.stroke|color:0x060606",
  "feature:all|element:labels.icon|visibility:off",
  "feature:road|element:geometry|color:0x1d1d1a",
  "feature:road.highway|element:geometry|color:0x2a2a24",
  "feature:water|element:geometry|color:0x0b0e12",
  "feature:poi|visibility:off",
  "feature:transit|visibility:off",
  "feature:administrative.locality|element:labels.text.fill|color:0xb5b5ac",
];

export async function GET(req: NextRequest) {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: "not configured" }, { status: 501 });
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  const zoom = Math.round(Number(req.nextUrl.searchParams.get("zoom")));
  if (!Number.isFinite(lat) || Math.abs(lat) > 85 || !Number.isFinite(lng) || Math.abs(lng) > 180 || !Number.isFinite(zoom) || zoom < 3 || zoom > 16) {
    return NextResponse.json({ error: "bad params" }, { status: 400 });
  }
  const params = new URLSearchParams({
    center: `${lat.toFixed(6)},${lng.toFixed(6)}`,
    zoom: String(zoom), size: "640x640", scale: "2", maptype: "roadmap", key,
  });
  const url = `https://maps.googleapis.com/maps/api/staticmap?${params}&${STYLES.map((s) => `style=${encodeURIComponent(s)}`).join("&")}`;
  const r = await fetch(url);
  if (!r.ok) return NextResponse.json({ error: `maps ${r.status}` }, { status: 502 });
  return new NextResponse(await r.arrayBuffer(), {
    headers: { "Content-Type": r.headers.get("content-type") ?? "image/png", "Cache-Control": "public, max-age=86400" },
  });
}
