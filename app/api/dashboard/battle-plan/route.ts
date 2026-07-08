import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAuthed } from "../../../lib/dashboard-auth";
import { upsertBusiness, insertAuditRow, failAudit } from "../../../lib/db";
import { SCAN_MODEL } from "../../../lib/aiScan";
import { enqueueReport } from "../../../lib/enqueue";

const PROMPT_VERSION = "battleplan-1.0.0";

// Thin enqueue route: the heavy work runs in the report-worker BACKGROUND
// function (this site's proxy kills request lambdas ~60s in). Returns
// { pending: auditId } immediately; the client polls /api/audit/<id>.

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, string> | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const { name, trade, city } = body ?? {};
  let { url } = body ?? {};
  if (!name || !trade || !city) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;

  const auditId = randomUUID();
  const businessId = await upsertBusiness({ name, url: url ?? null, trade, city });
  await insertAuditRow({ id: auditId, businessId, intakeId: null, tier: "brief_27", model: SCAN_MODEL, promptVersion: PROMPT_VERSION });

  const queued = await enqueueReport({ kind: "battle-plan", auditId, businessId, name, url: url ?? null, trade, city });
  if (!queued.ok) {
    await failAudit(auditId);
    return NextResponse.json({ error: queued.error }, { status: 502 });
  }
  return NextResponse.json({ pending: auditId });
}
