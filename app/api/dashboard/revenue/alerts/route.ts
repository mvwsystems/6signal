import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../../crm/_util";
import { moneyAlerts, saveBills } from "../../../../lib/moneyAlerts";

export const dynamic = "force-dynamic";

// GET → unpaid/overdue invoices, failed payments (30 days), renewals (14 days)
//       from Stripe, read-only; plus Matt's bill reminders (owner only).
// POST { bills: [{ name, due_day, amount?, note? }] } → replace the reminders (owner only).
export async function GET(req: NextRequest) {
  return guarded(req, async () => moneyAlerts());
}
export async function POST(req: NextRequest) {
  return guarded(req, async () => saveBills((await jsonBody<{ bills?: unknown }>(req)).bills));
}
