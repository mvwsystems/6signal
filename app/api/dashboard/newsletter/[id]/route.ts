import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/dashboard-auth";
import { deleteBriefing, getBriefing, updateBriefing } from "../../../../lib/db";

export const dynamic = "force-dynamic";

const EDITABLE = new Set(["subject", "preview", "body", "slug", "published_at"]);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const issue = await getBriefing(id);
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // The composer renders its own preview from this markdown with the same
  // function the send path uses, so no HTML is built here.
  return NextResponse.json({ issue });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: Record<string, unknown> | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body ?? {})) {
    if (EDITABLE.has(k)) fields[k] = v;
  }
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const ok = await updateBriefing(id, fields);
  if (!ok) return NextResponse.json({ error: "Save failed" }, { status: 503 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // A sent issue is a record of what went to real inboxes; keep it.
  const issue = await getBriefing(id);
  if (issue?.status === "sent") {
    return NextResponse.json({ error: "Sent issues cannot be deleted." }, { status: 409 });
  }

  const ok = await deleteBriefing(id);
  if (!ok) return NextResponse.json({ error: "Delete failed" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
