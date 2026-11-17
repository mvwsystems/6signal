import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../crm/_util";
import { CrmError } from "../../../lib/crm";
import {
  getSettings, saveSettings, saveTerritory, deleteTerritory, saveClaimed, deleteClaimed, testInstantly,
} from "../../../lib/campaigns";

export const dynamic = "force-dynamic";

// GET → everything the Settings tab shows.
// POST { op: "save", key: "sending"|"compliance"|"campaign_defaults", value }
//      { op: "territory", ...fields, id? } | { op: "territory_delete", id }
//      { op: "claimed", ...fields, id? }   | { op: "claimed_delete", id }
//      { op: "test_instantly" }
// Every change is Matt's (owner) only and is logged to Activity.
export async function GET(req: NextRequest) {
  return guarded(req, async () => getSettings());
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<Record<string, unknown>>(req);
    const id = typeof b.id === "string" ? b.id : "";
    switch (b.op) {
      case "save": return saveSettings(String(b.key ?? ""), (b.value ?? {}) as Record<string, unknown>);
      case "territory": return saveTerritory(b);
      case "territory_delete": if (!id) throw new CrmError("id is required", 400); return deleteTerritory(id);
      case "claimed": return saveClaimed(b);
      case "claimed_delete": if (!id) throw new CrmError("id is required", 400); return deleteClaimed(id);
      case "test_instantly": return testInstantly();
      default: throw new CrmError("Unknown op", 400);
    }
  });
}
