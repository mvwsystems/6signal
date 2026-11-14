import { NextRequest } from "next/server";
import { guarded } from "../_util";
import { crmStats } from "../../../../lib/crm";

export const dynamic = "force-dynamic";

// GET → counts for the CRM dashboard cards plus the 25 latest activity entries.
export async function GET(req: NextRequest) {
  return guarded(req, () => crmStats());
}
