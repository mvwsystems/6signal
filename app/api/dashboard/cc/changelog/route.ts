import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../../crm/_util";
import { listChangelog, changelogFacets, addChangelogEntry } from "../../../../lib/changelog";

export const dynamic = "force-dynamic";

// GET ?from=YYYY-MM-DD&to=&client=&service=&source=&q=&signins=1&offset=&limit=
//     → { rows, total }; ?facets=1 → { clients, services }
// POST { summary, client?, service?, link?, date? }            → a hand entry
// POST { source:"github", repo, message, paths[], ref, link? }  → from the workflow
export async function GET(req: NextRequest) {
  return guarded(req, async () => {
    const p = req.nextUrl.searchParams;
    if (p.get("facets")) return changelogFacets();
    return listChangelog({
      from: p.get("from"), to: p.get("to"), client: p.get("client"), service: p.get("service"),
      source: p.get("source"), q: p.get("q"), signIns: p.get("signins") === "1",
      offset: Number(p.get("offset")) || 0, limit: Number(p.get("limit")) || 100,
    });
  });
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => addChangelogEntry(await jsonBody(req)));
}
