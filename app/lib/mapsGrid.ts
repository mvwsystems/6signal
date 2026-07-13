// Geo-grid Maps visibility: query Google Maps (via SerpAPI) from an NxN grid
// of coordinates around the business and record the map-pack rank at each
// point. Rankings on Maps are hyper-local — a single-point check (our maps
// probe engine) can say "absent" while the business ranks #2 a mile away.
// The grid shows WHERE the LEO problem lives. Runs in the background worker
// (kind "maps-grid"): N² SerpAPI calls.

import { getBusiness, saveMapsGridScan } from "./db";

export interface GridPoint { lat: number; lng: number; rank: number | null; top: string[] }
export interface GridStats { present: number; top3: number; top10: number; total: number; avg_rank: number | null; coverage: number }

const norm = (s: string) => s.toLowerCase().replace(/\b(llc|inc|co|corp|company|plumbing|services?)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();

function nameMatches(businessName: string, resultTitle: string): boolean {
  const b = norm(businessName), r = norm(resultTitle);
  if (!b || !r) return false;
  return r.includes(b) || b.includes(r);
}

/** Business location from Google Places (New); falls back to the city itself. */
async function geocodeCenter(name: string, city: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) return null;
  const search = async (q: string) => {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.displayName,places.location" },
      body: JSON.stringify({ textQuery: q, maxResultCount: 1 }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const p = data.places?.[0];
    return p?.location ? { lat: p.location.latitude, lng: p.location.longitude, label: p.displayName?.text ?? q } : null;
  };
  return (await search(`${name} ${city}`)) ?? (await search(city));
}

async function mapsRankAt(keyword: string, lat: number, lng: number, businessName: string): Promise<{ rank: number | null; top: string[] }> {
  const key = process.env.SERPAPI_KEY?.trim();
  if (!key) throw new Error("SERPAPI_KEY is not configured.");
  const params = new URLSearchParams({
    engine: "google_maps", type: "search", q: keyword,
    ll: `@${lat.toFixed(6)},${lng.toFixed(6)},14z`, hl: "en", api_key: key,
  });
  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
  const data = await res.json();
  const results: Array<{ position?: number; title?: string }> = data.local_results ?? [];
  let rank: number | null = null;
  for (const r of results) {
    if (r.title && nameMatches(businessName, r.title)) { rank = r.position ?? results.indexOf(r) + 1; break; }
  }
  return { rank, top: results.slice(0, 3).map((r) => r.title ?? "").filter(Boolean) };
}

export async function runMapsGridScan(args: { businessId: string; keyword?: string; gridSize?: number; spacingMiles?: number }): Promise<void> {
  const business = await getBusiness(args.businessId);
  if (!business) throw new Error("business not found");
  const keyword = (args.keyword ?? business.trade).trim().toLowerCase();
  const gridSize = Math.min(7, Math.max(3, args.gridSize ?? 5));
  const spacing = Math.min(5, Math.max(0.5, args.spacingMiles ?? 1.5));

  const center = await geocodeCenter(business.name, `${business.trade} ${business.city}`);
  if (!center) throw new Error("Could not geocode the business location (GOOGLE_PLACES_API_KEY).");

  const half = (gridSize - 1) / 2;
  const latStep = spacing / 69; // miles → degrees
  const lngStep = spacing / (69 * Math.cos((center.lat * Math.PI) / 180));

  const coords: Array<{ lat: number; lng: number }> = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      coords.push({ lat: center.lat + (half - row) * latStep, lng: center.lng + (col - half) * lngStep });
    }
  }

  // Modest concurrency: fast enough for the worker, gentle on SerpAPI.
  const points: GridPoint[] = new Array(coords.length);
  const POOL = 5;
  let next = 0;
  await Promise.all(Array.from({ length: POOL }, async () => {
    while (next < coords.length) {
      const i = next++;
      const c = coords[i];
      try {
        const { rank, top } = await mapsRankAt(keyword, c.lat, c.lng, business.name);
        points[i] = { ...c, rank, top };
      } catch (e) {
        console.error(`[maps-grid] point ${i} failed:`, e);
        points[i] = { ...c, rank: null, top: [] };
      }
    }
  }));

  const found = points.filter((p) => p.rank != null) as Array<GridPoint & { rank: number }>;
  const stats: GridStats = {
    present: found.length,
    top3: found.filter((p) => p.rank <= 3).length,
    top10: found.filter((p) => p.rank <= 10).length,
    total: points.length,
    avg_rank: found.length ? Math.round((found.reduce((s, p) => s + p.rank, 0) / found.length) * 10) / 10 : null,
    coverage: Math.round((100 * found.filter((p) => p.rank <= 10).length) / points.length),
  };

  await saveMapsGridScan({
    business_id: args.businessId, keyword,
    center: { ...center }, grid_size: gridSize, spacing_miles: spacing,
    points, stats,
  });
}
