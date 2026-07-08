// Enqueue heavy report work onto the Netlify background function. The routes
// stay fast (< 1s) and the browser polls /api/audit/<auditId> for the result.

export async function enqueueReport(payload: {
  kind: "scan" | "battle-plan" | "execution-plan";
  auditId: string;
  businessId: string | null;
  name: string;
  url: string | null;
  trade: string;
  city: string;
  fromAuditId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.CRON_SECRET;
  if (!secret) return { ok: false, error: "CRON_SECRET is not configured — the report worker cannot be invoked." };
  const base = process.env.URL || "https://6signal.co";
  try {
    const r = await fetch(`${base}/.netlify/functions/report-worker-background`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-worker-secret": secret },
      body: JSON.stringify(payload),
    });
    // Background functions acknowledge with 202 and keep running.
    if (r.status >= 300) return { ok: false, error: `Report worker rejected the job (${r.status}).` };
    return { ok: true };
  } catch (e) {
    console.error("[enqueue] failed:", e);
    return { ok: false, error: "Could not reach the report worker." };
  }
}
