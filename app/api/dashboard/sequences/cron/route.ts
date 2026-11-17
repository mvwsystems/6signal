import { NextRequest, NextResponse } from "next/server";
import { runAs } from "../../../../lib/actor";
import { draftDue } from "../../../../lib/sequences";

export const dynamic = "force-dynamic";

// Hourly (netlify/functions/sequences-cron.mts): drafts every step that has
// come due and files the approvals. It never sends anything.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await runAs({ role: "operator", name: "Sequence scheduler" }, () => draftDue()));
  } catch (e) {
    console.error("[sequences-cron]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
