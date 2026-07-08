import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { listTasks, updateTaskStatus } from "../../../lib/db";

// GET   ?businessId=  → that business's plan tasks
// PATCH { id, status } → open | in_progress | done | skipped

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });
  return NextResponse.json({ tasks: await listTasks(businessId) });
}

export async function PATCH(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { id?: string; status?: string } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { id, status } = body ?? {};
  if (!id || !["open", "in_progress", "done", "skipped"].includes(status ?? "")) {
    return NextResponse.json({ error: "id and valid status required" }, { status: 400 });
  }
  const ok = await updateTaskStatus(id, status as "open" | "in_progress" | "done" | "skipped");
  return NextResponse.json({ ok });
}
