import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../../crm/_util";
import { actionList, decide, execute, listItems, perform } from "../../../../lib/commandCenter";
import { CrmError } from "../../../../lib/crm";

export const dynamic = "force-dynamic";

// GET ?status=active|closed → approval items, plus the registered actions.
// POST { op: "approve" | "reject", id, note? }   (owner only)
//      { op: "run", id }                         (Red: owner only)
//      { op: "check", tier }                     (QA tier test: harmless action)
export async function GET(req: NextRequest) {
  return guarded(req, async () => {
    const p = req.nextUrl.searchParams;
    const list = await listItems({ kind: "approval", status: p.get("status") || "active", offset: Math.max(0, Number(p.get("offset")) || 0) });
    return { ...list, actions: actionList() };
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ op?: string; id?: string; note?: string; tier?: string }>(req);
    if (b.op === "approve" || b.op === "reject") {
      if (!b.id) throw new CrmError("id is required", 400);
      return decide(b.id, b.op, b.note);
    }
    if (b.op === "run") {
      if (!b.id) throw new CrmError("id is required", 400);
      return execute(b.id);
    }
    if (b.op === "check") {
      if (!["green", "yellow", "red"].includes(b.tier ?? "")) throw new CrmError("tier must be green, yellow or red", 400);
      return perform(`check.${b.tier}`, {}, { body: "A test of the approval gate. Running it only writes an activity entry." });
    }
    throw new CrmError("Unknown op", 400);
  });
}
