import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../_util";
import { finishLegacyLoad, loadLegacyBatch, CrmError } from "../../../../lib/crm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One-time load of the Manus CRM export, sent from the Import page in batches.
// POST { kind: "prospects" | "contacts" | "notes", rows }  → upserts on legacy_id
// POST { kind: "finish", expected: { prospects, contacts, notes } } → counts the
//   loaded rows, logs the load, and says whether the counts match the file.
export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ kind?: string; rows?: Record<string, unknown>[]; expected?: { prospects: number; contacts: number; notes: number } }>(req);
    if (b.kind === "finish") {
      if (!b.expected) throw new CrmError("Missing expected counts", 400);
      return finishLegacyLoad(b.expected);
    }
    return loadLegacyBatch(String(b.kind), b.rows ?? []);
  });
}
