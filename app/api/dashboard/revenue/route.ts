import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { getManualPayments } from "../../../lib/db";

export const dynamic = "force-dynamic";

// Revenue for one calendar year (?year=YYYY, default the current one), straight
// from Stripe charges, PLUS off-Stripe payments from the manual_payments table.
// Charges are the one Stripe object that covers both revenue paths: invoice
// payments (retainers, care plans) AND payment-link checkouts (the $27/$97/$197
// funnel, website builds) — invoices alone miss the funnel entirely. But money
// that never touched Stripe (ACH direct to the business account, checks, wires)
// has no charge at all, so it comes from Supabase and is merged in here.
// Amounts are net of refunds.
// Requires STRIPE_SECRET_KEY with Charges read access.

interface RevPayment {
  date: string;        // ISO
  amount: number;      // cents, net of refunds
  source: string;      // classified bucket, aggregated in bySource
  label?: string;      // row text when the bucket is too coarse to identify it
  email: string | null;
  description: string | null;
}

// Floor for the year picker if Stripe won't tell us when the account opened.
const FALLBACK_FIRST_YEAR = 2024;

// One bucket for everything off-Stripe: the useful split is Stripe vs not, and
// per-method rows would bury the real product buckets.
const MANUAL_SOURCE = "Off-Stripe (ACH, checks & wires)";
const METHOD_LABELS: Record<string, string> = {
  ach: "ACH",
  check: "Check",
  wire: "Wire",
  cash: "Cash",
  zelle: "Zelle",
  other: "Off-Stripe",
};

// Selectable years run from the Stripe account's creation year to now. One
// cheap /v1/account call; restricted keys may not read it, hence the fallback.
async function firstYear(key: string, thisYear: number): Promise<number> {
  try {
    const res = await fetch("https://api.stripe.com/v1/account", {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return FALLBACK_FIRST_YEAR;
    const acct = (await res.json()) as { created?: number };
    if (!acct.created) return FALLBACK_FIRST_YEAR;
    const y = new Date(acct.created * 1000).getUTCFullYear();
    return y >= 2000 && y <= thisYear ? y : FALLBACK_FIRST_YEAR;
  } catch {
    return FALLBACK_FIRST_YEAR;
  }
}

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

  const thisYear = new Date().getUTCFullYear();
  const asked = Number(req.nextUrl.searchParams.get("year"));
  const YEAR = Number.isInteger(asked) && asked >= 2000 && asked <= thisYear ? asked : thisYear;

  const byMonth: number[] = Array(12).fill(0);
  const bySource = new Map<string, { amount: number; count: number }>();
  const payments: RevPayment[] = [];

  function add(p: RevPayment) {
    byMonth[new Date(p.date).getUTCMonth()] += p.amount;
    const agg = bySource.get(p.source) ?? { amount: 0, count: 0 };
    agg.amount += p.amount;
    agg.count += 1;
    bySource.set(p.source, agg);
    payments.push(p);
  }

  // Off-Stripe first: these rows are the only record of that money, so they
  // must still show when Stripe is unconfigured or unreachable.
  const manual = await getManualPayments(YEAR);
  for (const m of manual) {
    if (!(m.amount > 0)) continue;
    const method = METHOD_LABELS[m.method] ?? m.method.toUpperCase();
    add({
      date: new Date(m.paid_at).toISOString(),
      amount: m.amount,
      source: MANUAL_SOURCE,
      label: `${m.client} — ${method}`,
      email: m.email,
      description: m.description,
    });
  }

  let years: number[] = [];
  let note: string | null = null;

  if (!key) {
    note = "STRIPE_SECRET_KEY not set in Netlify env vars — Stripe revenue is missing from these totals.";
    years = [thisYear];
    if (YEAR !== thisYear) years.push(YEAR);
  } else {
    const since = await firstYear(key, thisYear);
    for (let y = thisYear; y >= Math.min(since, YEAR); y--) years.push(y);

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
        note = "Could not reach Stripe — Stripe revenue is missing from these totals.";
        break;
      }
      if (!res.ok) {
        console.error(`[revenue] Stripe charges -> ${res.status}`);
        note = res.status === 401 || res.status === 403
          ? "The Stripe key can't read charges — if it's a restricted key, grant it Charges: Read in the Stripe dashboard. Stripe revenue is missing from these totals."
          : `Stripe returned ${res.status} for charges — Stripe revenue is missing from these totals.`;
        break;
      }
      const body = (await res.json()) as Record<string, any>;
      const data = (body.data as Record<string, any>[]) ?? [];
      charges.push(...data);
      if (!body.has_more || data.length === 0) break;
      startingAfter = data[data.length - 1].id;
    }

    // A mid-pagination failure would otherwise report a partial year as fact.
    if (note) charges.length = 0;

    for (const c of charges) {
      if (!c.paid || c.status !== "succeeded") continue;
      const net = (c.amount ?? 0) - (c.amount_refunded ?? 0);
      if (net <= 0) continue;
      add({
        date: new Date((c.created as number) * 1000).toISOString(),
        amount: net,
        source: classify(c),
        email: c.billing_details?.email ?? c.receipt_email ?? null,
        description: c.description ?? null,
      });
    }
  }

  // Stripe down AND nothing off-Stripe to show: there is no data, so say so
  // rather than rendering a confident set of zeroes.
  if (note && payments.length === 0) {
    return NextResponse.json({ configured: false, years, note });
  }

  payments.sort((a, b) => (a.date < b.date ? 1 : -1));
  const total = byMonth.reduce((s, v) => s + v, 0);
  const sources = [...bySource.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({
    configured: true,
    note: note ?? undefined,
    year: YEAR,
    years,
    total,
    count: payments.length,
    byMonth,
    bySource: sources,
    payments,
  });
}
