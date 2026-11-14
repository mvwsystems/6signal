import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../../crm/_util";
import { createItem, listItems, updateItem } from "../../../../lib/commandCenter";
import { CrmError } from "../../../../lib/crm";

export const dynamic = "force-dynamic";

// GET ?kind=task|approval|report&status=active|closed|<status>&offset=
// POST { title, body?, due_at?, assignee?, kind? } → new task (or report)
// PATCH { id, status?, title?, body?, due_at?, assignee? } → edit a task
export async function GET(req: NextRequest) {
  return guarded(req, async () => {
    const p = req.nextUrl.searchParams;
    return listItems({ kind: p.get("kind"), status: p.get("status"), offset: Math.max(0, Number(p.get("offset")) || 0) });
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => createItem(await jsonBody(req)));
}

export async function PATCH(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ id?: string; status?: string; title?: string; body?: string; due_at?: string | null; assignee?: string }>(req);
    if (!b.id) throw new CrmError("id is required", 400);
    const { id, ...patch } = b;
    return updateItem(id, patch);
  });
}
