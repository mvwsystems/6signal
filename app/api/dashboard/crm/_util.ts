import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { CrmError } from "../../../lib/crm";

// Shared guard for every /api/dashboard/crm route: password cookie first, then
// any CrmError becomes a JSON error with its status, so the UI can show the
// real reason instead of an empty list.
export async function guarded(req: NextRequest, fn: () => Promise<unknown>) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await fn());
  } catch (e) {
    if (e instanceof CrmError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[crm]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function jsonBody<T>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new CrmError("Invalid JSON", 400);
  }
}
