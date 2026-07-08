import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { listCompletedAudits } from "../../../lib/db";

export const dynamic = "force-dynamic";

// Report history per business — every completed scan/battle plan/90-day plan,
// permanently reopenable (payloads come from /api/audit/<id>).

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
  return NextResponse.json({ reports: await listCompletedAudits(businessId) });
}
