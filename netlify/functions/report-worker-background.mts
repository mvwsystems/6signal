// Netlify BACKGROUND function (the -background suffix is load-bearing): gets a
// guaranteed 15-minute runtime, unlike request/response lambdas which this
// site's proxy kills ~60s in. ALL heavy work runs here: report generation and
// probe sweeps. API routes just enqueue and return immediately.

import { runScanReport, runBattlePlanReport, runExecutionPlanReport } from "../../app/lib/reports";
import { runProbeSweep } from "../../app/lib/probes";
import { runMonthlyClientReports } from "../../app/lib/clientReport";
import { runWatchdog } from "../../app/lib/watchdog";
import { runOwnerBriefing } from "../../app/lib/briefing";
import { runContentGeneration } from "../../app/lib/content";

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-worker-secret") !== secret) {
    return new Response("unauthorized", { status: 401 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
  const kind = body.kind as string;

  try {
    if (kind === "scan" || kind === "battle-plan" || kind === "execution-plan") {
      const { auditId, name, trade, city } = body;
      if (!auditId || !name || !trade || !city) return new Response("missing fields", { status: 400 });
      const params = {
        auditId, businessId: body.businessId ?? null, name,
        url: body.url ?? null, trade, city, fromAuditId: body.fromAuditId ?? null,
      };
      if (kind === "scan") await runScanReport(params);
      else if (kind === "battle-plan") await runBattlePlanReport(params);
      else await runExecutionPlanReport(params);
    } else if (kind === "probe-run") {
      if (!body.businessId) return new Response("missing businessId", { status: 400 });
      await runProbeSweep({ businessId: body.businessId, cap: 20 });
    } else if (kind === "probe-cron") {
      await runProbeSweep({ cap: 30 });
    } else if (kind === "client-reports-cron") {
      await runMonthlyClientReports();
    } else if (kind === "watchdog") {
      await runWatchdog();
    } else if (kind === "briefing") {
      await runOwnerBriefing();
    } else if (kind === "content-generate") {
      if (!body.postId || !body.businessId) return new Response("missing postId/businessId", { status: 400 });
      await runContentGeneration({ postId: body.postId, businessId: body.businessId });
    } else {
      return new Response("unknown kind", { status: 400 });
    }
    return new Response("done", { status: 200 });
  } catch (e) {
    console.error("[report-worker] failed:", e);
    return new Response("failed", { status: 500 });
  }
};
