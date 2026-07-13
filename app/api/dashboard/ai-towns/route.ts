import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { listTownScans } from "../../../lib/db";
import { enqueueWorker } from "../../../lib/enqueue";

// GET  ?businessId=          → { scans } (newest first; poll after POST)
// POST { businessId, towns } → enqueue town-level AI visibility scan → 202

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
  return NextResponse.json({ scans: await listTownScans(businessId) });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { businessId?: string; towns?: string[] } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const towns = (body?.towns ?? []).map((t) => String(t).trim()).filter(Boolean);
  if (!body?.businessId || !towns.length) return NextResponse.json({ error: "businessId and towns required" }, { status: 400 });
  if (towns.length > 8) return NextResponse.json({ error: "8 towns max per scan" }, { status: 400 });
  const q = await enqueueWorker({ kind: "ai-towns", businessId: body.businessId, towns });
  if (!q.ok) return NextResponse.json({ error: q.error }, { status: 502 });
  return NextResponse.json({ queued: true, towns: towns.length }, { status: 202 });
}
