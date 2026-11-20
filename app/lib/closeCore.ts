// Close system — pure pieces shared by the dashboard (client side), the
// server routes and the client-facing /p/[token] page. No Node or network
// imports here, so ProposalsTab can import it too.
//
// The rules Matt chose (2026-11-19):
//   - E-sign through DocuSeal, embedded on the client page.
//   - Bank transfer (ACH) only on invoices over $2,500; card allowed at or below.
//   - Matt's signature is applied automatically the moment the client signs
//     (his Approve tap on "Send for signature" is the authority).
//   - Contracting party is Superhuman LLC (dba 6 Signal, or the infra DBA).

// ─── Proposal document (the payload column) ────────────────────────────────

export interface ProposalItem { label: string; badge: string; included: string; justification: string; price: string }
export interface ProposalSection { number: string; kind: "setup" | "monthly"; title: string; intro: string; items: ProposalItem[]; totalLabel: string; totalNote: string; totalPrice: string }
export interface MarketRow { label: string; range: string }
export interface Milestone { label: string; amount: string }
export interface DealTerms {
  signerName: string;
  signerEmail: string;
  signerTitle: string;
  legalEntity: string;
  deposit: string;          // "$4,875"
  milestones: Milestone[];  // billed after the deposit, each when marked done
  monthly: string;          // "$1,800" — starts at go-live
  monthlyLabel: string;
  /** "retainer": 6-month minimum terms (visibility work). "build": project terms (infrastructure builds). */
  termsKind?: "retainer" | "build";
}
export interface ProposalDoc {
  clientName: string; businessId: string | null; businessName: string;
  preparedBy: string; date: string; docType: string;
  headline: string; subhead: string;
  sections: ProposalSection[];
  marketRate: MarketRow[];
  includeTerms: boolean;
  deal?: DealTerms;
}

export const DEFAULT_LEGAL_ENTITY = "Superhuman LLC dba 6 Signal";
export const blankDeal = (): DealTerms => ({
  signerName: "", signerEmail: "", signerTitle: "", legalEntity: DEFAULT_LEGAL_ENTITY,
  deposit: "", milestones: [], monthly: "", monthlyLabel: "Monthly retainer", termsKind: "retainer",
});
export const dealOf = (doc: ProposalDoc): DealTerms => ({ ...blankDeal(), ...(doc.deal ?? {}) });

// ─── Money ──────────────────────────────────────────────────────────────────

/** "$4,875" / "4875.50" / "$1,800/mo" → cents. Empty or unreadable → 0. */
export function toCents(s: string | null | undefined): number {
  if (!s) return 0;
  const m = String(s).replace(/,/g, "").match(/-?\d+(\.\d{1,2})?/);
  if (!m) return 0;
  return Math.round(parseFloat(m[0]) * 100);
}
export function usd(cents: number): string {
  const whole = cents % 100 === 0;
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
}

/** Matt's rule: invoices over $2,500 are bank transfer only. */
export const ACH_ONLY_OVER_CENTS = 250_000;
export function paymentMethodsFor(cents: number): ("us_bank_account" | "card")[] {
  return cents > ACH_ONLY_OVER_CENTS ? ["us_bank_account"] : ["us_bank_account", "card"];
}

// ─── Status ─────────────────────────────────────────────────────────────────

export const STATUSES = ["draft", "awaiting_approval", "sending", "sent", "viewed", "signed", "invoiced", "paid", "won", "expired", "void"] as const;
export type DealStatus = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<DealStatus, string> = {
  draft: "Draft", awaiting_approval: "Waiting on your approval", sending: "Sending", sent: "Sent", viewed: "Opened",
  signed: "Signed", invoiced: "Deposit invoiced", paid: "Deposit paid", won: "Won", expired: "Expired", void: "Withdrawn",
};
/** States where the proposal content is frozen (a signed or sent version exists). */
export const isLocked = (s: string) => !["draft", "expired", "void"].includes(s);

// ─── Validation before sending ──────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function sendProblems(doc: ProposalDoc): string[] {
  const d = dealOf(doc);
  const out: string[] = [];
  if (!doc.clientName.trim()) out.push("Client name is empty.");
  if (!doc.businessName.trim()) out.push("Business name is empty.");
  if (!doc.sections.length) out.push("Add at least one pricing section.");
  if (!doc.includeTerms) out.push("Turn on the Terms & Conditions pages; the client signs those.");
  if (!d.signerName.trim()) out.push("Signer name is empty.");
  if (!EMAIL_RE.test(d.signerEmail.trim())) out.push("Signer email isn't a valid address.");
  if (!d.legalEntity.trim()) out.push("Legal entity is empty.");
  if (toCents(d.deposit) <= 0) out.push("Set the deposit amount.");
  for (const [i, m] of d.milestones.entries()) {
    if (!m.label.trim() || toCents(m.amount) <= 0) out.push(`Milestone ${i + 1} needs a label and an amount.`);
  }
  return out;
}

// ─── Reminders (run hourly by the close cron) ───────────────────────────────

export type ReminderKind = "nudge_day2" | "nudge_day5" | "flag_day7" | "expire_day14" | "flag_unpaid_day3";
export interface ReminderInput {
  status: string; sent_at: string | null; invoiced_at: string | null; reminders: Record<string, string> | null;
}
const DAY = 86_400_000;
/** Which reminders are due now and haven't fired yet. Pure, so it's testable. */
export function remindersDue(d: ReminderInput, now: Date): ReminderKind[] {
  const done = d.reminders ?? {};
  const out: ReminderKind[] = [];
  const t = now.getTime();
  if ((d.status === "sent" || d.status === "viewed") && d.sent_at) {
    const age = t - new Date(d.sent_at).getTime();
    if (age >= 14 * DAY) { if (!done.expire_day14) out.push("expire_day14"); return out; }
    if (age >= 7 * DAY && !done.flag_day7) out.push("flag_day7");
    if (age >= 5 * DAY && age < 7 * DAY && !done.nudge_day5) out.push("nudge_day5");
    if (age >= 2 * DAY && age < 5 * DAY && !done.nudge_day2) out.push("nudge_day2");
  }
  if (d.status === "invoiced" && d.invoiced_at) {
    if (t - new Date(d.invoiced_at).getTime() >= 3 * DAY && !done.flag_unpaid_day3) out.push("flag_unpaid_day3");
  }
  return out;
}

// ─── Terms (one source for the printed pages and the signed document) ──────

export interface TermsPara { lead: string; text: string }
export interface TermsSection { h: string; paras: TermsPara[] }

export function termsFor(doc: ProposalDoc): TermsSection[] {
  const d = dealOf(doc);
  const provider = d.legalEntity.trim() || DEFAULT_LEGAL_ENTITY;
  const build = d.termsKind === "build";
  const monthly = toCents(d.monthly) > 0;
  const changeRequests: TermsPara = { lead: "Change Requests.", text: "Out-of-scope work requires a written estimate and written approval from Client before proceeding. Requests do not become obligations." };

  // Retainer terms (visibility and ads work): 6-month minimum.
  const retainer: TermsSection[] = [
    { h: "§2 Payment Terms", paras: [
      { lead: "Due on Receipt.", text: "All invoices are due upon receipt, expected within 48 hours of delivery unless an alternative arrangement is confirmed in writing before invoicing. Invoices are issued on the first business day of each month." },
      { lead: "Late Payment.", text: "Invoices unpaid after 7 calendar days are overdue. Provider reserves the right to pause all active services until the balance is settled. Paused time is not refunded or credited." },
      { lead: "Setup Fee.", text: "Any one-time setup fee is due in full prior to work commencement. Work does not begin until cleared." },
      { lead: "Ad Spend — Client-Owned.", text: "All advertising spend (Google Ads, Meta Ads) is owned and funded directly by the Client, billed to Client's payment method. Provider does not handle or advance ad spend funds. Any management fee on ad spend is invoiced separately from the retainer." },
    ] },
    { h: "§3 Term & Cancellation", paras: [
      { lead: "Initial Term.", text: "This Agreement begins on the date of first invoice payment and runs for a minimum of six (6) consecutive months. Canceling before six months does not obligate Provider to refund any fees paid." },
      { lead: "Month-to-Month After Initial Term.", text: "After the six-month initial term, the Agreement converts automatically to month-to-month and continues until terminated by either party per the notice requirements below." },
      { lead: "30-Day Written Notice.", text: "Either party may terminate after the initial term by delivering written notice at least 30 calendar days before the intended termination date. Written notice means a clear, dated email to the other party's primary email address on file — text messages, verbal statements, and social media messages do not qualify. The 30-day clock begins when the email is sent and confirmed received. Retainer fees continue to accrue during the notice period." },
      { lead: "Early Termination.", text: "If Client terminates during the initial six-month term, all remaining months become due immediately as a termination fee. Provider may waive this at sole discretion but is not obligated to do so." },
    ] },
    { h: "§4 Scope of Work", paras: [
      { lead: "What's Included.", text: "The monthly retainer covers the services listed in the proposal above." },
      { lead: "What's Not Included.", text: "Outside scope and quoted separately if requested: new website builds or major redesigns; custom software, dashboard, or automation development; additional ad platforms; reputation management beyond standard review monitoring; social media content creation or community management; print, radio, or broadcast advertising; work for entities outside Client's primary service area." },
      changeRequests,
    ] },
  ];

  // Project terms (infrastructure builds): deposit, milestones, optional monthly support with no minimum.
  const project: TermsSection[] = [
    { h: "§2 Payment Terms", paras: [
      { lead: "Due on Receipt.", text: `All invoices are due upon receipt, expected within 48 hours of delivery unless an alternative arrangement is confirmed in writing before invoicing. The deposit is invoiced on signing. Each milestone is invoiced when it is delivered.${monthly ? " The monthly fee is invoiced monthly from the go-live date." : ""}` },
      { lead: "Late Payment.", text: "Invoices unpaid after 7 calendar days are overdue. Provider reserves the right to pause work until the balance is settled." },
    ] },
    { h: "§3 Term & Cancellation", paras: [
      { lead: "Project Term.", text: "This Agreement begins when the deposit is paid and continues until the deliverables in the proposal are delivered and accepted. Client confirms acceptance of each milestone in writing, or it is accepted 5 business days after delivery if Client raises no specific defect." },
      { lead: "Deposit.", text: "The deposit secures the project schedule and funds the first phase of work. It is non-refundable once work has begun." },
      { lead: "Ending the Project Early.", text: "Either party may end the project with written notice (a clear, dated email to the other party's primary email address on file). Client pays for milestones already delivered plus work completed on the current milestone, pro rata. Provider hands over all completed work on payment." },
      ...(monthly ? [{ lead: "Monthly Fee After Go-Live.", text: "The monthly fee covers hosting, monitoring, maintenance and support of what was built. It runs month-to-month from the go-live date with no minimum term, and either party may end it with 30 calendar days' written notice. Fees continue to accrue during the notice period." }] : []),
    ] },
    { h: "§4 Scope of Work", paras: [
      { lead: "What's Included.", text: "The project covers the deliverables and milestones listed in the proposal above." },
      { lead: "What's Not Included.", text: "Anything not listed in the proposal is outside scope and quoted separately if requested, including work on systems, vendors or entities not named in the proposal." },
      changeRequests,
      { lead: "Ownership.", text: "On full payment of each milestone, Client owns the deliverables built for Client in that milestone. Provider keeps its pre-existing tools, code libraries and know-how, and grants Client a perpetual license to use them as part of the deliverables." },
    ] },
  ];

  return [
    { h: "§1 Parties", paras: [{ lead: "", text: `This Service Agreement ("Agreement") is entered into as of the date signed below, between ${provider} ("Provider"), represented by ${doc.preparedBy}, and ${doc.businessName}, represented by ${d.signerName.trim() || doc.clientName} ("Client"). This Agreement governs the engagement described in the accompanying proposal.` }] },
    ...(build ? project : retainer),
    { h: "§5 General", paras: [
      { lead: "Governing Law.", text: "This Agreement shall be governed by the laws of the State of Texas. Any disputes arising under this Agreement shall be resolved in Tarrant County, TX." },
      { lead: "Entire Agreement.", text: "This document, together with the accompanying proposal, constitutes the entire agreement between the parties and supersedes all prior verbal or written discussions, quotes, or representations regarding scope, pricing, or deliverables." },
      { lead: "Amendments.", text: "Any modifications to this Agreement must be made in writing and signed by both parties to be enforceable." },
      { lead: "Electronic Signatures.", text: "The parties agree to sign this Agreement electronically. An electronic signature has the same effect as a handwritten one." },
    ] },
  ];
}

// ─── The signed document (DocuSeal HTML) ────────────────────────────────────

const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const CLIENT_ROLE = "Client";
export const PROVIDER_ROLE = "Provider";
export const F = {
  clientSignature: "Client Signature", clientTitle: "Client Title", clientDate: "Client Date",
  providerSignature: "Provider Signature", providerDate: "Provider Date",
} as const;

/** Build the agreement DocuSeal renders: proposal, payment schedule, terms, signature blocks. */
export function agreementHtml(doc: ProposalDoc): string {
  const d = dealOf(doc);
  const row = (a: string, b: string) => `<tr><td style="padding:6px 0;border-bottom:1px solid #ddd">${esc(a)}</td><td style="padding:6px 0;border-bottom:1px solid #ddd;text-align:right;font-weight:700">${esc(b)}</td></tr>`;
  const sections = doc.sections.map((s) => `
    <h2 style="font-size:16px;margin:28px 0 8px">${esc(s.number)} · ${esc(s.title)}</h2>
    ${s.intro ? `<p style="background:#efeee9;padding:10px;font-size:12px">${esc(s.intro)}</p>` : ""}
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <tr style="text-align:left;color:#777;font-size:10px;text-transform:uppercase"><th style="padding:4px 0">Line item</th><th>What's included</th><th style="text-align:right">${s.kind === "setup" ? "Fee" : "Monthly"}</th></tr>
      ${s.items.map((it) => `<tr><td style="padding:8px 8px 8px 0;vertical-align:top;font-weight:700;width:28%">${esc(it.label)}</td><td style="padding:8px 8px 8px 0;vertical-align:top">${esc(it.included)}</td><td style="padding:8px 0;vertical-align:top;text-align:right;font-weight:700;white-space:nowrap">${esc(it.price)}</td></tr>`).join("")}
      <tr><td style="padding:10px 0;font-weight:700;border-top:1px solid #111">${esc(s.totalLabel)}</td><td style="padding:10px 0;border-top:1px solid #111;font-style:italic;color:#555">${esc(s.totalNote)}</td><td style="padding:10px 0;border-top:1px solid #111;text-align:right;font-weight:700">${esc(s.totalPrice)}</td></tr>
    </table>`).join("");
  const sched = [
    row("Deposit, due on signing", usd(toCents(d.deposit))),
    ...d.milestones.map((m) => row(`${m.label}, due when delivered`, usd(toCents(m.amount)))),
    ...(toCents(d.monthly) > 0 ? [row(`${d.monthlyLabel || "Monthly"}, billed monthly from go-live`, `${usd(toCents(d.monthly))}/mo`)] : []),
  ].join("");
  const terms = termsFor(doc).map((t) => `<h3 style="font-size:13px;margin:16px 0 6px">${esc(t.h)}</h3>${t.paras.map((p) => `<p style="font-size:11.5px;line-height:1.6;margin:0 0 8px">${p.lead ? `<strong>${esc(p.lead)}</strong> ` : ""}${esc(p.text)}</p>`).join("")}`).join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Helvetica,Arial,sans-serif;color:#1a1a1a">
  <div style="background:#0a0a0a;color:#f5f5f3;padding:20px 24px">
    <div style="font-size:20px;font-weight:700">6 Signal</div>
    <div style="font-size:11px;color:#bbb;margin-top:6px">Prepared for ${esc(doc.clientName)} / ${esc(doc.businessName)} · Prepared by ${esc(doc.preparedBy)} · ${esc(doc.date)}</div>
  </div>
  <h1 style="font-size:24px;margin:24px 0 4px">${esc(doc.headline)}</h1>
  <p style="font-style:italic;color:#555;margin:0">${esc(doc.subhead)}</p>
  ${sections}
  <h2 style="font-size:16px;margin:28px 0 8px">Payment schedule</h2>
  <table style="width:100%;border-collapse:collapse;font-size:12px">${sched}</table>
  <p style="font-size:11px;color:#555">Invoices over ${usd(ACH_ONLY_OVER_CENTS)} are paid by bank transfer (ACH). Smaller invoices can also be paid by card.</p>
  <h2 style="font-size:16px;margin:28px 0 8px">Service Agreement</h2>
  ${terms}
  <h2 style="font-size:16px;margin:28px 0 12px">Signatures</h2>
  <table style="width:100%;font-size:12px"><tr>
    <td style="width:50%;vertical-align:top;padding-right:16px">
      <div style="color:#777;font-size:10px">CLIENT</div>
      <signature-field name="${F.clientSignature}" role="${CLIENT_ROLE}" style="width:220px;height:70px;display:inline-block"></signature-field>
      <div>${esc(d.signerName)} · ${esc(doc.businessName)}</div>
      <div>Title: <text-field name="${F.clientTitle}" role="${CLIENT_ROLE}" style="width:160px;height:18px;display:inline-block"></text-field></div>
      <div>Date: <date-field name="${F.clientDate}" role="${CLIENT_ROLE}" style="width:120px;height:18px;display:inline-block"></date-field></div>
    </td>
    <td style="width:50%;vertical-align:top">
      <div style="color:#777;font-size:10px">PROVIDER</div>
      <signature-field name="${F.providerSignature}" role="${PROVIDER_ROLE}" style="width:220px;height:70px;display:inline-block"></signature-field>
      <div>${esc(doc.preparedBy)} · ${esc(d.legalEntity)}</div>
      <div>Date: <date-field name="${F.providerDate}" role="${PROVIDER_ROLE}" style="width:120px;height:18px;display:inline-block"></date-field></div>
    </td>
  </tr></table>
</body></html>`;
}

/** Stable JSON for fingerprinting the exact version that was sent. */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v as object).sort().map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}
