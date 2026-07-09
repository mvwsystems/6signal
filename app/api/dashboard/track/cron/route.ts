import { NextRequest, NextResponse } from "next/server";
import { enqueueWorker } from "../../../../lib/enqueue";
import { enginesWithKeys } from "../../../../lib/engines";

// Weekly probe tick — thin enqueue onto the background worker. (Running the
// sweep inside this route would die at the host's ~60s lambda kill; the
// background worker gets a guaranteed 15 minutes.)

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (enginesWithKeys().length === 0) return NextResponse.json({ error: "No engine keys" }, { status: 503 });

  const queued = await enqueueWorker({ kind: "probe-cron" });
  if (!queued.ok) return NextResponse.json({ error: queued.error }, { status: 502 });
  return NextResponse.json({ ok: true, queued: true });
}
