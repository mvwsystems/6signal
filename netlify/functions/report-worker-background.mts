// Netlify BACKGROUND function (the -background suffix is load-bearing): gets a
// guaranteed 15-minute runtime, unlike request/response lambdas which this
// site's proxy kills ~60s in. All heavy report generation runs here; the API
// routes just enqueue and return a pending id the client polls.

import { runScanReport, runBattlePlanReport, runExecutionPlanReport } from "../../app/lib/reports";

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-worker-secret") !== secret) {
    return new Response("unauthorized", { status: 401 });
  }
  let body: { kind?: string; auditId?: string; businessId?: string | null; name?: string; url?: string | null; trade?: string; city?: string; fromAuditId?: string | null };
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
  const { kind, auditId, name, trade, city } = body;
  if (!kind || !auditId || !name || !trade || !city) return new Response("missing fields", { status: 400 });

  const params = {
    auditId,
    businessId: body.businessId ?? null,
    name,
    url: body.url ?? null,
    trade,
    city,
    fromAuditId: body.fromAuditId ?? null,
  };

  try {
    if (kind === "scan") await runScanReport(params);
    else if (kind === "battle-plan") await runBattlePlanReport(params);
    else if (kind === "execution-plan") await runExecutionPlanReport(params);
    else return new Response("unknown kind", { status: 400 });
    return new Response("done", { status: 200 });
  } catch (e) {
    console.error("[report-worker] failed:", e);
    return new Response("failed", { status: 500 });
  }
};
