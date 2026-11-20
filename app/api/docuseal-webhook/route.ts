import { NextRequest, NextResponse } from "next/server";
import { db } from "../../lib/db";
import { asSystem, getDeal, storeSignedPdf, syncSigned } from "../../lib/close";

export const dynamic = "force-dynamic";

// DocuSeal webhook (form.completed / submission.completed). The body is only a
// pointer: we look the submission up in our own table and re-read its state
// from DocuSeal's API with our key before acting, so a forged POST can at most
// make us check. Optional shared secret: set DOCUSEAL_WEBHOOK_SECRET and add a
// matching "X-Webhook-Secret" header in DocuSeal's webhook settings.
export async function POST(req: NextRequest) {
  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-webhook-secret") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { event_type?: string; data?: { id?: number; submission_id?: number; submission?: { id?: number } } } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ received: true }); }
  const subId = body.data?.submission_id ?? body.data?.submission?.id ?? (body.event_type?.startsWith("submission.") ? body.data?.id : undefined);
  if (!subId || !Number.isFinite(Number(subId))) return NextResponse.json({ received: true });
  const s = db();
  if (!s) return NextResponse.json({ received: true });
  const { data } = await s.from("proposals").select("id").eq("docuseal_submission_id", Number(subId)).maybeSingle();
  if (!data) return NextResponse.json({ received: true });
  try {
    await asSystem(async () => {
      const d = await syncSigned(await getDeal(data.id));
      await storeSignedPdf(d).catch(() => null);
    });
  } catch (e) {
    console.error("[docuseal-webhook]", e);
    // 500 makes DocuSeal retry; the hourly cron also catches it.
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
