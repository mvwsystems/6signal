// Daily watchdog — runs inside the BACKGROUND worker (engine tests take
// 30-60s; running them in a scheduled function's request cycle made the
// trigger time out and Netlify retry it → duplicate alert emails).

import { probeEngine, enginesWithKeys } from "./engines";
import { listAllActiveTracked, getLastProbeTimes, db } from "./db";
import { sendEmail, emailShell, heading, paragraph, monoLabel } from "./email";

const ALERT_TO = () => process.env.LEAD_ALERT_TO || "hello@6signal.co";

export async function runWatchdog(): Promise<{
  ok: boolean;
  problems: string[];
  degradations: string[];
  transient: string[];
  warnings: string[];
  healthy: string[];
  emailed: boolean;
}> {
  // Three severities, and only the first may interrupt anyone:
  //   problems     — config faults that stay broken until a human fixes them.
  //   degradations — real but non-urgent (model fallback, no probe data yet).
  //   transient    — upstream capacity or slowness that clears by itself.
  const problems: string[] = [];
  const degradations: string[] = [];
  const transient: string[] = [];
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
        // An engine that 503s or times out under load is not a broken key. It
        // already got retried inside probeEngine, so a blip here says nothing
        // actionable — it rides the Monday heartbeat instead of paging.
        if (!r.ok && r.transient) transient.push(`Engine ${r.engine}: upstream busy or slow after retries — ${r.error}`);
        else if (!r.ok) problems.push(`Engine ${r.engine}: FAILING — ${r.error}`);
        else if (r.note) degradations.push(`Engine ${r.engine}: ${r.note}`);
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
      if (!newest) degradations.push(`Probe cron: ${tracked.length} prompts tracked but no probe results yet (first scheduled run pending?).`);
      else if (ageDays > 16) problems.push(`Probe cron: newest probe result is ${Math.round(ageDays)} days old — the biweekly run is not firing.`);
      else ok.push(`Probe cron: last run ${ageDays.toFixed(1)} days ago.`);
    } else {
      ok.push("Probe cron: nothing tracked yet.");
    }
  } catch (e) {
    problems.push(`Probe-freshness check failed: ${String(e).slice(0, 200)}`);
  }

  // 4) Email the verdict. Only a real fault earns an unscheduled email; every
  //    other state waits for the Monday heartbeat. A slow upstream day used to
  //    send a "System degraded" alert whose own body said to ignore it.
  const isMonday = new Date().getUTCDay() === 1;
  const broken = problems.length > 0;
  const warnings = [...degradations, ...transient];
  let emailed = false;

  if (broken || isMonday) {
    // Transient items never set the headline — that was the false alarm.
    const status = broken
      ? "SYSTEM ALERT"
      : degradations.length
        ? "Green, with known degradations"
        : "All systems green";
    const items = [
      ...problems.map((p) => `<span style="color:#ef4444;">✗ ${p}</span>`),
      ...degradations.map((d) => `<span style="color:#f97316;">△ ${d}</span>`),
      ...ok.map((o) => `<span style="color:#22c55e;">✓ ${o}</span>`),
      ...transient.map((t) => `<span style="color:#9ca3af;">· ${t}</span>`),
    ];
    emailed = await sendEmail({
      to: ALERT_TO(),
      subject: broken
        ? "🔴 6 Signal watchdog: something is broken"
        : degradations.length
          ? "🟠 6 Signal watchdog: weekly check, running degraded"
          : "🟢 6 Signal watchdog: weekly check, all green",
      html: emailShell(
        [
          monoLabel(broken ? "Watchdog · fault" : "Watchdog · weekly check"),
          heading(status),
          paragraph(items.join("<br/>")),
          paragraph(
            `Engines tested: ${engines.join(", ") || "none"}. ` +
            (problems.length
              ? `Red items are configuration faults — fix keys in Netlify env, then redeploy. `
              : "") +
            (degradations.length
              ? `Orange items still work but run on a fallback — worth fixing, not urgent. `
              : "") +
            (transient.length
              ? `Grey items were upstream capacity or slowness on the day of this check and need no action; they matter only if the same engine keeps appearing week after week. `
              : "") +
            `This email sends on a fault, or weekly on Monday. The "Test engines" button in the dashboard shows live detail.`
          ),
        ].join("")
      ),
    });
    if (broken && !emailed) {
      console.error("[watchdog] ALERT COULD NOT BE EMAILED:", { problems, degradations, transient });
    }
  }

  return { ok: !broken, problems, degradations, transient, warnings, healthy: ok, emailed };
}
