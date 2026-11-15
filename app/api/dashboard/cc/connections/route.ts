import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../../crm/_util";
import { listConnections, updateConnection } from "../../../../lib/commandCenter";
import { CrmError } from "../../../../lib/crm";

export const dynamic = "force-dynamic";

// GET → every integration with its manual status and note.
// PATCH { name, status?, note? } → set it (logged; "down" raises an exception).
export async function GET(req: NextRequest) {
  return guarded(req, () => listConnections());
}

export async function PATCH(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ name?: string; status?: string; note?: string }>(req);
    if (!b.name) throw new CrmError("name is required", 400);
    return updateConnection(b.name, { status: b.status, note: b.note });
  });
}
