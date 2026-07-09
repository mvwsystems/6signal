import { NextRequest, NextResponse } from "next/server";
import { enqueueWorker } from "../../../../lib/enqueue";

// Monthly client-report tick — thin enqueue onto the background worker.

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const queued = await enqueueWorker({ kind: "client-reports-cron" });
  if (!queued.ok) return NextResponse.json({ error: queued.error }, { status: 502 });
  return NextResponse.json({ ok: true, queued: true });
}
