import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../_util";
import { changeCallRank, completeFollowUp, hitList, scheduleFollowUp, CrmError } from "../../../../lib/crm";

export const dynamic = "force-dynamic";

// GET ?until=<ISO end of the operator's day> → follow-ups due, unworked
// replies, priority call list.
// POST { action: "followup", prospectId, at, content } | { action: "done", noteId }
//    | { action: "rank", prospectId, op: "add" | "remove" | "up" | "down" }
export async function GET(req: NextRequest) {
  return guarded(req, async () => {
    const until = req.nextUrl.searchParams.get("until");
    const end = until && !Number.isNaN(new Date(until).getTime()) ? new Date(until) : new Date(new Date().setUTCHours(23, 59, 59, 999));
    return hitList(end.toISOString());
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ action?: string; prospectId?: string; at?: string; content?: string; noteId?: string; op?: string }>(req);
    if (b.action === "followup") {
      if (!b.prospectId || !b.at) throw new CrmError("prospectId and at are required", 400);
      return scheduleFollowUp(b.prospectId, b.at, b.content ?? "");
    }
    if (b.action === "done") {
      if (!b.noteId) throw new CrmError("noteId is required", 400);
      return completeFollowUp(b.noteId);
    }
    if (b.action === "rank") {
      if (!b.prospectId || !["add", "remove", "up", "down"].includes(b.op ?? "")) throw new CrmError("prospectId and a valid op are required", 400);
      return changeCallRank(b.prospectId, b.op as "add" | "remove" | "up" | "down");
    }
    throw new CrmError("Unknown action", 400);
  });
}
