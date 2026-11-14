import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../../_util";
import { bulkUpdate, matchingIds, CrmError } from "../../../../../lib/crm";
import { ListFilters, STATUSES } from "../../../../../lib/crmCore";

export const dynamic = "force-dynamic";

// POST { ids?: string[], filters?: ListFilters, count?: true }
//   → { count } when count is true (nothing changes): how many rows the action would touch.
// POST { ids? | filters?, expectedCount, status?, addTag?, removeTag? }
//   → applies the change only if the selection still has expectedCount rows.
export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ ids?: string[]; filters?: ListFilters; count?: boolean; expectedCount?: number; status?: string; addTag?: string; removeTag?: string }>(req);
    const ids = b.ids?.length ? b.ids : b.filters ? await matchingIds(b.filters) : [];
    if (b.count) return { count: ids.length };
    if (b.status && !(STATUSES as readonly string[]).includes(b.status)) throw new CrmError("Unknown status", 400);
    if (typeof b.expectedCount !== "number") throw new CrmError("expectedCount is required", 400);
    const updated = await bulkUpdate(ids, b.expectedCount, { status: b.status, addTag: b.addTag?.trim(), removeTag: b.removeTag?.trim() });
    return { updated };
  });
}
