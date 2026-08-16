import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";

export const dynamic = "force-dynamic";

// All 2026 revenue, straight from Stripe charges. Charges are the one object
// that covers both revenue paths: invoice payments (retainers, care plans) AND
// payment-link checkouts (the $27/$97/$197 funnel, website builds) — invoices
// alone miss the funnel entirely. Amounts are net of refunds.
// Requires STRIPE_SECRET_KEY with Charges read access.

interface RevPayment {
  date: string;        // ISO
  amount: number;      // cents, net of refunds
  source: string;      // classified bucket
  email: string | null;
  description: string | null;
}

const YEAR = 2026;

function classify(charge: Record<string, any>): string {
  if (charge.invoice) return "Client invoices (retainers & care)";
  switch (charge.amount) {
    case 2700: return "AI Visibility Audit ($27)";
    case 9700: return "Strategy Brief ($97)";
    case 19700: return "Strategy Call ($197)";
    case 150000: return "Website build ($1,500)";
    default: return charge.description ? String(charge.description).slice(0, 60) : "Other";
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ configured: false, note: "STRIPE_SECRET_KEY not set in Netlify env vars." });

  const from = Math.floor(Date.UTC(YEAR, 0, 1) / 1000);
  const to = Math.floor(Date.UTC(YEAR + 1, 0, 1) / 1000);

  const charges: Record<string, any>[] = [];
  let startingAfter: string | null = null;
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams({ limit: "100", "created[gte]": String(from), "created[lt]": String(to) });
    if (startingAfter) qs.set("starting_after", startingAfter);
    let res: Response;
    try {
      res = await fetch(`https://api.stripe.com/v1/charges?${qs}`, {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
    } catch (e) {
      console.error("[revenue] Stripe fetch failed:", e);
      return NextResponse.json({ configured: false, note: "Could not reach Stripe." });
    }
    if (!res.ok) {
      console.error(`[revenue] Stripe charges -> ${res.status}`);
      const note = res.status === 401 || res.status === 403
        ? "The Stripe key can't read charges — if it's a restricted key, grant it Charges: Read in the Stripe dashboard."
        : `Stripe returned ${res.status} for charges.`;
      return NextResponse.json({ configured: false, note });
    }
    const body = (await res.json()) as Record<string, any>;
    const data = (body.data as Record<string, any>[]) ?? [];
    charges.push(...data);
    if (!body.has_more || data.length === 0) break;
    startingAfter = data[data.length - 1].id;
  }

  const byMonth: number[] = Array(12).fill(0);
  const bySource = new Map<string, { amount: number; count: number }>();
  const payments: RevPayment[] = [];

  for (const c of charges) {
    if (!c.paid || c.status !== "succeeded") continue;
    const net = (c.amount ?? 0) - (c.amount_refunded ?? 0);
    if (net <= 0) continue;
    const d = new Date((c.created as number) * 1000);
    byMonth[d.getUTCMonth()] += net;
    const source = classify(c);
    const agg = bySource.get(source) ?? { amount: 0, count: 0 };
    agg.amount += net;
    agg.count += 1;
    bySource.set(source, agg);
    payments.push({
      date: d.toISOString(),
      amount: net,
      source,
      email: c.billing_details?.email ?? c.receipt_email ?? null,
      description: c.description ?? null,
    });
  }

  payments.sort((a, b) => (a.date < b.date ? 1 : -1));
  const total = byMonth.reduce((s, v) => s + v, 0);
  const sources = [...bySource.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({
    configured: true,
    year: YEAR,
    total,
    count: payments.length,
    byMonth,
    bySource: sources,
    payments,
  });
}
