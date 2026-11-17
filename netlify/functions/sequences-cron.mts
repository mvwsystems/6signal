// Netlify Scheduled Function — drafts sequence follow-ups as they come due.
// Drafts only: follow-ups never send from here.

export default async () => {
  const base = process.env.URL || "https://6signal.co";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[sequences-cron] CRON_SECRET not set — skipping");
    return new Response("skipped: no CRON_SECRET", { status: 200 });
  }
  try {
    const r = await fetch(`${base}/api/dashboard/sequences/cron`, { method: "POST", headers: { "x-cron-secret": secret, "Content-Type": "application/json" }, body: "{}" });
    const text = await r.text().catch(() => "");
    return new Response(`sequences ${r.status}: ${text.slice(0, 300)}`, { status: 200 });
  } catch (e) {
    console.error("[sequences-cron] failed:", e);
    return new Response(`sequences error: ${e}`, { status: 200 });
  }
};

// Every hour, on the quarter hour.
export const config = { schedule: "15 * * * *" };
