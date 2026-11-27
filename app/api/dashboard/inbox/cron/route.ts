import { NextRequest, NextResponse } from "next/server";
import { runAs } from "../../../../lib/actor";
import { syncInbox } from "../../../../lib/inbox";
import { gmailConfigured } from "../../../../lib/gmail";

export const dynamic = "force-dynamic";

// Every 15 minutes (netlify/functions/inbox-cron.mts): reads new mail in
// Casey's inbox. Reads and matches only; never sends.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await gmailConfigured())) return NextResponse.json({ skipped: "Gmail not connected" });
  try {
    return NextResponse.json(await runAs({ role: "operator", name: "Inbox sync" }, () => syncInbox()));
  } catch (e) {
    console.error("[inbox-cron]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
