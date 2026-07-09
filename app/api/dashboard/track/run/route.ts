import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/dashboard-auth";
import { getBusiness, listTrackedPrompts } from "../../../../lib/db";
import { enginesWithKeys } from "../../../../lib/engines";
import { enqueueWorker } from "../../../../lib/enqueue";

// Thin enqueue: probe runs execute in the background worker (6 engines × many
// prompts far exceeds the 60s request window). The client polls track/results
// and watches verdicts appear incrementally.

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { businessId?: string } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const businessId = body?.businessId;
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const haveKeys = enginesWithKeys();
  if (haveKeys.length === 0) return NextResponse.json({ error: "No engine API keys configured (OPENAI/PERPLEXITY/GEMINI)." }, { status: 503 });

  const business = await getBusiness(businessId);
  if (!business) return NextResponse.json({ error: "Business not found." }, { status: 404 });
  const prompts = await listTrackedPrompts(businessId);
  if (prompts.length === 0) return NextResponse.json({ error: "No tracked prompts for this business yet." }, { status: 400 });

  const queued = await enqueueWorker({ kind: "probe-run", businessId });
  if (!queued.ok) return NextResponse.json({ error: queued.error }, { status: 502 });

  return NextResponse.json({ queued: true, prompts: Math.min(prompts.length, 20), engines: haveKeys });
}
