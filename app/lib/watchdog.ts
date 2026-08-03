// Daily watchdog — runs inside the BACKGROUND worker (engine tests take
// 30-60s; running them in a scheduled function's request cycle made the
// trigger time out and Netlify retry it → duplicate alert emails).

import { probeEngine, enginesWithKeys } from "./engines";
import { listAllActiveTracked, getLastProbeTimes, db } from "./db";
import { sendEmail, emailShell, heading, paragraph, monoLabel } from "./email";

const ALERT_TO = () => process.env.LEAD_ALERT_TO || "hello@6signal.co";

export async function runWatchdog(): Promise<{ ok: boolean; problems: string[]; warnings: string[]; healthy: string[]; emailed: boolean }> {
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
      // Second chance before paging the owner: engine APIs throw transient
      // 429/529s that a single-shot probe misreads as "broken". Re-probe
      // failures once after a pause; only a repeat failure is a problem.
      const failed = results.filter((r) => !r.ok);
      const retried = new Map<string, { ok: boolean; error?: string }>();
      if (failed.length > 0) {
        await new Promise((r) => setTimeout(r, 20_000));
        const controller2 = new AbortController();
        const timer2 = setTimeout(() => controller2.abort(), 100_000);
        try {
          const second = await Promise.all(
            failed.map((r) => probeEngine(r.engine, "Who is a good plumber in Dallas, TX?", controller2.signal))
          );
          for (const r of second) retried.set(r.engine, { ok: r.ok, error: r.error });
        } finally {
          clearTimeout(timer2);
        }
      }
      for (const r of results) {
        if (!r.ok) {
          const second = retried.get(r.engine);
          if (second?.ok) warnings.push(`Engine ${r.engine}: transient failure, recovered on retry (first error: ${r.error})`);
          else problems.push(`Engine ${r.engine}: FAILING — ${second?.error ?? r.error}`);
        } else if (r.note) warnings.push(`Engine ${r.engine}: ${r.note}`);
        else ok.push(`Engine ${r.engine}: OK`);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  // 3) Is the probe cron actually producing data? (Biweekly cadence → alert
  //    only when the newest result is older than ~16 days.)
  try {
    const tracked = await listAllActiveTracked();
    if (tracked.length > 0) {
      const lastTimes = Object.values(await getLastProbeTimes());
      const newest = lastTimes.sort().pop();
      const ageDays = newest ? (Date.now() - new Date(newest).getTime()) / 86400000 : Infinity;
      if (!newest) warnings.push(`Probe cron: ${tracked.length} prompts tracked but no probe results yet (first scheduled run pending?).`);
      else if (ageDays > 16) problems.push(`Probe cron: newest probe result is ${Math.round(ageDays)} days old — the biweekly run is not firing.`);
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

  return { ok: !broken, problems, warnings, healthy: ok, emailed };
}
