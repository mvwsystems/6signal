import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../crm/_util";
import { staffBoard, updateAgent } from "../../../lib/staff";
import { CrmError } from "../../../lib/crm";

export const dynamic = "force-dynamic";

// GET → the AI staff board: roster with last run and this week's spend,
// the 50 latest runs, and every playbook version.
// PATCH { key, enabled?, status?, auto_send?, monthly_cap_usd?, schedule?, playbook_url? }
//   → change one agent (switching on, auto-send and caps are owner only).
export async function GET(req: NextRequest) {
  return guarded(req, () => staffBoard());
}

export async function PATCH(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ key?: string; enabled?: boolean; status?: string; auto_send?: boolean; monthly_cap_usd?: number | null; schedule?: string | null; playbook_url?: string | null }>(req);
    if (!b.key) throw new CrmError("key is required", 400);
    const { key, ...patch } = b;
    return updateAgent(key, patch);
  });
}
