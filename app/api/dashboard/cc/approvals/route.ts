import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../../crm/_util";
import { decide, listApprovals, perform } from "../../../../lib/commandCenter";
import { CrmError } from "../../../../lib/crm";
// Registers the campaign launch action, so approving a campaign runs it.
import { noteKilled } from "../../../../lib/campaigns";
// Registers the follow-up batch action the same way.
import { noteSeqKilled } from "../../../../lib/sequences";
// And the inbox reply action.
import { noteInboxKilled } from "../../../../lib/inbox";
// And "Send a proposal for signature" (close system).
import { noteSendKilled } from "../../../../lib/close";

export const dynamic = "force-dynamic";

// GET ?open=0|1 → approval Items with their decision record.
// POST { op: "approve", id, note? } | { op: "kill", id, note }   (Matt only)
//      { op: "check", tier }   (QA tier test: a harmless action through the gate)
export async function GET(req: NextRequest) {
  return guarded(req, async () => listApprovals(req.nextUrl.searchParams.get("open") !== "0"));
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ op?: string; id?: string; note?: string; tier?: string }>(req);
    if (b.op === "approve" || b.op === "kill") {
      if (!b.id) throw new CrmError("id is required", 400);
      const res = await decide(b.id, b.op, b.note);
      if (b.op === "kill") { await noteKilled(b.id); await noteSeqKilled(b.id); await noteInboxKilled(b.id); await noteSendKilled(b.id); }
      return res;
    }
    if (b.op === "check") {
      if (!["green", "yellow", "red"].includes(b.tier ?? "")) throw new CrmError("tier must be green, yellow or red", 400);
      return perform(`check.${b.tier}`, {}, {
        summary: "A test of the approval gate.", recommendation: "Approve or kill: either way, the only effect is an Activity entry.",
        detail: "Running it only writes an Activity entry. Nothing else changes.",
      });
    }
    throw new CrmError("Unknown op", 400);
  });
}
