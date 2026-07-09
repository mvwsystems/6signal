import { NextRequest, NextResponse } from "next/server";
import { getBusinessByShareToken, getLatestClientReport, getProbeResults, listTasks } from "../../../lib/db";

export const dynamic = "force-dynamic";

// Public client view data, gated only by the unguessable share token.
// Returns the latest client report + a light tracking summary. No emails,
// no internal notes, no other businesses — client-safe by construction.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const business = await getBusinessByShareToken(token);
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [report, results, tasks] = await Promise.all([
    getLatestClientReport(business.id),
    getProbeResults(business.id, 90),
    listTasks(business.id),
  ]);

  // Day-level mention-rate series for the trend chart (no raw answers exposed).
  const byDay: Record<string, { a: number; m: number }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of results as any[]) {
    const d = String(r.run_at).slice(0, 10);
    (byDay[d] ||= { a: 0, m: 0 });
    byDay[d].a++;
    if (r.mentioned) byDay[d].m++;
  }
  const trend = Object.keys(byDay).sort().map((d) => ({ date: d, rate: Math.round((100 * byDay[d].m) / byDay[d].a) }));

  return NextResponse.json({
    business: { name: business.name, trade: business.trade, city: business.city },
    report: report?.payload ?? null,
    trend,
    tasks: {
      done: tasks.filter((t) => t.status === "done").length,
      total: tasks.length,
      client_open: tasks.filter((t) => t.status !== "done" && t.owner === "Client").map((t) => t.task).slice(0, 5),
    },
  });
}
