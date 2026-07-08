// Netlify Scheduled Function — daily system watchdog.
// Pings the watchdog endpoint with the shared secret; the endpoint self-tests
// engines, probe freshness, and DB, and emails the owner on failure (plus a
// green heartbeat on Mondays).

export default async () => {
  const base = process.env.URL || "https://6signal.co";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[watchdog-cron] CRON_SECRET not set — skipping");
    return new Response("skipped: no CRON_SECRET", { status: 200 });
  }
  try {
    const r = await fetch(`${base}/api/watchdog`, {
      method: "POST",
      headers: { "x-cron-secret": secret, "Content-Type": "application/json" },
      body: "{}",
    });
    const text = await r.text().catch(() => "");
    return new Response(`watchdog ${r.status}: ${text.slice(0, 300)}`, { status: 200 });
  } catch (e) {
    console.error("[watchdog-cron] failed:", e);
    return new Response(`watchdog error: ${e}`, { status: 200 });
  }
};

// Daily at 12:00 UTC (~7am Central).
export const config = { schedule: "0 12 * * *" };
