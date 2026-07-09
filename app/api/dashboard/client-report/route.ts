import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { buildClientReport } from "../../../lib/clientReport";
import { listClientReports, getClientReport } from "../../../lib/db";

export const maxDuration = 60;

// POST { businessId }  → generate + store a client report (baseline if first)
// GET  ?businessId=    → list stored client reports
// GET  ?id=            → one stored client report (payload)

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { businessId?: string } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body?.businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
  const rep = await buildClientReport(body.businessId);
  if (!rep) return NextResponse.json({ error: "Business not found or persistence off." }, { status: 404 });
  return NextResponse.json({ id: rep.id, payload: rep.payload });
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const rep = await getClientReport(id);
    if (!rep) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rep);
  }
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId or id required" }, { status: 400 });
  return NextResponse.json({ reports: await listClientReports(businessId) });
}
