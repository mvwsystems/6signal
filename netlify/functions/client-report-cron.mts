// Netlify Scheduled Function — monthly client reports.
// 1st of each month: generates a fresh client report per tracked business and
// emails the owner a review copy (nothing goes to clients unsent).

export default async () => {
  const base = process.env.URL || "https://6signal.co";
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[client-report-cron] CRON_SECRET not set — skipping");
    return new Response("skipped: no CRON_SECRET", { status: 200 });
  }
  try {
    const r = await fetch(`${base}/api/dashboard/client-report/cron`, {
      method: "POST",
      headers: { "x-cron-secret": secret, "Content-Type": "application/json" },
      body: "{}",
    });
    const text = await r.text().catch(() => "");
    return new Response(`client-reports ${r.status}: ${text.slice(0, 200)}`, { status: 200 });
  } catch (e) {
    console.error("[client-report-cron] failed:", e);
    return new Response(`error: ${e}`, { status: 200 });
  }
};

// 1st of each month, 15:00 UTC (~10am Central).
export const config = { schedule: "0 15 1 * *" };
