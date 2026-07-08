import { NextRequest, NextResponse } from "next/server";
import { probeEngine, enginesWithKeys } from "../../lib/engines";
import { listAllActiveTracked, getLastProbeTimes, db } from "../../lib/db";
import { sendEmail, emailShell, heading, paragraph, monoLabel } from "../../lib/email";

export const maxDuration = 120;

// Daily self-test. Emails the owner ONLY when something is broken or degraded
// (dead engine key, stale model fallback, weekly probe cron not running, DB
// down), plus one "all systems green" heartbeat on Mondays so silence is never
// ambiguous. Gated by CRON_SECRET; fired by netlify/functions/watchdog-cron.

const ALERT_TO = () => process.env.LEAD_ALERT_TO || "hello@6signal.co";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const problems: string[] = [];
  const warnings: string[] = [];
  const ok: string[] = [];

  // 1) Database reachable?
  if (!db()) {
    problems.push("Database: Supabase client not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }

  // 2) Every engine with a key answers a cheap probe.
  const engines = enginesWithKeys();
  if (engines.length === 0) {
    problems.push("Engines: NO engine API keys configured — tracking is dead.");
  } else {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 100_000);
    try {
      const results = await Promise.all(
        engines.map((e) => probeEngine(e, "Who is a good plumber in Dallas, TX?", controller.signal))
      );
      for (const r of results) {
        if (!r.ok) problems.push(`Engine ${r.engine}: FAILING — ${r.error}`);
        else if (r.note) warnings.push(`Engine ${r.engine}: ${r.note}`);
        else ok.push(`Engine ${r.engine}: OK`);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  // 3) Is the weekly probe cron actually producing data?
  try {
    const tracked = await listAllActiveTracked();
    if (tracked.length > 0) {
      const lastTimes = Object.values(await getLastProbeTimes());
      const newest = lastTimes.sort().pop();
      const ageDays = newest ? (Date.now() - new Date(newest).getTime()) / 86400000 : Infinity;
      if (!newest) warnings.push(`Probe cron: ${tracked.length} prompts tracked but no probe results yet (first weekly run pending?).`);
      else if (ageDays > 8) problems.push(`Probe cron: newest probe result is ${Math.round(ageDays)} days old — the weekly run is not firing.`);
      else ok.push(`Probe cron: last run ${ageDays.toFixed(1)} days ago.`);
    } else {
      ok.push("Probe cron: nothing tracked yet.");
    }
  } catch (e) {
    problems.push(`Probe-freshness check failed: ${String(e).slice(0, 200)}`);
  }

  // 4) Email the verdict. Alerts always; green heartbeat only on Mondays.
  const isMonday = new Date().getUTCDay() === 1;
  const broken = problems.length > 0;
  const degraded = warnings.length > 0;
  let emailed = false;

  if (broken || degraded || isMonday) {
    const status = broken ? "SYSTEM ALERT" : degraded ? "System degraded" : "All systems green";
    const items = [
      ...problems.map((p) => `<span style="color:#ef4444;">✗ ${p}</span>`),
      ...warnings.map((w) => `<span style="color:#f97316;">△ ${w}</span>`),
      ...ok.map((o) => `<span style="color:#22c55e;">✓ ${o}</span>`),
    ];
    emailed = await sendEmail({
      to: ALERT_TO(),
      subject: broken ? "🔴 6 Signal watchdog: something is broken" : degraded ? "🟠 6 Signal watchdog: degraded" : "🟢 6 Signal watchdog: all green",
      html: emailShell(
        [
          monoLabel("Watchdog · daily self-test"),
          heading(status),
          paragraph(items.join("<br/>")),
          paragraph(`Engines tested: ${engines.join(", ") || "none"}. Fix keys in Netlify env, then redeploy. The "Test engines" button in the dashboard shows live detail.`),
        ].join("")
      ),
    });
    if ((broken || degraded) && !emailed) {
      console.error("[watchdog] ALERT COULD NOT BE EMAILED:", { problems, warnings });
    }
  }

  return NextResponse.json({ ok: !broken, problems, warnings, healthy: ok, emailed });
}
