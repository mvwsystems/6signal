import { NextRequest, NextResponse } from "next/server";
import { enqueueWorker } from "../../lib/enqueue";

// Thin enqueue — the actual self-test runs in the background worker (engine
// probes take 30-60s; doing them here made the scheduled trigger time out and
// retry, producing duplicate alert emails).

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const queued = await enqueueWorker({ kind: "watchdog" });
  if (!queued.ok) return NextResponse.json({ error: queued.error }, { status: 502 });
  return NextResponse.json({ ok: true, queued: true });
}
