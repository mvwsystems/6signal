import { NextRequest, NextResponse } from "next/server";
import { enqueueWorker } from "../../lib/enqueue";

// Thin enqueue — the briefing (per-client queries + Claude narrative) runs in
// the background worker so the scheduled trigger returns instantly and never
// retries into duplicate emails.

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const queued = await enqueueWorker({ kind: "briefing" });
  if (!queued.ok) return NextResponse.json({ error: queued.error }, { status: 502 });
  return NextResponse.json({ ok: true, queued: true });
}
