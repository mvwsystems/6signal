import { NextRequest, NextResponse } from "next/server";
import { asSystem, closeCron } from "../../../../lib/close";

export const dynamic = "force-dynamic";

// Hourly (netlify/functions/close-cron.mts): reminders, expiry, unpaid flags,
// and retries for anything a missed webhook left half done.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await asSystem(() => closeCron()));
  } catch (e) {
    console.error("[close-cron]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
