import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { listMapsGridScans } from "../../../lib/db";
import { enqueueWorker } from "../../../lib/enqueue";

// GET  ?businessId=  → { scans } (newest first; poll after POST)
// POST { businessId, keyword?, gridSize?, spacingMiles? } → enqueue scan → 202

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
  return NextResponse.json({ scans: await listMapsGridScans(businessId) });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { businessId?: string; keyword?: string; gridSize?: number; spacingMiles?: number } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body?.businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
  if (!process.env.SERPAPI_KEY) return NextResponse.json({ error: "SERPAPI_KEY is not configured." }, { status: 501 });
  const q = await enqueueWorker({
    kind: "maps-grid", businessId: body.businessId,
    keyword: body.keyword || undefined, gridSize: body.gridSize, spacingMiles: body.spacingMiles,
  });
  if (!q.ok) return NextResponse.json({ error: q.error }, { status: 502 });
  return NextResponse.json({ queued: true }, { status: 202 });
}
