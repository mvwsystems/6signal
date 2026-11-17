// Netlify Scheduled Function — reads new mail in Casey's inbox (C5).
// Reads and matches only; nothing sends.

export default async () => {
  const base = process.env.URL || "https://6signal.co";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[inbox-cron] CRON_SECRET not set — skipping");
    return new Response("skipped: no CRON_SECRET", { status: 200 });
  }
  try {
    const r = await fetch(`${base}/api/dashboard/inbox/cron`, { method: "POST", headers: { "x-cron-secret": secret, "Content-Type": "application/json" }, body: "{}" });
    const text = await r.text().catch(() => "");
    return new Response(`inbox ${r.status}: ${text.slice(0, 300)}`, { status: 200 });
  } catch (e) {
    console.error("[inbox-cron] failed:", e);
    return new Response(`inbox error: ${e}`, { status: 200 });
  }
};

// Every 15 minutes.
export const config = { schedule: "*/15 * * * *" };
