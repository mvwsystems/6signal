import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../_util";
import { listProspects, createProspect, facets } from "../../../../lib/crm";
import { filtersFromParams } from "../../../../lib/crmCore";

export const dynamic = "force-dynamic";

// GET  ?q=&status=&category=&state=&tags=&angle=&sort=&dir=&page=&pageSize=
//      ?facets=1 returns the filter options (states, tags, categories) instead.
// POST { company, ...fields } creates one prospect.
export async function GET(req: NextRequest) {
  return guarded(req, async () => {
    const p = req.nextUrl.searchParams;
    if (p.get("facets")) return facets();
    return listProspects(filtersFromParams(p));
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => ({ prospect: await createProspect(await jsonBody<Record<string, unknown>>(req)) }));
}
