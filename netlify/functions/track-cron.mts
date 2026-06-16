// Netlify Scheduled Function — weekly AI-visibility probe run.
// Pings the cron endpoint with the shared secret; the endpoint does the work.
// Config-only schedule (no @netlify/functions type import to avoid a dep).

export default async () => {
  const base = process.env.URL || "https://6signal.co";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[track-cron] CRON_SECRET not set — skipping");
    return new Response("skipped: no CRON_SECRET", { status: 200 });
  }
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

// Mondays at 08:00 UTC. Adjust cadence here.
export const config = { schedule: "0 8 * * 1" };
