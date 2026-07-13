import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { citationIntel } from "../../../lib/citations";

// GET ?businessId= → domain leaderboard of sources AI engines cite for this
// business's tracked buyer questions (aggregated from stored probe sources).

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
  return NextResponse.json(await citationIntel(businessId));
}
