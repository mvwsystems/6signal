import { NextResponse } from "next/server";
import { insertLead } from "../../lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Kit (ConvertKit) tag ids — account-specific, created 2026-07-28.
const KIT_TAG_MASTER = 20293305; // "6 SIGNAL" — every site subscriber
const KIT_TAG_SERIES = 21549558; // "intelligent-contractor" — series opt-ins

async function pushToKit(email: string): Promise<void> {
  const apiKey = process.env.KIT_API_KEY;
  if (!apiKey) {
    console.warn("[subscribe] KIT_API_KEY not set; skipping Kit sync");
    return;
  }
  const headers = { "Content-Type": "application/json", "X-Kit-Api-Key": apiKey };
  try {
    const create = await fetch("https://api.kit.com/v4/subscribers", {
      method: "POST",
      headers,
      body: JSON.stringify({ email_address: email }),
    });
    if (!create.ok && create.status !== 409) {
      throw new Error(`subscriber create ${create.status}`);
    }
    for (const tagId of [KIT_TAG_MASTER, KIT_TAG_SERIES]) {
      const tag = await fetch(`https://api.kit.com/v4/tags/${tagId}/subscribers`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email_address: email }),
      });
      if (!tag.ok) throw new Error(`tag ${tagId} ${tag.status}`);
    }
  } catch (e) {
    // Kit sync is best-effort — the lead is already persisted in Supabase.
    console.error("[subscribe] Kit sync failed:", e);
  }
}

export async function POST(req: Request) {
  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "Enter a valid email" }, { status: 400 });
  }

  const source = body.source === "intelligent-contractor" ? body.source : "subscribe";
  await insertLead({ businessId: null, email, source });
  await pushToKit(email);

  return NextResponse.json({ ok: true });
}
