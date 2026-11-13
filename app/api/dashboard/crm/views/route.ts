import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../_util";
import { listViews, saveView, deleteView, CrmError } from "../../../../lib/crm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return guarded(req, async () => ({ views: await listViews() }));
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ name?: string; filters?: unknown }>(req);
    if (!b.name?.trim()) throw new CrmError("Name the view", 400);
    return { view: await saveView(b.name.trim(), b.filters ?? {}) };
  });
}

export async function DELETE(req: NextRequest) {
  return guarded(req, async () => {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) throw new CrmError("id required", 400);
    await deleteView(id);
    return { ok: true };
  });
}
