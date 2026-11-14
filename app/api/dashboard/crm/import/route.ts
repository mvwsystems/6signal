import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../_util";
import { commitImport, dedupeKeys, listImports, CrmError } from "../../../../lib/crm";
import { applyMapping, computeVerdicts, Mapping } from "../../../../lib/crmCore";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET  → recent imports with their dedupe reports.
// POST { action: "preview" | "commit", filename, source, rows: string[][] (no header), mapping }
//   preview → per-row verdicts (new / duplicate-in-file / duplicate-in-db / invalid). Writes nothing.
//   commit  → recomputes verdicts against the live table, inserts only "new" rows,
//             and records the import with its merge candidates.
export async function GET(req: NextRequest) {
  return guarded(req, async () => ({ imports: await listImports() }));
}

export async function POST(req: NextRequest) {
  return guarded(req, async () => {
    const b = await jsonBody<{ action?: string; filename?: string; source?: string; rows?: string[][]; mapping?: Mapping }>(req);
    if (!Array.isArray(b.rows) || !b.rows.length) throw new CrmError("No rows", 400);
    if (b.rows.length > 20000) throw new CrmError("Split files over 20,000 rows", 400);
    if (!b.mapping || b.mapping.company == null) throw new CrmError("Map a column to Company first", 400);
    const records = b.rows.map((r) => applyMapping(r, b.mapping!));
    const verdicts = computeVerdicts(records, await dedupeKeys());
    const summary = { total: records.length, ...Object.fromEntries(["new", "duplicate-in-file", "duplicate-in-db", "invalid"].map((v) => [v, verdicts.filter((x) => x.verdict === v).length])) };
    if (b.action === "commit") {
      const res = await commitImport({ filename: b.filename || "upload.csv", source: b.source?.trim() || null, mapping: b.mapping, records, verdicts });
      return { ...res, summary };
    }
    return { verdicts, summary };
  });
}
