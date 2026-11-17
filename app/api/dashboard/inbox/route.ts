import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../crm/_util";
import { CrmError } from "../../../lib/crm";
import { listThreads, getThread, prospectThreads, syncInbox, updateThread, stopThread, createProspectFromSender, draftReply } from "../../../lib/inbox";

export const dynamic = "force-dynamic";

// GET ?tab=matched|unmatched&status=&offset= → conversations; ?id= → one with
//     its messages and replies; ?prospect= → that prospect's conversations.
// POST { op: "sync" } | { op: "update", id, intent?, status? } | { op: "stop", id }
//      { op: "make_prospect", id } | { op: "reply", id, body }  (an approval; never sends)
export async function GET(req: NextRequest) {
  return guarded(req, async () => {
    const p = req.nextUrl.searchParams;
    if (p.get("prospect")) return prospectThreads(p.get("prospect")!);
    if (p.get("id")) return getThread(p.get("id")!);
    return listThreads({ tab: p.get("tab"), status: p.get("status"), offset: Number(p.get("offset")) || 0 });
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<Record<string, unknown>>(req);
    const id = typeof b.id === "string" ? b.id : "";
    if (b.op === "sync") return syncInbox();
    if (!id) throw new CrmError("id is required", 400);
    switch (b.op) {
      case "update": return updateThread(id, { intent: b.intent, status: b.status });
      case "stop": return stopThread(id);
      case "make_prospect": return createProspectFromSender(id);
      case "reply": return draftReply(id, String(b.body ?? ""));
      default: throw new CrmError("Unknown op", 400);
    }
  });
}
