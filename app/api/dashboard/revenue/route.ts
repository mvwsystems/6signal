import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { getManualPayments } from "../../../lib/db";

export const dynamic = "force-dynamic";

// Revenue for one calendar year (?year=YYYY, default the current one), from
// three sources that together cover every way money actually arrives:
//
//   1. Stripe CHARGES — invoice payments (retainers, care plans) AND
//      payment-link checkouts (the $27/$97/$197 funnel, website builds).
//      Invoices alone miss the funnel entirely, hence charges.
//   2. Stripe INVOICE PAYMENT RECORDS — an invoice marked "paid out of band"
//      produces an `invoice_payment` whose payment is a `payment_record`, and
//      NO charge. It shows in the Stripe Payments list but /v1/charges never
//      returns it, so before 2026-11-09 this money was silently absent from
//      the report ($5,722 of it across 2026 — see the dedupe note below).
//   3. manual_payments (Supabase) — money that never touched Stripe at all
//      (ACH direct to the business account, checks, wires), hand-entered.
//
// Amounts are net of refunds. (2) and (3) overlap when the operator both
// records a payment against the Stripe invoice AND hand-enters it, so a
// hand-entered row that matches an out-of-band Stripe payment is dropped in
// favour of Stripe's — Stripe carries the authoritative settlement date.
// Requires STRIPE_SECRET_KEY with Charges read + Invoices read access.

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
const INVOICE_SOURCE = "Client invoices (retainers & care)";
const METHOD_LABELS: Record<string, string> = {
  ach: "ACH",
  check: "Check",
  wire: "Wire",
  cash: "Cash",
  zelle: "Zelle",
  other: "Off-Stripe",
};

// A hand-entered row and an out-of-band Stripe payment are treated as the same
// money when the amounts match and the dates are close. They rarely agree to
// the day: the operator enters the day the funds landed, Stripe records the day
// the invoice was closed out (the real pair this was built for sat 3 days
// apart). Exact-amount matching keeps the window from catching anything else.
const DEDUPE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

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
  if (charge.invoice) return INVOICE_SOURCE;
  switch (charge.amount) {
    case 2700: return "AI Visibility Audit ($27)";
    case 9700: return "Strategy Brief ($97)";
    case 19700: return "Strategy Call ($197)";
    case 150000: return "Website build ($1,500)";
    default: return charge.description ? String(charge.description).slice(0, 60) : "Other";
  }
}

/** Page through a Stripe list endpoint. Returns null if any page fails. */
async function stripeList(
  key: string,
  path: string,
  params: Record<string, string>,
): Promise<Record<string, any>[] | null> {
  const out: Record<string, any>[] = [];
  let startingAfter: string | null = null;
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams({ ...params, limit: "100" });
    if (startingAfter) qs.set("starting_after", startingAfter);
    let res: Response;
    try {
      res = await fetch(`https://api.stripe.com/v1/${path}?${qs}`, {
        headers: { Authorization: `Bearer ${key}` },
        cache: "no-store",
      });
    } catch (e) {
      console.error(`[revenue] Stripe fetch failed (${path}):`, e);
      return null;
    }
    if (!res.ok) {
      console.error(`[revenue] Stripe ${path} -> ${res.status}`);
      return null;
    }
    const body = (await res.json()) as Record<string, any>;
    const data = (body.data as Record<string, any>[]) ?? [];
    out.push(...data);
    if (!body.has_more || data.length === 0) break;
    startingAfter = data[data.length - 1].id;
  }
  return out;
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

  // Off-Stripe rows are the only record of that money, so they must survive
  // Stripe being unconfigured or unreachable. They are held back rather than
  // added immediately so a row can be dropped once Stripe turns out to hold
  // the same payment — with Stripe down, nothing is dropped and all of them
  // still show.
  const manual = await getManualPayments(YEAR);

  const years: number[] = [];
  let failure: string | null = null;   // Stripe data missing or partial
  const notices: string[] = [];        // bookkeeping the operator should act on
  const outOfBand: { payment: RevPayment; at: number }[] = [];

  if (!key) {
    failure = "STRIPE_SECRET_KEY not set in Netlify env vars — Stripe revenue is missing from these totals.";
    years.push(thisYear);
    if (YEAR !== thisYear) years.push(YEAR);
  } else {
    const since = await firstYear(key, thisYear);
    for (let y = thisYear; y >= Math.min(since, YEAR); y--) years.push(y);

    const from = Math.floor(Date.UTC(YEAR, 0, 1) / 1000);
    const to = Math.floor(Date.UTC(YEAR + 1, 0, 1) / 1000);

    // ── Charges ────────────────────────────────────────────────────────────
    const charges = await stripeList(key, "charges", {
      "created[gte]": String(from),
      "created[lt]": String(to),
    });
    if (charges === null) {
      failure =
        "Could not read charges from Stripe — Stripe revenue is missing from these totals. If the key is restricted, grant it Charges: Read.";
    } else {
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

    // ── Invoices paid out of band ──────────────────────────────────────────
    // These have no charge at all, so without this pass they are invisible.
    // Filtered by `created` (which for a payment record sits within seconds of
    // settlement) with a back-buffer, then checked against the real paid_at —
    // an invoice raised last year but settled this one still belongs here.
    const BUFFER = 90 * 24 * 60 * 60;
    const invPayments = await stripeList(key, "invoice_payments", {
      status: "paid",
      "created[gte]": String(from - BUFFER),
      "created[lt]": String(to + BUFFER),
      "expand[]": "data.invoice",
    });
    if (invPayments === null) {
      const msg =
        "Could not read invoice payments from Stripe — any invoice paid out of band is missing from these totals. If the key is restricted, grant it Invoices: Read.";
      failure = failure ? `${failure} ${msg}` : msg;
    } else {
      for (const ip of invPayments) {
        if (ip.status !== "paid") continue;
        // payment_intent-backed invoice payments already produced a charge and
        // were counted above. Only payment_records are new money here.
        if (ip.payment?.type !== "payment_record") continue;
        const paidAt = (ip.status_transitions?.paid_at ?? ip.created) as number;
        if (!(paidAt >= from && paidAt < to)) continue;
        const amount = (ip.amount_paid ?? 0) as number;
        if (amount <= 0) continue;
        const inv = (ip.invoice ?? {}) as Record<string, any>;
        const who = inv.customer_name || inv.customer_email || "Client";
        const num = inv.number ? ` — invoice ${inv.number}` : "";
        outOfBand.push({
          at: paidAt * 1000,
          payment: {
            date: new Date(paidAt * 1000).toISOString(),
            amount,
            source: INVOICE_SOURCE,
            label: `${who}${num} (paid out of band)`,
            email: inv.customer_email ?? null,
            description: inv.lines?.data?.[0]?.description ?? null,
          },
        });
      }
      for (const o of outOfBand) add(o.payment);
    }
  }

  // ── Hand-entered rows, minus anything Stripe already told us about ───────
  const claimed = new Set<number>();
  const dropped: string[] = [];
  for (const m of manual) {
    if (!(m.amount > 0)) continue;
    const at = new Date(m.paid_at).getTime();
    const hit = outOfBand.findIndex(
      (o, i) => !claimed.has(i) && o.payment.amount === m.amount && Math.abs(o.at - at) <= DEDUPE_WINDOW_MS,
    );
    if (hit !== -1) {
      claimed.add(hit);
      dropped.push(`${m.client} $${(m.amount / 100).toFixed(2)}`);
      continue;
    }
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
  if (dropped.length) {
    notices.push(
      `Counted once, not twice: ${dropped.join(", ")} — recorded both by hand and against a Stripe invoice as paid out of band. Stripe's record is the one counted; the hand-entered row can be deleted.`,
    );
  }

  // Stripe down AND nothing off-Stripe to show: there is no data, so say so
  // rather than rendering a confident set of zeroes.
  if (failure && payments.length === 0) {
    return NextResponse.json({ configured: false, years, note: failure });
  }

  payments.sort((a, b) => (a.date < b.date ? 1 : -1));
  const total = byMonth.reduce((s, v) => s + v, 0);
  const sources = [...bySource.entries()]
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.amount - a.amount);

  const note = [failure, ...notices].filter(Boolean).join(" ") || undefined;

  return NextResponse.json({
    configured: true,
    note,
    year: YEAR,
    years,
    total,
    count: payments.length,
    byMonth,
    bySource: sources,
    payments,
  });
}
