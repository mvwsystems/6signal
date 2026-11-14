import { NextRequest } from "next/server";
import { guarded } from "../../crm/_util";
import { today } from "../../../../lib/commandCenter";

export const dynamic = "force-dynamic";

// GET ?until=<ISO end of the person's day> → approvals waiting, tasks due
// (today and overdue), undated open tasks, CRM follow-ups due, recent activity.
export async function GET(req: NextRequest) {
  return guarded(req, async () => {
    const until = req.nextUrl.searchParams.get("until");
    const end = until && !Number.isNaN(new Date(until).getTime()) ? new Date(until) : new Date(new Date().setUTCHours(23, 59, 59, 999));
    return today(end.toISOString());
  });
}
