import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../../crm/_util";
import { createTask, deleteSampleItems, setItemStatus } from "../../../../lib/commandCenter";
import { CrmError } from "../../../../lib/crm";

export const dynamic = "force-dynamic";

// POST   { title, detail?, due_at?, owner? }   → a new task Item
// PATCH  { id, status: new|waiting|done|blocked }
// DELETE ?samples=1                              → delete the seeded sample Items
export async function POST(req: NextRequest) {
  return guarded(req, async () => createTask(await jsonBody(req)));
}

export async function PATCH(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ id?: string; status?: string }>(req);
    if (!b.id || !b.status) throw new CrmError("id and status are required", 400);
    return setItemStatus(b.id, b.status);
  });
}

export async function DELETE(req: NextRequest) {
  return guarded(req, async () => {
    if (req.nextUrl.searchParams.get("samples") !== "1") throw new CrmError("Only sample items can be deleted here.", 400);
    return deleteSampleItems();
  });
}
