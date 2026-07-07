import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/dashboard-auth";
import { probeEngine, ENGINES } from "../../../../lib/engines";

export const maxDuration = 120;

// Engine self-test: fires one cheap probe per engine and returns the RAW
// error for anything that fails — so a dead engine (bad key, missing billing,
// wrong model) is diagnosable from the dashboard instead of Netlify logs.

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 110_000);
  try {
    const results = await Promise.all(
      ENGINES.map(async (e) => {
        const started = Date.now();
        const a = await probeEngine(e, "Who is a good plumber in Dallas, TX?", controller.signal);
        return {
          engine: e,
          ok: a.ok,
          error: a.error ?? null,
          answerChars: a.text.length,
          sources: a.sources.length,
          ms: Date.now() - started,
        };
      })
    );
    return NextResponse.json({ results });
  } finally {
    clearTimeout(timer);
  }
}
