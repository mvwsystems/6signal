import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../../_util";
import { getProspect, updateProspect, CrmError } from "../../../../../lib/crm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return guarded(req, async () => {
    const { id } = await params;
    const p = await getProspect(id);
    if (!p) throw new CrmError("Not found", 404);
    return p;
  });
}

// PATCH { field: value, ... } — only editable fields are applied; every
// changed field is written to the activity log with its old and new value.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return guarded(req, async () => {
    const { id } = await params;
    return updateProspect(id, await jsonBody<Record<string, unknown>>(req));
  });
}
