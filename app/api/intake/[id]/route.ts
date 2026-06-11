import { NextRequest, NextResponse } from "next/server";
import { getIntake } from "../../../lib/db";

// Recovery path: /audit-results?intake=<id> fetches the original form data
// here when localStorage is gone (different device, cleared storage, in-app
// browser). Intake ids are unguessable UUIDs.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const intake = await getIntake(id);
  if (!intake) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: intake.id, form: intake.form });
}
