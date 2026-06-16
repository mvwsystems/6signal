// Google Places API (New) — authoritative local data for the internal dashboard.
// Best-effort: no key (or any failure) returns null and callers fall back to
// web-search estimates. Server-side only.

export interface PlaceInfo {
  found: boolean;
  name?: string;
  rating?: number | null;
  reviews?: number | null;
  address?: string | null;
  categories?: string[];
  businessStatus?: string | null;
  mapsUri?: string | null;
}

export interface LocalLandscape {
  business: PlaceInfo | null;
  competitors: { name: string; rating: number | null; reviews: number | null }[];
  businessRanksInTop3: boolean | null;
}

const FIELD_MASK = [
  "places.displayName",
  "places.rating",
  "places.userRatingCount",
  "places.formattedAddress",
  "places.primaryTypeDisplayName",
  "places.types",
  "places.businessStatus",
  "places.googleMapsUri",
].join(",");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function textSearch(query: string, maxResultCount: number): Promise<any[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) return [];
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELD_MASK },
      body: JSON.stringify({ textQuery: query, maxResultCount }),
    });
    if (!res.ok) {
      console.error("[places] textSearch", res.status, (await res.text().catch(() => "")).slice(0, 200));
      return [];
    }
    const data = await res.json();
    return data.places ?? [];
  } catch (e) {
    console.error("[places] error:", e);
    return [];
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function norm(p: any): PlaceInfo {
  return {
    found: true,
    name: p.displayName?.text,
    rating: typeof p.rating === "number" ? p.rating : null,
    reviews: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
    address: p.formattedAddress ?? null,
    categories: [p.primaryTypeDisplayName?.text, ...(p.types ?? [])].filter(Boolean),
    businessStatus: p.businessStatus ?? null,
    mapsUri: p.googleMapsUri ?? null,
  };
}

export async function localLandscape(name: string, trade: string, city: string): Promise<LocalLandscape | null> {
  if (!process.env.GOOGLE_PLACES_API_KEY?.trim()) return null;
  const [bizResults, tradeResults] = await Promise.all([
    textSearch(`${name} ${city}`, 1),
    textSearch(`${trade} in ${city}`, 10),
  ]);
  const business = bizResults.length ? norm(bizResults[0]) : { found: false };
  const competitors = tradeResults
    .map(norm)
    .map((p) => ({ name: p.name ?? "", rating: p.rating ?? null, reviews: p.reviews ?? null }))
    .filter((c) => c.name);
  const stub = business.found && business.name ? (business.name as string).toLowerCase().slice(0, 8) : "";
  const businessRanksInTop3 = business.found
    ? competitors.slice(0, 3).some((c) => stub && c.name.toLowerCase().includes(stub))
    : null;
  return { business: business.found ? business : null, competitors, businessRanksInTop3 };
}

export function localForPrompt(l: LocalLandscape | null): string {
  if (!l) return "LOCAL DATA: none (Google Places key not set) — estimate local/GBP signals from web search instead.";
  const lines: string[] = ["AUTHORITATIVE LOCAL DATA (Google Places — use these exact numbers; do not invent review counts):"];
  const b = l.business;
  if (b) {
    lines.push(`- This business in Google: ${b.rating ?? "?"}★ from ${b.reviews ?? "?"} reviews; status ${b.businessStatus ?? "?"}; categories ${(b.categories ?? []).slice(0, 4).join(", ") || "?"}.`);
  } else {
    lines.push("- This business was NOT found in Google Places for the market — a severe LEO gap (effectively invisible in Maps).");
  }
  if (l.competitors.length) {
    lines.push("- Top local competitors (name — reviews — rating):");
    for (const c of l.competitors.slice(0, 8)) lines.push(`  • ${c.name} — ${c.reviews ?? "?"} reviews — ${c.rating ?? "?"}★`);
  }
  if (l.businessRanksInTop3 !== null) lines.push(`- Appears in the top-3 local results for the trade: ${l.businessRanksInTop3 ? "YES" : "NO"}.`);
  return lines.join("\n");
}
