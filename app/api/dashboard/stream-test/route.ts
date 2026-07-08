import { NextRequest, NextResponse } from "next/server";
import { streamedJSONResponse } from "../../../lib/aiScan";

export const maxDuration = 300;

// Empirical probe for the "Failed to fetch" investigation: holds a heartbeat
// stream open for ?secs seconds, then returns JSON. Curling this tells us
// exactly how long a streamed response survives on this Netlify site — and
// whether the failure is infra or client. CRON_SECRET-gated.

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const secs = Math.min(280, Math.max(1, Number(req.nextUrl.searchParams.get("secs")) || 60));
  const started = Date.now();
  return streamedJSONResponse(async () => {
    await new Promise((r) => setTimeout(r, secs * 1000));
    return { ok: true, held_seconds: secs, elapsed_ms: Date.now() - started };
  });
}
