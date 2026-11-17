import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../crm/_util";
import { CrmError } from "../../../lib/crm";
import {
  listSequences, getSequence, saveSequence, setStatus, setPreapproved, previewSequence, checkEnroll, enroll, draftDue,
  prospectTimeline, enrollmentAction, recordEvent, clearBounce,
} from "../../../lib/sequences";

export const dynamic = "force-dynamic";

// GET → all sequences; ?id= → one with steps, enrollments and drafts;
//     ?prospect= → that prospect's timeline.
// POST { op: "save", id?, name, description, steps[] } | { op: "status", id, status } (Matt)
//      { op: "preapprove", id, on } (Matt) | { op: "preview", id | steps, prospect_id? | q? }
//      { op: "check_enroll" | "enroll", sequence_id, prospect_ids | view_id | campaign_id, expected_count }
//      { op: "draft_due" } | { op: "enrollment", id, action: pause|resume|remove }
//      { op: "event", prospect_id, kind: reply|booking|bounce } | { op: "clear_bounce", prospect_id }
export async function GET(req: NextRequest) {
  return guarded(req, async () => {
    const p = req.nextUrl.searchParams;
    if (p.get("prospect")) return prospectTimeline(p.get("prospect")!);
    if (p.get("id")) return getSequence(p.get("id")!);
    return listSequences();
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<Record<string, unknown>>(req);
    const id = typeof b.id === "string" ? b.id : "";
    const pid = typeof b.prospect_id === "string" ? b.prospect_id : "";
    switch (b.op) {
      case "save": return saveSequence(b);
      case "status": if (!id) throw new CrmError("id is required", 400); return setStatus(id, String(b.status ?? ""));
      case "preapprove": if (!id) throw new CrmError("id is required", 400); return setPreapproved(id, b.on === true);
      case "preview": return previewSequence(b);
      case "check_enroll": return checkEnroll(b);
      case "enroll": return enroll(b);
      case "draft_due": return draftDue();
      case "enrollment": {
        const a = String(b.action ?? "");
        if (!id || !["pause", "resume", "remove"].includes(a)) throw new CrmError("id and action (pause, resume or remove) are required", 400);
        return enrollmentAction(id, a as "pause" | "resume" | "remove");
      }
      case "event": {
        const k = String(b.kind ?? "");
        if (!pid || !["reply", "booking", "bounce"].includes(k)) throw new CrmError("prospect_id and kind (reply, booking or bounce) are required", 400);
        return recordEvent(pid, k as "reply" | "booking" | "bounce");
      }
      case "clear_bounce": if (!pid) throw new CrmError("prospect_id is required", 400); return clearBounce(pid);
      default: throw new CrmError("Unknown op", 400);
    }
  });
}
