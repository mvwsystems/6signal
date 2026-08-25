import { NextRequest, NextResponse } from "next/server";
import { createIntake, upsertBusiness } from "../../lib/db";

// Called by /visibility-check just before the Stripe redirect. Creates a
// server-side record of the form submission so a purchase can always be
// linked back to its data (the id rides along as Stripe client_reference_id).

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, url, trade, city, competitors } = (body ?? {}) as Record<string, string>;
  const attribution = (body?.attribution ?? null) as Record<string, unknown> | null;
  if (!name || !trade || !city) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const businessId = await upsertBusiness({ name, url, trade, city });
  const id = await createIntake({
    businessId,
    form: { name, email: email ?? "", url, trade, city, competitors: competitors ?? "" },
    attribution,
  });

  // id is null when persistence is unavailable — the client falls back to
  // the plain Stripe link and the funnel still works.
  return NextResponse.json({ id });
}
