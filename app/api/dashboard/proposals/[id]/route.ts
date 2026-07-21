import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../../../lib/dashboard-auth";
import { getProposal, updateProposal } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(proposal);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { clientName?: string; payload?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ok = await updateProposal(id, { clientName: body?.clientName, payload: body?.payload });
  if (!ok) return NextResponse.json({ error: "Update failed (check Supabase config)." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
