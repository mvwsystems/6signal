import { NextRequest, NextResponse } from "next/server";
import { guarded, jsonBody } from "../crm/_util";
import { whoFromRequest } from "../../../lib/dashboard-auth";
import { runAs } from "../../../lib/actor";
import { CrmError } from "../../../lib/crm";
import {
  listCampaigns, getCampaign, previewCampaign, createCampaign, submitForApproval, testSend, pauseCampaign, deleteDraft, recipientsCsv,
} from "../../../lib/campaigns";

export const dynamic = "force-dynamic";

// GET → { campaigns, views, ... }; ?id= → one campaign + first 10;
//     ?id=&csv=1 → the full frozen recipient list as a CSV download.
// POST { op: "preview" | "create", name, subject, body, view_id, pilot, pilot_size, daily_cap, start_at }
//      { op: "submit", id }  (re-check and file the approval)
//      { op: "test", to, subject?, body?, campaign_id? }  (one TEST email via Resend)
//      { op: "pause", id } | { op: "delete", id }
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const id = p.get("id");
  if (id && p.get("csv")) {
    const who = whoFromRequest(req);
    if (!who) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const csv = await runAs({ role: who.role, name: who.name }, () => recipientsCsv(id));
      return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="campaign-${id.slice(0, 8)}-recipients.csv"`, "Cache-Control": "no-store" } });
    } catch (e) {
      if (e instanceof CrmError) return NextResponse.json({ error: e.message }, { status: e.status });
      return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
    }
  }
  return guarded(req, async () => (id ? getCampaign(id) : listCampaigns()));
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<Record<string, unknown>>(req);
    const id = typeof b.id === "string" ? b.id : "";
    switch (b.op) {
      case "preview": return previewCampaign(b);
      case "create": return createCampaign(b);
      case "submit": if (!id) throw new CrmError("id is required", 400); return submitForApproval(id);
      case "test": return testSend(b);
      case "pause": if (!id) throw new CrmError("id is required", 400); return pauseCampaign(id);
      case "delete": if (!id) throw new CrmError("id is required", 400); return deleteDraft(id);
      default: throw new CrmError("Unknown op", 400);
    }
  });
}
