import { NextRequest } from "next/server";
import { guarded } from "../_util";
import { customers } from "../../../../lib/crm";

export const dynamic = "force-dynamic";

// GET → prospects with status Customer, each with its next open dated note.
export async function GET(req: NextRequest) {
  return guarded(req, () => customers());
}
