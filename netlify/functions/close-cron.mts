// Netlify Scheduled Function — close system: proposal nudges (day 2, 5),
// "call them" flag (day 7), expiry (day 14), unpaid-deposit flag (day 3),
// and retries for signatures/invoices a missed webhook left half done.

export default async () => {
  const base = process.env.URL || "https://6signal.co";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[close-cron] CRON_SECRET not set — skipping");
    return new Response("skipped: no CRON_SECRET", { status: 200 });
  }
  try {
    const r = await fetch(`${base}/api/dashboard/close/cron`, { method: "POST", headers: { "x-cron-secret": secret, "Content-Type": "application/json" }, body: "{}" });
    const text = await r.text().catch(() => "");
    return new Response(`close ${r.status}: ${text.slice(0, 300)}`, { status: 200 });
  } catch (e) {
    console.error("[close-cron] failed:", e);
    return new Response(`close error: ${e}`, { status: 200 });
  }
};

// Every hour, on the half hour.
export const config = { schedule: "30 * * * *" };
