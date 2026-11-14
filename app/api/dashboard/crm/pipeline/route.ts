import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../_util";
import { moveStage, pipeline, CrmError } from "../../../../lib/crm";

export const dynamic = "force-dynamic";

// GET ?angle=&stage=&offset= → stage totals + a page of cards per stage.
// POST { id, stage } → moves the deal (Closed Won also sets status Customer).
export async function GET(req: NextRequest) {
  return guarded(req, async () => {
    const p = req.nextUrl.searchParams;
    return pipeline(p.get("angle") || null, p.get("stage") || null, Math.max(0, Number(p.get("offset")) || 0));
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ id?: string; stage?: string }>(req);
    if (!b.id || !b.stage) throw new CrmError("id and stage are required", 400);
    return moveStage(b.id, b.stage);
  });
}
