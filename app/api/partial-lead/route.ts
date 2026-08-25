import { NextRequest, NextResponse } from "next/server";
import { upsertBusiness, insertLead } from "../../lib/db";

// Fired from /visibility-check when a visitor leaves the email field with a
// valid address but may never submit or pay. Captures the abandonment as a
// lead so it isn't lost, without blocking or altering the real funnel.

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, url, trade, city, email } = (body ?? {}) as Record<string, string>;
  const attribution = (body?.attribution ?? null) as Record<string, unknown> | null;
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const businessId =
    name && trade && city ? await upsertBusiness({ name, url, trade, city }) : null;
  await insertLead({ businessId, email, source: "visibility_check_partial", attribution });

  return NextResponse.json({ ok: true });
}
