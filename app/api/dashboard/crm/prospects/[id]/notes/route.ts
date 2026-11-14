import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../../../_util";
import { addNote, CrmError } from "../../../../../../lib/crm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return guarded(req, async () => {
    const { id } = await params;
    const body = await jsonBody<{ content?: string; type?: string }>(req);
    const content = (body.content ?? "").trim();
    if (!content) throw new CrmError("Note is empty", 400);
    return { note: await addNote(id, content, body.type || "note") };
  });
}
