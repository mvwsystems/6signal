import { NextRequest } from "next/server";
import { guarded, jsonBody } from "../../crm/_util";
import { startRun, finishRun } from "../../../../lib/staff";

export const dynamic = "force-dynamic";

// The run log, written by the agents themselves (Casey's automation token or
// a signed-in session).
// POST { agent_key, job?, trigger?: schedule|manual|event, playbook_version?, meta? }
//   → starts a run; refused (409) while the agent is switched off (except a
//     manual run) or past its monthly spend cap. Returns the run with its id.
// PATCH { id, status: succeeded|failed|cancelled, result?, items_created?, rows_written?, cost_usd?, error? }
//   → finishes it. A failed run raises an "Agent job failed" exception on Today.
export async function POST(req: NextRequest) {
  return guarded(req, async () => startRun(await jsonBody(req)));
}

export async function PATCH(req: NextRequest) {
  return guarded(req, async () => {
    const { id, ...rest } = await jsonBody<{ id?: string; status?: string; result?: string; items_created?: number; rows_written?: number; cost_usd?: number; error?: string }>(req);
    return finishRun(id, rest);
  });
}
