// Netlify Scheduled Function — BIWEEKLY owner briefing.
// Same even-week gate as the probe run so the briefing always covers a fresh
// probe sweep. The endpoint enqueues onto the background worker (instant
// return → no scheduled-trigger retries → no duplicate emails).

export default async () => {
  const base = process.env.URL || "https://6signal.co";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[briefing-cron] CRON_SECRET not set — skipping");
    return new Response("skipped: no CRON_SECRET", { status: 200 });
  }
  const week = Math.floor(Date.now() / (7 * 86400000));
  if (week % 2 === 1) return new Response("skipped: off-week (biweekly cadence)", { status: 200 });
  try {
    const r = await fetch(`${base}/api/briefing`, {
      method: "POST",
      headers: { "x-cron-secret": secret, "Content-Type": "application/json" },
      body: "{}",
    });
    const text = await r.text().catch(() => "");
    return new Response(`briefing ${r.status}: ${text.slice(0, 200)}`, { status: 200 });
  } catch (e) {
    console.error("[briefing-cron] failed:", e);
    return new Response(`briefing error: ${e}`, { status: 200 });
  }
};

// Mondays 14:00 UTC (after the 08:00 probes); parity gate makes it biweekly.
export const config = { schedule: "0 14 * * 1" };
