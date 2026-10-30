import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { createBriefing, listBriefings, newsletterCounts } from "../../../lib/db";
import { assertDomainSplit, newsletterFrom } from "../../../lib/newsletter";

export const dynamic = "force-dynamic";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [issues, counts] = await Promise.all([listBriefings(), newsletterCounts()]);
  return NextResponse.json({
    configured: Boolean(process.env.RESEND_API_KEY),
    from: newsletterFrom(),
    domainWarning: assertDomainSplit(),
    counts,
    issues,
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { subject?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const subject = (body?.subject ?? "").trim();
  if (!subject) return NextResponse.json({ error: "subject required" }, { status: 400 });

  // Date-prefixed so the archive sorts naturally and two issues can share a title.
  const slug = `${new Date().toISOString().slice(0, 10)}-${slugify(subject) || "brief"}`;
  const id = await createBriefing({ slug, subject });
  if (!id) return NextResponse.json({ error: "Save failed (check Supabase config)." }, { status: 503 });

  return NextResponse.json({ id, slug });
}
