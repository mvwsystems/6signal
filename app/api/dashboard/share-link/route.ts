import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { ensureShareToken } from "../../../lib/db";

// POST { businessId } → a stable, unguessable public link for the client's
// live results page (/c/<token>).

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { businessId?: string } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body?.businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
  const token = await ensureShareToken(body.businessId);
  if (!token) return NextResponse.json({ error: "Could not create share link." }, { status: 500 });
  return NextResponse.json({ url: `https://6signal.co/c/${token}` });
}
