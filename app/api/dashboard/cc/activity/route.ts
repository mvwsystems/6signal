import { NextRequest } from "next/server";
import { guarded } from "../../crm/_util";
import { activity } from "../../../../lib/commandCenter";

export const dynamic = "force-dynamic";

// GET ?type=prospect|item|connection|session|import|action&offset= → Activity, newest first.
export async function GET(req: NextRequest) {
  return guarded(req, async () => {
    const p = req.nextUrl.searchParams;
    return activity({ targetType: p.get("type"), offset: Math.max(0, Number(p.get("offset")) || 0) });
  });
}
