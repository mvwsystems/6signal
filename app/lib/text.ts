// Small pure string helpers shared by server code and client components.
// No server-only imports — safe to include in the browser bundle.

// Canonicalize a competitor/business name for counting, so legal-suffix and
// punctuation variants collapse to one entity: "Options Plumbing" and
// "Options Plumbing LLC" both key to "options". Keeps distinct brands distinct
// ("Roto-Rooter" → "roto rooter", "Republic Home Services" → "republic home").
export function canonicalCompetitor(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .replace(/\b(llc|inc|co|corp|company|the|plumbing|plumbers|services|service)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
