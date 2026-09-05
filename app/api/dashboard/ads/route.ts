import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { getBusiness, setBusinessLookerUrl } from "../../../lib/db";

// Ads reporting is one embedded Looker Studio report per client, stored on the
// business row. GET returns the saved embed URL; PATCH sets or clears it.

// Only accept a Looker Studio embed URL — pasting the share URL instead of the
// embed URL is the usual mistake, and it renders as a Google sign-in wall.
const LOOKER_EMBED = /^https:\/\/lookerstudio\.google\.com\/embed\/reporting\//i;

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
  const business = await getBusiness(businessId);
  return NextResponse.json({ lookerUrl: business?.looker_url ?? null });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { businessId?: string; lookerUrl?: string | null } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body?.businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const raw = (body.lookerUrl ?? "").trim();
  if (raw) {
    // Accept a pasted <iframe …> too — that is what the Embed dialog copies.
    const fromIframe = raw.match(/src="([^"]+)"/i)?.[1];
    const url = (fromIframe ?? raw).trim();
    if (!LOOKER_EMBED.test(url)) {
      return NextResponse.json({
        error: "That does not look like a Looker Studio embed URL. In Looker Studio: Share -> Embed report -> Embed URL. It starts with https://lookerstudio.google.com/embed/reporting/",
      }, { status: 400 });
    }
    const ok = await setBusinessLookerUrl(body.businessId, url);
    return NextResponse.json({ ok, lookerUrl: url });
  }
  const ok = await setBusinessLookerUrl(body.businessId, null);
  return NextResponse.json({ ok, lookerUrl: null });
}
