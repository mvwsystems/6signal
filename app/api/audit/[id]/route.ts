import { NextRequest, NextResponse } from "next/server";
import { getAudit } from "../../../lib/db";

// Permalink retrieval for a completed brief or strategy document:
// /audit-results?id=<auditId> renders from here instead of regenerating.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const audit = await getAudit(id);
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: audit.id,
    tier: audit.tier,
    payload: audit.payload,
    created_at: audit.created_at,
  });
}
