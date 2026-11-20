import crypto from "crypto";
import { db } from "./db";
import { CrmError, logActivity } from "./crm";
import { perform, registerAction, raiseException, createTask } from "./commandCenter";
import { sendAlert } from "./alerts";
import { sendEmail, emailShell, heading, paragraph, button } from "./email";
import { ownerEmails } from "./dashboard-auth";
import { runAs, currentActor } from "./actor";
import {
  type ProposalDoc, type DealStatus, type ReminderKind, dealOf, toCents, usd, paymentMethodsFor, sendProblems,
  agreementHtml, canonical, remindersDue, CLIENT_ROLE, PROVIDER_ROLE, F, STATUS_LABEL,
} from "./closeCore";

// ─────────────────────────────────────────────────────────────────────────────
// Close system (server side). One private link per deal: the client reads the
// proposal, signs it (DocuSeal, embedded) and pays the deposit (Stripe
// invoice) on /p/[token]. When the deposit clears, onboarding kicks off.
//
//   Send for signature → Command Center approval (red: only Matt approves)
//   Approve            → version frozen + fingerprinted, DocuSeal submission,
//                        email with the private link
//   Client signs       → verified against DocuSeal's API (never trusted from
//                        the browser or a webhook body), Matt's signature
//                        applied, deposit invoice created and emailed
//   Invoice paid       → Stripe webhook → Won, CRM updated, welcome email,
//                        kickoff task, alert to Matt
//   Hourly cron        → nudges (day 2, 5), "call them" flag (day 7), expiry
//                        (day 14), unpaid flag (day 3), retries anything a
//                        missed webhook left half done
//
// Env: DOCUSEAL_API_KEY (+ DOCUSEAL_API_URL, default US cloud),
//      STRIPE_CLOSE_KEY (restricted key with WRITE on Customers, Invoices,
//      Invoice items, Products, Prices, Subscriptions — the existing
//      STRIPE_SECRET_KEY is read-only and is left alone),
//      CLOSE_SIGNATURE_IMAGE_URL (optional: a public PNG of Matt's signature;
//      without it a typed-style signature is rendered).
// ─────────────────────────────────────────────────────────────────────────────

const SITE = (process.env.DASHBOARD_ORIGIN?.trim() || process.env.URL?.trim() || "https://6signal.co").replace(/\/+$/, "");
const DOCUSEAL_URL = (process.env.DOCUSEAL_API_URL?.trim() || "https://api.docuseal.com").replace(/\/+$/, "");

export interface Deal {
  id: string; business_id: string | null; client_name: string; payload: ProposalDoc; created_at: string; updated_at: string;
  status: DealStatus; token: string | null; doc_hash: string | null; sent_payload: ProposalDoc | null;
  signer_name: string | null; signer_email: string | null;
  sent_at: string | null; viewed_at: string | null; signed_at: string | null; countersigned_at: string | null;
  invoiced_at: string | null; paid_at: string | null; expires_at: string | null;
  docuseal_submission_id: number | null; docuseal_embed_src: string | null; docuseal_provider_id: number | null;
  signed_pdf_path: string | null; stripe_customer_id: string | null; deposit_invoice_id: string | null; deposit_invoice_url: string | null;
  subscription_id: string | null; onboarding_started_at: string | null;
  milestones_state: Record<string, { claimed_at?: string; done_at?: string; invoice_id?: string; invoice_url?: string; paid_at?: string }>;
  send_nonce: string | null; countersign_lock_at: string | null; invoice_lock_at: string | null;
  reminders: Record<string, string>;
}

function client() {
  const s = db();
  if (!s) throw new CrmError("Database not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).", 503);
  return s;
}
const now = () => new Date().toISOString();
/** Webhooks, the client page and the cron have no signed-in account: they act as the system. */
export const asSystem = <T,>(fn: () => Promise<T>) => runAs({ role: "operator", name: "Close system" }, fn);
export function requireOwner() {
  if (currentActor()?.role !== "owner") throw new CrmError("Only Matt can do this.", 403);
}
const terms = (d: Deal) => d.sent_payload ?? d.payload;

export async function getDeal(id: string): Promise<Deal> {
  const { data, error } = await client().from("proposals").select("*").eq("id", id).maybeSingle();
  if (error) throw new CrmError(error.message);
  if (!data) throw new CrmError("Proposal not found.", 404);
  return data as Deal;
}
export async function getDealByToken(token: string): Promise<Deal | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const s = db();
  if (!s) return null;
  const { data } = await s.from("proposals").select("*").eq("token", token).maybeSingle();
  return (data as Deal) ?? null;
}
async function patch(id: string, fields: Partial<Deal>) {
  const { error } = await client().from("proposals").update({ ...fields, updated_at: now() }).eq("id", id);
  if (error) throw new CrmError(error.message);
}
export async function event(id: string, kind: string, detail: Record<string, unknown> = {}) {
  await client().from("deal_events").insert({ proposal_id: id, kind, detail });
}
export async function events(id: string) {
  const { data } = await client().from("deal_events").select("kind, detail, created_at").eq("proposal_id", id).order("created_at");
  return data ?? [];
}
const label = (d: Deal) => terms(d).businessName || d.client_name || "Client";

// ─── DocuSeal ───────────────────────────────────────────────────────────────

async function docuseal(path: string, init: { method?: string; body?: unknown } = {}) {
  const key = process.env.DOCUSEAL_API_KEY;
  if (!key) throw new CrmError("DOCUSEAL_API_KEY is not set in Netlify.", 503);
  const r = await fetch(`${DOCUSEAL_URL}${path}`, {
    method: init.method ?? "GET",
    headers: { "X-Auth-Token": key, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const text = await r.text();
  if (!r.ok) throw new CrmError(`DocuSeal ${r.status}: ${text.slice(0, 300)}`, 502);
  try { return JSON.parse(text); } catch { return {}; }
}
interface DsSubmitter { id: number; submission_id?: number; role: string; status: string; embed_src?: string; slug?: string; completed_at?: string | null; opened_at?: string | null }
const embedSrc = (s: DsSubmitter) => s.embed_src || (s.slug ? `https://docuseal.com/s/${s.slug}` : null);

/** Another caller is mid-way through the same step; not an error worth an alert. */
class BusyError extends Error { constructor() { super("busy"); } }

/** A short lease on one step, so the page, the webhook and the cron never run it at the same time. */
async function lease(id: string, col: "countersign_lock_at" | "invoice_lock_at"): Promise<boolean> {
  const stale = new Date(Date.now() - 120_000).toISOString();
  const { data, error } = await client().from("proposals").update({ [col]: now() }).eq("id", id)
    .or(`${col}.is.null,${col}.lt."${stale}"`).select("id").maybeSingle();
  if (error) throw new CrmError(error.message);
  return !!data;
}

// ─── Stripe (write key, form-encoded, idempotent) ───────────────────────────

function form(obj: Record<string, unknown>, prefix = "", out: string[] = []): string[] {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === "object" ? form(x as Record<string, unknown>, `${key}[${i}]`, out) : out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(x))}`)));
    else if (typeof v === "object") form(v as Record<string, unknown>, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}
async function stripe(path: string, body?: Record<string, unknown>, idem?: string) {
  const key = process.env.STRIPE_CLOSE_KEY;
  if (!key) throw new CrmError("STRIPE_CLOSE_KEY is not set in Netlify (a restricted Stripe key with write access to invoices).", 503);
  const r = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded", ...(idem ? { "Idempotency-Key": idem } : {}) },
    body: body ? form(body).join("&") : undefined,
    cache: "no-store",
  });
  const json = await r.json().catch(() => ({}));
  if (r.status === 409) throw new BusyError(); // same idempotent request still running elsewhere: try again later
  if (!r.ok) throw new CrmError(`Stripe ${r.status}: ${json?.error?.message ?? "request failed"}`, 502);
  return json;
}

async function ensureCustomer(d: Deal): Promise<string> {
  if (d.stripe_customer_id) return d.stripe_customer_id;
  const t = terms(d);
  const c = await stripe("customers", {
    email: d.signer_email, name: t.businessName,
    metadata: { proposal_id: d.id, contact: d.signer_name ?? "" },
  }, `close-customer-${d.id}-${d.send_nonce}`);
  await patch(d.id, { stripe_customer_id: c.id });
  return c.id;
}

/** One invoice: created, item attached, finalized, emailed by Stripe. */
async function invoice(d: Deal, kind: "deposit" | "milestone", cents: number, description: string, idx?: number) {
  const customer = await ensureCustomer(d);
  const v = d.send_nonce ?? "0"; // every send gets fresh keys, so a re-send never replays a voided invoice
  const tag = kind === "deposit" ? `deposit-${d.id}-${v}` : `milestone-${d.id}-${idx}-${v}`;
  const inv = await stripe("invoices", {
    customer, collection_method: "send_invoice", days_until_due: 2, auto_advance: true,
    pending_invoice_items_behavior: "exclude",
    description: `${label(d)} · ${description}`,
    payment_settings: { payment_method_types: paymentMethodsFor(cents) },
    metadata: { proposal_id: d.id, kind, ...(idx !== undefined ? { milestone: String(idx) } : {}) },
  }, `close-inv-${tag}`);
  await stripe("invoiceitems", { customer, invoice: inv.id, amount: cents, currency: "usd", description }, `close-item-${tag}`);
  const fin = await stripe(`invoices/${inv.id}/finalize`, {}, `close-fin-${tag}`);
  await stripe(`invoices/${inv.id}/send`, {}, `close-send-${tag}`).catch(() => null); // Stripe emails it; the page links it anyway
  return { id: fin.id as string, url: fin.hosted_invoice_url as string };
}

// ─── 1. Send for signature (through the approval gate) ─────────────────────

export async function requestSend(id: string) {
  const d = await getDeal(id);
  if (!["draft", "expired", "void", "awaiting_approval"].includes(d.status)) throw new CrmError(`This proposal is already ${STATUS_LABEL[d.status].toLowerCase()}.`, 409);
  const problems = sendProblems(d.payload);
  if (problems.length) throw new CrmError(problems.join(" "), 400);
  const t = d.payload, deal = dealOf(t);
  const hash = crypto.createHash("sha256").update(canonical(t)).digest("hex");
  const res = await perform("close.send", { proposalId: id, hash }, {
    title: `Send for signature: ${t.businessName}`,
    summary: `Send ${t.businessName}'s proposal to ${deal.signerName} <${deal.signerEmail}>. Deposit ${usd(toCents(deal.deposit))}${deal.milestones.length ? `, ${deal.milestones.length} milestone invoice(s)` : ""}${toCents(deal.monthly) ? `, ${usd(toCents(deal.monthly))}/mo from go-live` : ""}.`,
    recommendation: "Approving sends the client their private link. Your signature goes on automatically when they sign.",
    detail: `Contracting party: ${deal.legalEntity}. Version ${hash.slice(0, 12)}: if the proposal is edited before you approve, this approval won't send.`,
    sourceUrl: `${SITE}/dashboard`,
  });
  await patch(id, { status: "awaiting_approval" });
  await event(id, "send_requested", {});
  return res;
}

async function runSend(args: Record<string, unknown>): Promise<string> {
  const id = String(args.proposalId ?? "");
  // The claim: of several approvals for one proposal, only one can send.
  const { data: claimed, error: cErr } = await client().from("proposals").update({ status: "sending", updated_at: now() })
    .eq("id", id).eq("status", "awaiting_approval").select("*").maybeSingle();
  if (cErr) throw new Error(cErr.message);
  if (!claimed) { const cur = await getDeal(id).catch(() => null); throw new Error(`Not sent: the proposal is now "${cur ? STATUS_LABEL[cur.status] : "missing"}".`); }
  const d = claimed as Deal;
  const t = d.payload, deal = dealOf(t);
  const hash = crypto.createHash("sha256").update(canonical(t)).digest("hex");
  if (args.hash && args.hash !== hash) { await patch(id, { status: "draft" }); throw new Error("Not sent: the proposal changed after this approval was filed. Send it for signature again."); }
  const problems = sendProblems(t);
  if (problems.length) { await patch(id, { status: "draft" }); throw new Error(problems.join(" ")); }

  const expires = new Date(Date.now() + 14 * 86_400_000).toISOString();
  const provider = ownerEmails()[0];
  let sub: unknown;
  try {
    sub = await docuseal("/submissions/html", {
      method: "POST",
      body: {
        name: `${t.businessName} · ${t.docType || "Agreement"} · ${hash.slice(0, 8)}`,
        send_email: false, order: "preserved", expire_at: expires,
        documents: [{ name: `${t.businessName} agreement`, html: agreementHtml(t), size: "Letter" }],
        submitters: [
          { role: CLIENT_ROLE, email: deal.signerEmail.trim(), name: deal.signerName.trim(), external_id: id, send_email: false },
          { role: PROVIDER_ROLE, email: provider, name: t.preparedBy, external_id: `${id}:provider`, send_email: false },
        ],
      },
    });
  } catch (e) {
    await patch(id, { status: "draft" });
    throw e;
  }
  const subs: DsSubmitter[] = Array.isArray(sub) ? sub : ((sub as { submitters?: DsSubmitter[] }).submitters ?? []);
  const c = subs.find((s) => s.role === CLIENT_ROLE), p = subs.find((s) => s.role === PROVIDER_ROLE);
  const submissionId = (sub as { id?: number }).id ?? c?.submission_id ?? null;
  if (!c || !p || !submissionId || !embedSrc(c)) { await patch(id, { status: "draft" }); throw new Error("DocuSeal answered without the signer links; nothing was sent."); }

  const token = crypto.randomBytes(24).toString("base64url");
  await patch(id, {
    status: "sent", token, doc_hash: hash, sent_payload: t, signer_name: deal.signerName.trim(), signer_email: deal.signerEmail.trim().toLowerCase(),
    sent_at: now(), viewed_at: null, signed_at: null, countersigned_at: null, expires_at: expires, reminders: {},
    invoiced_at: null, deposit_invoice_id: null, deposit_invoice_url: null, signed_pdf_path: null,
    stripe_customer_id: null, send_nonce: String(Date.now()), countersign_lock_at: null, invoice_lock_at: null,
    docuseal_submission_id: submissionId, docuseal_embed_src: embedSrc(c), docuseal_provider_id: p.id,
  });
  const link = `${SITE}/p/${token}`;
  const sent = await sendEmail({
    to: deal.signerEmail.trim(),
    replyTo: provider,
    subject: `Your proposal from 6 Signal: ${t.headline || t.businessName}`,
    html: emailShell(
      heading(`${deal.signerName.split(" ")[0] || "Hi"}, your proposal is ready.`) +
      paragraph(`Everything is on one page: the scope, the price, the agreement and the deposit. You can review it, sign it and pay the ${usd(toCents(deal.deposit))} deposit in one sitting.`) +
      button("Review and sign", link) +
      paragraph(`The link is private to you and stays open for 14 days. Questions? Just reply to this email.`) +
      paragraph(`— ${t.preparedBy}`)
    ),
  });
  await event(id, "sent", { hash, email_sent: sent, submission_id: submissionId });
  await markProspect(deal.signerEmail, { deal_stage: "Proposal Out" });
  await logActivity({ entityType: "proposal", entityId: id, action: "sent", summary: `Sent ${t.businessName}'s proposal to ${deal.signerEmail} for signature`, client: t.businessName, service: "Sales & proposals" });
  return sent ? `Sent to ${deal.signerEmail}. Private link: ${link}` : `Ready, but the email didn't go out (check RESEND_API_KEY). Send this link yourself: ${link}`;
}
registerAction("close.send", { tier: "red", label: "Send a proposal for signature", run: runSend });

export async function noteSendKilled(itemId: string) {
  const s = client();
  const { data } = await s.from("items").select("payload").eq("id", itemId).maybeSingle();
  const pid = (data?.payload as { action?: string; args?: { proposalId?: string } } | undefined);
  if (pid?.action !== "close.send" || !pid.args?.proposalId) return;
  await s.from("proposals").update({ status: "draft", updated_at: now() }).eq("id", pid.args.proposalId).eq("status", "awaiting_approval");
}

// ─── 2. Client opens, signs ─────────────────────────────────────────────────

export async function markViewed(d: Deal) {
  if (d.viewed_at || d.status !== "sent") return;
  await client().from("proposals").update({ status: "viewed", viewed_at: now() }).eq("id", d.id).eq("status", "sent");
  await event(d.id, "viewed", {});
  await logActivity({ entityType: "proposal", entityId: d.id, action: "viewed", summary: `${label(d)} opened their proposal`, client: label(d), service: "Sales & proposals" }).catch(() => null);
}

/** Checks DocuSeal itself; only a completed client submitter counts. Safe to call repeatedly. */
export async function syncSigned(d: Deal): Promise<Deal> {
  if (!d.docuseal_submission_id || !["sent", "viewed", "signed", "invoiced"].includes(d.status)) return d;
  if (!d.signed_at) {
    const sub = await docuseal(`/submissions/${d.docuseal_submission_id}`);
    const c = (sub.submitters as DsSubmitter[] | undefined)?.find((s) => s.role === CLIENT_ROLE);
    if (!c || c.status !== "completed") return d;
    // The claim: only one caller (page, webhook or cron) moves it to signed.
    const { data: won } = await client().from("proposals").update({ status: "signed", signed_at: c.completed_at ?? now(), updated_at: now() })
      .eq("id", d.id).is("signed_at", null).in("status", ["sent", "viewed"]).select("id").maybeSingle();
    if (won) {
      await event(d.id, "signed", { at: c.completed_at });
      await logActivity({ entityType: "proposal", entityId: d.id, action: "signed", summary: `${label(d)} signed their agreement`, client: label(d), service: "Sales & proposals" }).catch(() => null);
      await sendAlert({ title: `Signed: ${label(d)}`, message: `${d.signer_name} signed. Deposit invoice is going out now.`, severity: "low", link: `${SITE}/dashboard` });
    }
    d = await getDeal(d.id);
  }
  if (d.signed_at && !d.countersigned_at && await lease(d.id, "countersign_lock_at")) await countersign(d).catch(async (e) => {
    await raiseException({ title: `Countersign failed: ${label(d)}`, detail: `${e instanceof Error ? e.message : e}. Sign it in DocuSeal by hand; billing is not blocked.`, sourceId: `close-countersign-${d.id}`, severity: "medium" });
  });
  d = await getDeal(d.id);
  if (d.signed_at && !d.deposit_invoice_id && ["signed", "invoiced"].includes(d.status) && await lease(d.id, "invoice_lock_at")) {
    try {
      const deal = dealOf(terms(d));
      const inv = await invoice(d, "deposit", toCents(deal.deposit), "Deposit");
      await client().from("proposals").update({ status: "invoiced", invoiced_at: now(), deposit_invoice_id: inv.id, deposit_invoice_url: inv.url, updated_at: now() })
        .eq("id", d.id).is("deposit_invoice_id", null);
      await event(d.id, "deposit_invoiced", { invoice: inv.id, amount: toCents(deal.deposit) });
    } catch (e) {
      await client().from("proposals").update({ invoice_lock_at: null }).eq("id", d.id);
      if (!(e instanceof BusyError)) await raiseException({ title: `Deposit invoice failed: ${label(d)}`, detail: `${e instanceof Error ? e.message : e}. It retries hourly.`, sourceId: `close-invoice-${d.id}`, severity: "high", immediate: true });
    }
    d = await getDeal(d.id);
  }
  return d;
}

async function countersign(d: Deal) {
  if (!d.docuseal_provider_id) throw new Error("No provider signer on file.");
  const sub = await docuseal(`/submissions/${d.docuseal_submission_id}`);
  const already = (sub.submitters as DsSubmitter[] | undefined)?.find((s) => s.id === d.docuseal_provider_id)?.status === "completed";
  if (already) { await patch(d.id, { countersigned_at: now() }); return; }
  const sig = process.env.CLOSE_SIGNATURE_IMAGE_URL?.trim() || `${SITE}/api/close/signature.png`;
  await docuseal(`/submitters/${d.docuseal_provider_id}`, {
    method: "PUT",
    body: {
      completed: true, send_email: false,
      fields: [
        { name: F.providerSignature, default_value: sig },
        { name: F.providerDate, default_value: new Date().toISOString().slice(0, 10) },
      ],
    },
  });
  await patch(d.id, { countersigned_at: now() });
  await event(d.id, "countersigned", {});
}

/** Fully signed PDF (with DocuSeal's audit log) copied into private storage. */
export async function storeSignedPdf(d: Deal) {
  if (d.signed_pdf_path || !d.countersigned_at || !d.docuseal_submission_id) return;
  const sub = await docuseal(`/submissions/${d.docuseal_submission_id}`);
  if (sub.status !== "completed") return;
  const url: string | undefined = sub.combined_document_url || sub.documents?.[0]?.url;
  if (!url) return;
  const r = await fetch(url);
  if (!r.ok) return;
  const path = `${d.id}/signed-${Date.now()}.pdf`;
  const { error } = await client().storage.from("contracts").upload(path, Buffer.from(await r.arrayBuffer()), { contentType: "application/pdf", upsert: false });
  if (error) throw new CrmError(error.message);
  await patch(d.id, { signed_pdf_path: path });
  await event(d.id, "pdf_stored", {});
}
export async function signedPdfUrl(d: Deal): Promise<string | null> {
  if (!d.signed_pdf_path) return null;
  const { data } = await client().storage.from("contracts").createSignedUrl(d.signed_pdf_path, 600);
  return data?.signedUrl ?? null;
}

// ─── 3. Paid → onboarding ───────────────────────────────────────────────────

/** Called by the Stripe webhook for invoice.paid. Ignores invoices this system didn't create. */
export async function onInvoicePaid(inv: { id: string; metadata?: Record<string, string>; amount_paid?: number }) {
  const pid = inv.metadata?.proposal_id;
  if (!pid) return { handled: false };
  // A database error throws (the webhook answers 500 and Stripe retries); only a missing deal is ignored.
  const d = await getDeal(pid).catch((e) => { if (e instanceof CrmError && e.status === 404) return null; throw e; });
  if (!d) return { handled: false };
  if (inv.metadata?.kind === "deposit") {
    if (d.deposit_invoice_id && d.deposit_invoice_id !== inv.id) return { handled: false }; // an older, withdrawn send
    const { data: won, error } = await client().from("proposals").update({ status: "paid", paid_at: now(), updated_at: now() }).eq("id", d.id).is("paid_at", null).select("id").maybeSingle();
    if (error) throw new CrmError(error.message);
    if (won) await event(d.id, "deposit_paid", { invoice: inv.id, amount: inv.amount_paid });
    await startOnboarding(await getDeal(d.id)); // has its own claim; a retry finishes what a crash left
    return { handled: true };
  }
  if (inv.metadata?.kind === "milestone") {
    const idx = Number(inv.metadata.milestone);
    const { error } = await client().rpc("close_ms_patch", { p_id: d.id, p_idx: idx, p_patch: { paid_at: now() } });
    if (error) throw new CrmError(error.message);
    await event(d.id, "milestone_paid", { idx, invoice: inv.id, amount: inv.amount_paid });
    await sendAlert({ title: `Paid: ${label(d)} milestone ${idx + 1}`, message: usd(inv.amount_paid ?? 0), severity: "low" });
    return { handled: true };
  }
  return { handled: false };
}

async function startOnboarding(d: Deal) {
  if (!d.paid_at || d.onboarding_started_at) return;
  const { data: claim, error } = await client().from("proposals").update({ onboarding_started_at: now(), status: "won", updated_at: now() }).eq("id", d.id).is("onboarding_started_at", null).select("id").maybeSingle();
  if (error) throw new CrmError(error.message);
  if (!claim) return;
  const t = terms(d), deal = dealOf(t);
  const cfg = await closeSettings();
  const first = (d.signer_name ?? "").split(" ")[0] || "Hi";
  const steps = [
    cfg.intakeUrl ? `Fill in the short intake form so I have your logins, contacts and goals before we start: ${cfg.intakeUrl}` : null,
    `Pick a time for our kickoff call: ${cfg.kickoffUrl}`,
  ].filter(Boolean) as string[];
  const sent = await sendEmail({
    to: d.signer_email!, replyTo: ownerEmails()[0],
    subject: `Welcome aboard, ${t.businessName}`,
    html: emailShell(
      heading(`${first}, your deposit is in. We're underway.`) +
      paragraph(`Thank you. Your signed agreement is on file and your deposit of ${usd(toCents(deal.deposit))} has cleared.`) +
      paragraph(`Two things get us moving:`) +
      steps.map((s, i) => paragraph(`${i + 1}. ${s}`)).join("") +
      (cfg.intakeUrl ? button("Start the intake form", cfg.intakeUrl) : button("Book the kickoff call", cfg.kickoffUrl)) +
      paragraph(`— ${t.preparedBy}`)
    ),
  });
  await createTask({ title: `Kickoff: ${t.businessName}`, detail: `Deposit paid ${usd(toCents(deal.deposit))}. Welcome email ${sent ? "sent" : "NOT sent (check Resend)"} to ${d.signer_email}. Hold the kickoff call and start delivery.`, due_at: new Date(Date.now() + 2 * 86_400_000).toISOString(), owner: "matt" }).catch(() => null);
  await markProspect(d.signer_email ?? "", { status: "Customer", deal_stage: "Closed Won" });
  await event(d.id, "onboarding_started", { welcome_email: sent });
  await logActivity({ entityType: "proposal", entityId: d.id, action: "won", summary: `${t.businessName} paid the deposit. Won; onboarding started.`, client: t.businessName, service: "Sales & proposals" }).catch(() => null);
  await sendAlert({ title: `Deposit paid: ${t.businessName}`, message: `${usd(toCents(deal.deposit))} cleared. Welcome email ${sent ? "sent" : "failed"}; kickoff task is in Command Center.`, severity: "low", link: `${SITE}/dashboard` });
}

async function closeSettings(): Promise<{ kickoffUrl: string; intakeUrl: string | null }> {
  const { data } = await client().from("settings").select("value").eq("key", "close").maybeSingle();
  const v = (data?.value ?? {}) as { kickoffUrl?: string; intakeUrl?: string };
  return { kickoffUrl: v.kickoffUrl || `${SITE}/book`, intakeUrl: v.intakeUrl || null };
}

async function markProspect(email: string, fields: Record<string, string>) {
  const e = email.trim().toLowerCase();
  if (!e) return;
  // Escape LIKE wildcards so "a_b@x.com" can't match "axb@x.com".
  await client().from("crm_prospects").update(fields).ilike("email", e.replace(/[\\%_]/g, "\\$&")).then(() => null, () => null);
}

// ─── 4. After the deposit: milestones, monthly, withdraw ───────────────────

export async function milestoneDone(id: string, idx: number) {
  const d = await getDeal(id);
  if (!d.paid_at) throw new CrmError("Milestones bill after the deposit is paid.", 409);
  const m = dealOf(terms(d)).milestones[idx];
  if (!m) throw new CrmError("No such milestone.", 404);
  // Atomic claim on this one milestone: a double tap or a second tab can't bill it twice.
  const { data: ok, error } = await client().rpc("close_ms_claim", { p_id: id, p_idx: idx });
  if (error) throw new CrmError(error.message);
  if (!ok) throw new CrmError("That milestone is already invoiced (or being invoiced).", 409);
  try {
    const inv = await invoice(d, "milestone", toCents(m.amount), m.label, idx);
    await client().rpc("close_ms_patch", { p_id: id, p_idx: idx, p_patch: { done_at: now(), invoice_id: inv.id, invoice_url: inv.url } });
    await event(id, "milestone_invoiced", { idx, invoice: inv.id, amount: toCents(m.amount) });
    return { invoice: inv.id, url: inv.url };
  } catch (e) {
    await client().rpc("close_ms_release", { p_id: id, p_idx: idx });
    throw e;
  }
}

export async function startMonthly(id: string) {
  const d = await getDeal(id);
  if (!d.paid_at) throw new CrmError("Monthly billing starts after the deposit is paid.", 409);
  if (d.subscription_id) throw new CrmError("Monthly billing is already running.", 409);
  const deal = dealOf(terms(d));
  const cents = toCents(deal.monthly);
  if (cents <= 0) throw new CrmError("This deal has no monthly fee.", 400);
  const customer = await ensureCustomer(d);
  const product = await stripe("products", { name: `${label(d)} · ${deal.monthlyLabel || "Monthly"}`, metadata: { proposal_id: d.id } }, `close-prod-${d.id}`);
  const sub = await stripe("subscriptions", {
    customer, collection_method: "send_invoice", days_until_due: 7,
    items: [{ price_data: { currency: "usd", product: product.id, unit_amount: cents, recurring: { interval: "month" } } }],
    payment_settings: { payment_method_types: paymentMethodsFor(cents) },
    metadata: { proposal_id: d.id, kind: "monthly" },
  }, `close-sub-${d.id}`);
  await patch(id, { subscription_id: sub.id });
  await event(id, "monthly_started", { subscription: sub.id, amount: cents });
  return { subscription: sub.id };
}

export async function withdraw(id: string) {
  const d = await getDeal(id);
  if (d.paid_at) throw new CrmError("Paid deals can't be withdrawn here.", 409);
  if (d.docuseal_submission_id && !d.signed_at) await docuseal(`/submissions/${d.docuseal_submission_id}`, { method: "DELETE" }).catch(() => null);
  if (d.deposit_invoice_id) await stripe(`invoices/${d.deposit_invoice_id}/void`, {}, `close-void-${d.deposit_invoice_id}`).catch(() => null);
  await patch(id, { status: "void", token: null });
  await event(id, "withdrawn", {});
  return { ok: true };
}

// ─── 5. Hourly: reminders and retries ───────────────────────────────────────

export async function closeCron() {
  const s = client();
  const [live, tail] = await Promise.all([
    s.from("proposals").select("*").in("status", ["sent", "viewed", "signed", "invoiced", "paid"]).order("updated_at", { ascending: false }).limit(200),
    // Won deals whose signed PDF hasn't been copied yet.
    s.from("proposals").select("*").eq("status", "won").is("signed_pdf_path", null).not("countersigned_at", "is", null).limit(50),
  ]);
  const data = [...(live.data ?? []), ...(tail.data ?? [])];
  const done: string[] = [];
  for (const raw of (data ?? []) as Deal[]) {
    let d = raw;
    try {
      if (["sent", "viewed", "signed"].includes(d.status) || (d.signed_at && !d.countersigned_at)) d = await syncSigned(d); // catches a missed webhook
      if (d.paid_at && !d.onboarding_started_at) await startOnboarding(d); // a webhook that died half way
      if (d.countersigned_at && !d.signed_pdf_path) await storeSignedPdf(d).catch(() => null);
      for (const k of remindersDue(d, new Date())) {
        await remind(d, k);
        d.reminders = { ...(d.reminders ?? {}), [k]: now() };
        await patch(d.id, { reminders: d.reminders });
        done.push(`${label(d)}: ${k}`);
      }
    } catch (e) {
      console.error("[close-cron]", d.id, e);
    }
  }
  return { checked: data.length, actions: done };
}

async function remind(d: Deal, k: ReminderKind) {
  const t = terms(d), link = `${SITE}/p/${d.token}`, first = (d.signer_name ?? "").split(" ")[0] || "Hi";
  if (k === "nudge_day2" || k === "nudge_day5") {
    const sent = await sendEmail({
      to: d.signer_email!, replyTo: ownerEmails()[0],
      subject: k === "nudge_day2" ? `Your 6 Signal proposal` : `Still a fit, ${first}?`,
      html: emailShell(
        paragraph(k === "nudge_day2"
          ? `${first}, a quick nudge in case this got buried. Your proposal is ready to review and sign whenever you are.`
          : `${first}, checking in on the proposal for ${t.businessName}. If anything in it needs to change, reply and tell me; it's easier to adjust now than later.`) +
        button("Open the proposal", link) + paragraph(`— ${t.preparedBy}`)
      ),
    });
    await event(d.id, k, { email_sent: sent });
  } else if (k === "flag_day7") {
    await raiseException({ title: `Call ${d.signer_name}: ${t.businessName} hasn't signed`, detail: `Sent 7 days ago${d.viewed_at ? ", opened" : ", not opened yet"}. The link expires in 7 days.`, sourceId: `close-day7-${d.id}`, severity: "medium" });
    await event(d.id, k, {});
  } else if (k === "expire_day14") {
    if (d.docuseal_submission_id) await docuseal(`/submissions/${d.docuseal_submission_id}`, { method: "DELETE" }).catch(() => null);
    await patch(d.id, { status: "expired", token: null });
    await event(d.id, k, {});
    await sendAlert({ title: `Expired: ${t.businessName}`, message: `The proposal link expired unsigned. Re-send from the Proposals tab if it's still alive.`, severity: "low" });
  } else if (k === "flag_unpaid_day3") {
    await raiseException({ title: `Deposit unpaid: ${t.businessName}`, detail: `Signed ${d.signed_at?.slice(0, 10)}, invoiced 3 days ago. Stripe is sending its own reminders.`, sourceId: `close-unpaid-${d.id}`, severity: "medium" });
    await event(d.id, k, {});
  }
}

/** What the dashboard shows for one deal. */
export async function dealView(id: string) {
  const d = await getDeal(id);
  return {
    status: d.status, token: d.token, link: d.token ? `${SITE}/p/${d.token}` : null, doc_hash: d.doc_hash,
    sent_at: d.sent_at, viewed_at: d.viewed_at, signed_at: d.signed_at, countersigned_at: d.countersigned_at,
    invoiced_at: d.invoiced_at, paid_at: d.paid_at, expires_at: d.expires_at, deposit_invoice_url: d.deposit_invoice_url,
    subscription_id: d.subscription_id, milestones_state: d.milestones_state ?? {}, signed_pdf: await signedPdfUrl(d),
    sent_differs: !!d.sent_payload && canonical(d.sent_payload) !== canonical(d.payload),
    events: await events(id),
  };
}
