import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { getDashboardOverview } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await getDashboardOverview();
  if (!data) {
    return NextResponse.json({ error: "Persistence is not configured." }, { status: 503 });
  }
  return NextResponse.json(data);
}
