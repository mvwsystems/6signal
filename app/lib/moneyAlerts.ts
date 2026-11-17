import { db } from "./db";
import { currentActor } from "./actor";
import { CrmError, logActivity } from "./crm";
import { canApprove } from "./commandCenter";

// The alerts strip at the top of Revenue (what was the Money placeholder):
// unpaid and overdue Stripe invoices, failed payments in the last 30 days,
// subscriptions renewing in the next 14 days, and Matt's own bill reminders
// (owner only). Read-only against Stripe: no payment buttons anywhere.

type AnyRec = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

async function stripe(path: string, key: string): Promise<AnyRec | null> {
  try {
    const r = await fetch(`https://api.stripe.com/v1/${path}`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!r.ok) { console.error(`[money-alerts] Stripe ${path} -> ${r.status}`); return null; }
    return (await r.json()) as AnyRec;
  } catch (e) { console.error(`[money-alerts] Stripe ${path} failed:`, e); return null; }
}

export interface Bill { name: string; due_day: number; amount: number | null; note: string | null }
export interface BillDue extends Bill { next_due: string; days: number }

// Next due date for a bill paid on a day of the month (31 → last day).
export function nextDue(dueDay: number, from: Date = new Date()): Date {
  const y = from.getFullYear(), m = from.getMonth();
  const clamp = (yy: number, mm: number) => Math.min(dueDay, new Date(yy, mm + 1, 0).getDate());
  const today = new Date(y, m, from.getDate());
  let d = new Date(y, m, clamp(y, m));
  if (d < today) d = new Date(y, m + 1, clamp(y, m + 1));
  return d;
}

async function readBills(): Promise<Bill[]> {
  const s = db();
  if (!s) return [];
  const { data } = await s.from("settings").select("value").eq("key", "personal_bills").maybeSingle();
  return Array.isArray(data?.value) ? (data!.value as Bill[]) : [];
}

export async function moneyAlerts() {
  const who = currentActor();
  if (!who) throw new CrmError("Not signed in", 401);
  const owner = canApprove(who.role);
  const key = process.env.STRIPE_SECRET_KEY;
  const out: AnyRec = { configured: !!key, unpaid: [], failed: [], renewals: [], bills: null, problems: [] as string[] };
  if (key) {
    const now = Math.floor(Date.now() / 1000);
    const [open, charges, subs] = await Promise.all([
      stripe("invoices?status=open&limit=100&expand[]=data.customer", key),
      stripe(`charges?limit=100&created[gte]=${now - 30 * 86400}`, key),
      stripe("subscriptions?status=active&limit=100&expand[]=data.customer", key),
    ]);
    if (!open) out.problems.push("Couldn't read open invoices from Stripe.");
    if (!charges) out.problems.push("Couldn't read recent payments from Stripe.");
    if (!subs) out.problems.push("Couldn't read subscriptions from Stripe.");
    const who2 = (c: AnyRec | string | null | undefined) => (typeof c === "object" && c ? c.name || c.email || c.id : String(c ?? "Unknown"));
    out.unpaid = ((open?.data as AnyRec[]) ?? []).map((i) => ({
      id: i.id, customer: who2(i.customer), email: typeof i.customer === "object" ? i.customer?.email ?? null : i.customer_email ?? null,
      amount: (i.amount_remaining ?? 0) / 100, due: i.due_date ? new Date(i.due_date * 1000).toISOString() : null,
      overdue: !!(i.due_date && i.due_date < now), number: i.number ?? null,
    })).sort((a: AnyRec, b: AnyRec) => Number(b.overdue) - Number(a.overdue) || String(a.due ?? "").localeCompare(String(b.due ?? "")));
    out.failed = ((charges?.data as AnyRec[]) ?? []).filter((c) => c.status === "failed").map((c) => ({
      id: c.id, customer: c.billing_details?.name || c.billing_details?.email || c.receipt_email || "Unknown", amount: (c.amount ?? 0) / 100,
      when: new Date(c.created * 1000).toISOString(), reason: c.failure_message || c.outcome?.seller_message || null,
    }));
    const soon = now + 14 * 86400;
    out.renewals = ((subs?.data as AnyRec[]) ?? []).map((s) => {
      // Newer Stripe API versions keep the period on each item instead.
      const end = s.current_period_end ?? s.items?.data?.[0]?.current_period_end ?? null;
      const amount = (s.items?.data ?? []).reduce((n: number, it: AnyRec) => n + (it.price?.unit_amount ?? 0) * (it.quantity ?? 1), 0) / 100;
      return { id: s.id, customer: who2(s.customer), amount, renews: end ? new Date(end * 1000).toISOString() : null, end, cancel: !!s.cancel_at_period_end };
    }).filter((s: AnyRec) => s.end && s.end <= soon).sort((a: AnyRec, b: AnyRec) => a.end - b.end).map(({ end: _e, ...r }: AnyRec) => r); // eslint-disable-line @typescript-eslint/no-unused-vars
  }
  if (owner) {
    const today = new Date();
    out.bills = (await readBills()).map((b) => {
      const d = nextDue(b.due_day, today);
      return { ...b, next_due: d.toISOString().slice(0, 10), days: Math.round((d.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000) };
    }).sort((a, b) => a.days - b.days);
  }
  return out;
}

export async function saveBills(input: unknown) {
  const who = currentActor();
  if (!who || !canApprove(who.role)) throw new CrmError("Only Matt can change his bill reminders.", 403);
  if (!Array.isArray(input)) throw new CrmError("bills must be a list", 400);
  const bills: Bill[] = input.slice(0, 40).map((r: AnyRec) => ({
    name: String(r.name ?? "").trim().slice(0, 60), due_day: Math.floor(Number(r.due_day)),
    amount: r.amount === "" || r.amount == null ? null : Math.round(Number(r.amount) * 100) / 100, note: String(r.note ?? "").trim().slice(0, 120) || null,
  }));
  for (const b of bills) {
    if (!b.name) throw new CrmError("Each bill needs a name.", 400);
    if (!(b.due_day >= 1 && b.due_day <= 31)) throw new CrmError(`${b.name}: the due day must be 1 to 31.`, 400);
    if (b.amount != null && !(b.amount >= 0)) throw new CrmError(`${b.name}: the amount isn't a number.`, 400);
  }
  const s = db();
  if (!s) throw new CrmError("Database not configured.", 503);
  const { error } = await s.from("settings").upsert({ key: "personal_bills", value: bills, updated_by: who.name, updated_at: new Date().toISOString() });
  if (error) throw new CrmError(error.message);
  await logActivity({ entityType: "settings", action: "updated", summary: `${who.name} updated their bill reminders (${bills.length})`, service: "Command Center" });
  return { ok: true };
}
