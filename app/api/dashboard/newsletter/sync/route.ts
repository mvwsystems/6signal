import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/dashboard-auth";
import { markLeadsSynced, newsletterCounts, unsyncedLeadEmails } from "../../../../lib/db";
import { resolveSegmentId, upsertContact } from "../../../../lib/newsletter";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Pushes Supabase leads into the Resend segment. Supabase stays the system of
// record; Resend only needs enough to send and to honour unsubscribes. Runs in
// batches and marks each email as it lands, so a timeout loses no progress and
// re-running continues where it stopped.
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const segmentId = await resolveSegmentId();
  if (!segmentId) {
    return NextResponse.json(
      { error: "No Resend segment. Check RESEND_API_KEY, or set RESEND_SEGMENT_ID." },
      { status: 503 }
    );
  }

  const emails = await unsyncedLeadEmails(300);
  if (emails.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, remaining: 0, counts: await newsletterCounts() });
  }

  const landed: string[] = [];
  const failed: string[] = [];
  for (const email of emails) {
    const ok = await upsertContact({ email, segmentId, properties: { origin: "6signal.co" } });
    (ok ? landed : failed).push(email);
  }

  await markLeadsSynced(landed);
  const counts = await newsletterCounts();

  return NextResponse.json({
    ok: true,
    synced: landed.length,
    failed: failed.length,
    remaining: Math.max(0, counts.total - counts.synced),
    counts,
  });
}
