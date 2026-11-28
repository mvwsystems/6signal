import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../../crm/_util";
import { addPlaybook, approvePlaybook } from "../../../../lib/staff";
import { CrmError } from "../../../../lib/crm";

export const dynamic = "force-dynamic";

// POST { agent_key, content, title?, change_note? } → drafts the next version
//   (not active until approved).
// PATCH { id, action: "approve" } → owner only: approves it and makes it the
//   agent's active version.
export async function POST(req: NextRequest) {
  return guarded(req, async () => addPlaybook(await jsonBody(req)));
}

export async function PATCH(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ id?: string; action?: string }>(req);
    if (b.action !== "approve") throw new CrmError('action must be "approve"', 400);
    return approvePlaybook(b.id);
  });
}
