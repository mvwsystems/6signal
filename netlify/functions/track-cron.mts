// Netlify Scheduled Function — BIWEEKLY AI-visibility probe run.
// Fires every Monday but only acts on even epoch-weeks (every 2 weeks) —
// clients don't need weekly probes. The endpoint enqueues the sweep onto the
// background worker, so this trigger returns instantly (no retry duplicates).

export default async () => {
  const base = process.env.URL || "https://6signal.co";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[track-cron] CRON_SECRET not set — skipping");
    return new Response("skipped: no CRON_SECRET", { status: 200 });
  }
  // Biweekly gate: act only on even weeks since epoch (deterministic).
  const week = Math.floor(Date.now() / (7 * 86400000));
  if (week % 2 === 1) return new Response("skipped: off-week (biweekly cadence)", { status: 200 });
  try {
    const r = await fetch(`${base}/api/dashboard/track/cron`, {
      method: "POST",
      headers: { "x-cron-secret": secret, "Content-Type": "application/json" },
      body: "{}",
    });
    const text = await r.text().catch(() => "");
    return new Response(`cron ${r.status}: ${text.slice(0, 200)}`, { status: 200 });
  } catch (e) {
    console.error("[track-cron] failed:", e);
    return new Response(`cron error: ${e}`, { status: 200 });
  }
};

// Mondays at 08:00 UTC; the parity gate above makes it biweekly.
export const config = { schedule: "0 8 * * 1" };
