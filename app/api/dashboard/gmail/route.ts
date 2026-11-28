import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../crm/_util";
import { gmailStatus, disconnectGmail } from "../../../lib/gmailConnect";
import { CrmError } from "../../../lib/crm";

export const dynamic = "force-dynamic";

// GET → whether casey@'s Gmail is connected (never returns the token).
// POST { op: "disconnect" } → owner only: revoke and forget the connection.
export async function GET(req: NextRequest) {
  return guarded(req, () => gmailStatus());
}
export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ op?: string }>(req);
    if (b.op === "disconnect") return disconnectGmail();
    throw new CrmError("Unknown op", 400);
  });
}
