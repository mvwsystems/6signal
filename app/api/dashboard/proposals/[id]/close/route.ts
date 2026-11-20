import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../../../crm/_util";
import { CrmError } from "../../../../../lib/crm";
import { dealView, milestoneDone, requestSend, requireOwner, startMonthly, syncSigned, getDeal, withdraw } from "../../../../../lib/close";

export const dynamic = "force-dynamic";

// Close system controls for one proposal (dashboard, signed-in only).
// GET  → status, timeline, client link, signed PDF link
// POST { op: "send" }                → files the "Send for signature" approval
//      { op: "refresh" }             → re-checks DocuSeal (signed yet?)
//      { op: "milestone", idx }      → Matt only: invoice that milestone now
//      { op: "monthly" }             → Matt only: start monthly billing (go-live)
//      { op: "withdraw" }            → Matt only: pull an unpaid proposal back
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(req, () => dealView(id));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return guarded(req, async () => {
    const b = await jsonBody<{ op?: string; idx?: number }>(req);
    switch (b.op) {
      case "send": return requestSend(id);
      case "refresh": await syncSigned(await getDeal(id)); return dealView(id);
      case "milestone": requireOwner(); if (typeof b.idx !== "number") throw new CrmError("idx is required", 400); return milestoneDone(id, b.idx);
      case "monthly": requireOwner(); return startMonthly(id);
      case "withdraw": requireOwner(); return withdraw(id);
      default: throw new CrmError("Unknown op", 400);
    }
  });
}
