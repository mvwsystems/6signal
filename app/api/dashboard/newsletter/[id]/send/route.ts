import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../../../lib/dashboard-auth";
import { getBriefing, updateBriefing } from "../../../../../lib/db";
import { sendEmail } from "../../../../../lib/email";
import { newsletterFrom, resolveSegmentId, sendBroadcast } from "../../../../../lib/newsletter";
import { renderBriefingEmail, renderBriefingText } from "../../../../../lib/newsletterHtml";

export const dynamic = "force-dynamic";

const BASE = "https://6signal.co";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { test?: boolean; to?: string; scheduledAt?: string | null } | null = null;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const issue = await getBriefing(id);
  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!issue.body.trim()) return NextResponse.json({ error: "Write something first." }, { status: 400 });

  const issueUrl = issue.published_at ? `${BASE}/briefings/${issue.slug}` : null;

  // ── Test send: one message to the owner, over the marketing domain ────────
  if (body?.test) {
    const to = (body.to ?? process.env.LEAD_ALERT_TO ?? "hello@6signal.co").trim();
    const ok = await sendEmail({
      to,
      from: newsletterFrom(),
      subject: `[TEST] ${issue.subject}`,
      html: renderBriefingEmail({
        subject: issue.subject,
        body: issue.body,
        preview: issue.preview,
        issueUrl,
        unsubscribeUrl: `${BASE}/briefings`,
      }),
      text: renderBriefingText(issue.body, `${BASE}/briefings`),
    });
    return ok
      ? NextResponse.json({ ok: true, test: true, to })
      : NextResponse.json({ error: "Test send failed — check RESEND_API_KEY and that the sending domain is verified." }, { status: 502 });
  }

  // ── Real send ─────────────────────────────────────────────────────────────
  if (issue.status === "sent") {
    return NextResponse.json({ error: "This issue has already been sent." }, { status: 409 });
  }

  const segmentId = await resolveSegmentId();
  if (!segmentId) {
    return NextResponse.json(
      { error: "No Resend segment. Check RESEND_API_KEY, or set RESEND_SEGMENT_ID." },
      { status: 503 }
    );
  }

  const scheduledAt = body?.scheduledAt?.trim() || null;
  const result = await sendBroadcast({
    segmentId,
    subject: issue.subject,
    name: issue.slug,
    replyTo: "hello@6signal.co",
    // The real send keeps Resend's merge tag so unsubscribes are handled for us.
    html: renderBriefingEmail({
      subject: issue.subject,
      body: issue.body,
      preview: issue.preview,
      issueUrl,
    }),
    text: renderBriefingText(issue.body),
    scheduledAt,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });

  await updateBriefing(id, {
    status: scheduledAt ? "scheduled" : "sent",
    resend_broadcast_id: result.broadcastId,
    scheduled_at: scheduledAt,
    sent_at: scheduledAt ? null : new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, broadcastId: result.broadcastId, scheduled: Boolean(scheduledAt) });
}
