import { NextRequest } from "next/server";
import { startGmailConnect } from "../../../../lib/gmailConnect";

export const dynamic = "force-dynamic";

// GET → owner only: send the browser to Google to connect casey@'s Gmail
// (read + create drafts). Google returns to /api/dashboard/auth/google/callback.
export async function GET(req: NextRequest) {
  return startGmailConnect(req);
}
