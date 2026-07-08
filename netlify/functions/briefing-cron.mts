// Netlify Scheduled Function — Monday owner briefing.
// Runs after the weekly probes (08:00) so the briefing covers fresh data.

export default async () => {
  const base = process.env.URL || "https://6signal.co";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[briefing-cron] CRON_SECRET not set — skipping");
    return new Response("skipped: no CRON_SECRET", { status: 200 });
  }
  try {
    const r = await fetch(`${base}/api/briefing`, {
      method: "POST",
      headers: { "x-cron-secret": secret, "Content-Type": "application/json" },
      body: "{}",
    });
    const text = await r.text().catch(() => "");
    return new Response(`briefing ${r.status}: ${text.slice(0, 300)}`, { status: 200 });
  } catch (e) {
    console.error("[briefing-cron] failed:", e);
    return new Response(`briefing error: ${e}`, { status: 200 });
  }
};

// Mondays 14:00 UTC (~9am Central), after probes (08:00) and watchdog (12:00).
export const config = { schedule: "0 14 * * 1" };
