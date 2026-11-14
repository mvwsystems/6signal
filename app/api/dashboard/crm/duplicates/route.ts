import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../_util";
import { duplicateClusters, mergeProspects, CrmError } from "../../../../lib/crm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET  → clusters of likely duplicates (shared email, domain, company name, phone).
// POST { survivorId, mergedId, reason } → merges one record into another. Never automatic.
export async function GET(req: NextRequest) {
  return guarded(req, () => duplicateClusters());
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ survivorId?: string; mergedId?: string; reason?: string }>(req);
    if (!b.survivorId || !b.mergedId) throw new CrmError("survivorId and mergedId are required", 400);
    return mergeProspects(b.survivorId, b.mergedId, b.reason || "Manual merge");
  });
}
