import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/dashboard-auth";
import { createProposal, listProposals } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ proposals: await listProposals() });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { businessId?: string | null; clientName?: string; payload?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { businessId, clientName, payload } = body ?? {};
  if (!clientName || !payload) {
    return NextResponse.json({ error: "clientName and payload required" }, { status: 400 });
  }

  const id = await createProposal({ businessId: businessId ?? null, clientName, payload });
  if (!id) return NextResponse.json({ error: "Save failed (check Supabase config)." }, { status: 503 });
  return NextResponse.json({ id });
}
