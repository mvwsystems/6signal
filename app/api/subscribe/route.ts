import { NextResponse } from "next/server";
import { insertLead } from "../../lib/db";
import { pushToKit, KIT_TAG_MASTER, KIT_TAG_SERIES } from "../../lib/kit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  await pushToKit({ email, tagIds: [KIT_TAG_MASTER, KIT_TAG_SERIES] });

  return NextResponse.json({ ok: true });
}
