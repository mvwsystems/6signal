import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";

export const dynamic = "force-dynamic";

// Live client-payment state from Stripe: invoices + subscriptions per customer.
// The stripe-webhook only records checkout completions (funnel buys); client
// billing lives in invoices, so the dashboard reads it straight from Stripe.
// Requires STRIPE_SECRET_KEY (a restricted read-only key is fine and safer).

interface PayClient {
  name: string;
  email: string | null;
  total_paid: number; // cents, lifetime paid invoices
  open_amount: number; // cents, open invoices
  open_count: number;
  past_due: boolean; // any open invoice past its due date
  delinquent: boolean; // Stripe's customer-level flag
  oldest_due: string | null; // ISO date of the oldest overdue invoice
}

async function stripeGet(path: string, key: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`https://api.stripe.com/v1/${path}`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[payments] Stripe ${path} -> ${res.status}`);
      return null;
    }
    return (await res.json()) as Record<string, unknown>;
  } catch (e) {
    console.error(`[payments] Stripe ${path} failed:`, e);
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ configured: false, clients: [] });

  const [paidRes, openRes, custRes] = await Promise.all([
    stripeGet("invoices?status=paid&limit=100", key),
    stripeGet("invoices?status=open&limit=100", key),
    stripeGet("customers?limit=100", key),
  ]);
  if (!custRes) return NextResponse.json({ configured: false, clients: [] });

  type AnyRec = Record<string, any>;
  const customers = (custRes.data as AnyRec[]) ?? [];
  const invoices = [
    ...(((paidRes?.data as AnyRec[]) ?? [])),
    ...(((openRes?.data as AnyRec[]) ?? [])),
  ];

  const now = Math.floor(Date.now() / 1000);
  const byCustomer = new Map<string, PayClient>();

  for (const c of customers) {
    byCustomer.set(c.id, {
      name: c.name || c.email || c.id,
      email: c.email ?? null,
      total_paid: 0,
      open_amount: 0,
      open_count: 0,
      past_due: false,
      delinquent: Boolean(c.delinquent),
      oldest_due: null,
    });
  }

  for (const inv of invoices) {
    const entry = byCustomer.get(inv.customer);
    if (!entry) continue;
    if (inv.status === "paid") {
      entry.total_paid += inv.amount_paid ?? 0;
    } else if (inv.status === "open") {
      entry.open_amount += inv.amount_remaining ?? 0;
      entry.open_count += 1;
      if (inv.due_date && inv.due_date < now) {
        entry.past_due = true;
        const due = new Date(inv.due_date * 1000).toISOString();
        if (!entry.oldest_due || due < entry.oldest_due) entry.oldest_due = due;
      }
    }
  }

  // Consolidate duplicate customer records for the same email (Stripe often
  // accumulates several per person) and drop customers with no money history.
  const byEmail = new Map<string, PayClient>();
  for (const c of byCustomer.values()) {
    if (c.total_paid === 0 && c.open_count === 0 && !c.delinquent) continue;
    const k = (c.email ?? c.name).toLowerCase();
    const prev = byEmail.get(k);
    if (!prev) {
      byEmail.set(k, { ...c });
    } else {
      prev.total_paid += c.total_paid;
      prev.open_amount += c.open_amount;
      prev.open_count += c.open_count;
      prev.past_due = prev.past_due || c.past_due;
      prev.delinquent = prev.delinquent || c.delinquent;
      if (c.oldest_due && (!prev.oldest_due || c.oldest_due < prev.oldest_due)) prev.oldest_due = c.oldest_due;
    }
  }

  const clients = [...byEmail.values()].sort((a, b) => {
    if (a.past_due !== b.past_due) return a.past_due ? -1 : 1;
    return b.total_paid - a.total_paid;
  });

  return NextResponse.json({ configured: true, clients });
}
