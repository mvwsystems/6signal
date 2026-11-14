import { NextRequest } from "next/server";
import { guarded } from "../../crm/_util";
import { today } from "../../../../lib/commandCenter";

export const dynamic = "force-dynamic";

const iso = (v: string | null, fallback: Date) => (v && !Number.isNaN(new Date(v).getTime()) ? new Date(v) : fallback).toISOString();

// GET ?until=<end of the person's today>&since=<start of their yesterday>
// → Decide, Exceptions, Happening today, Watching, Done since yesterday.
export async function GET(req: NextRequest) {
  return guarded(req, async () => {
    const p = req.nextUrl.searchParams;
    const end = new Date(); end.setUTCHours(23, 59, 59, 999);
    const start = new Date(Date.now() - 2 * 86400000);
    return today(iso(p.get("until"), end), iso(p.get("since"), start));
  });
}
