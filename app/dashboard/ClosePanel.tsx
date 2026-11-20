"use client";
import { useCallback, useEffect, useState } from "react";
import { T, BODY, MONO } from "./theme";
import { dealOf, sendProblems, toCents, usd, STATUS_LABEL, isLocked, type DealStatus, type ProposalDoc } from "../lib/closeCore";

// Close system controls inside a proposal: send for signature (through the
// Command Center approval), see where the client is, then bill milestones and
// start the monthly fee. Money-request buttons are Matt-only on the server.

interface View {
  status: DealStatus; link: string | null; doc_hash: string | null;
  sent_at: string | null; viewed_at: string | null; signed_at: string | null; countersigned_at: string | null;
  invoiced_at: string | null; paid_at: string | null; expires_at: string | null; deposit_invoice_url: string | null;
  subscription_id: string | null; milestones_state: Record<string, { claimed_at?: string; done_at?: string; invoice_url?: string; paid_at?: string }>;
  signed_pdf: string | null; sent_differs: boolean; events: { kind: string; created_at: string }[];
}

const btn = (primary?: boolean): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", height: 34, padding: "0 14px", borderRadius: 6, cursor: "pointer", fontFamily: BODY, fontWeight: 500, fontSize: 13,
  border: `1px solid ${primary ? T.brand : T.border}`, background: primary ? T.brand : "transparent", color: primary ? T.onBrand : T.text, whiteSpace: "nowrap",
});
const when = (s: string | null) => (s ? new Date(s).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null);
const EVENT_LABEL: Record<string, string> = {
  send_requested: "Sent to Command Center for approval", sent: "Emailed to the client", viewed: "Client opened it", signed: "Client signed",
  countersigned: "Your signature applied", deposit_invoiced: "Deposit invoice sent", deposit_paid: "Deposit paid", onboarding_started: "Welcome email + kickoff task",
  pdf_stored: "Signed PDF saved", nudge_day2: "Day 2 nudge sent", nudge_day5: "Day 5 nudge sent", flag_day7: "Day 7: flagged for a call",
  expire_day14: "Expired after 14 days", flag_unpaid_day3: "Deposit unpaid 3 days: flagged", milestone_invoiced: "Milestone invoiced",
  milestone_paid: "Milestone paid", monthly_started: "Monthly billing started", withdrawn: "Withdrawn",
};

export default function ClosePanel({ id, doc, onChange, save }: { id: string; doc: ProposalDoc; onChange: () => void; save: () => Promise<boolean> }) {
  const [v, setV] = useState<View | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/dashboard/proposals/${id}/close`);
    const d = await r.json().catch(() => null);
    if (r.ok) setV(d); else setMsg(d?.error ?? "Couldn't load the deal status.");
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const act = async (op: string, extra: Record<string, unknown> = {}, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true); setMsg(null);
    try {
      if (op === "send" && !(await save())) throw new Error("Couldn't save the proposal, so nothing was sent.");
      const r = await fetch(`/api/dashboard/proposals/${id}/close`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op, ...extra }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "Failed");
      if (op === "send") setMsg("Waiting on your approval: open Command Center → Approvals and approve “Send for signature”.");
      if (op === "milestone") setMsg("Milestone invoice sent.");
      if (op === "monthly") setMsg("Monthly billing started.");
      await load(); onChange();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  };

  if (!v) return <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16, fontSize: 13, color: T.muted }}>{msg ?? "Loading deal status…"}</div>;

  const deal = dealOf(doc);
  const problems = sendProblems(doc);
  const canSend = ["draft", "expired", "void", "awaiting_approval"].includes(v.status);
  const unpaid = !v.paid_at && !["draft", "expired", "void", "awaiting_approval"].includes(v.status);
  const tone = v.status === "won" || v.status === "paid" ? T.ok : canSend ? T.muted : T.accent;

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textSub }}>Signing &amp; billing</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: tone, marginTop: 4 }}>{STATUS_LABEL[v.status] ?? v.status}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {canSend && <button style={btn(true)} disabled={busy || problems.length > 0} onClick={() => act("send")}>{v.status === "draft" ? "Send for signature" : v.status === "awaiting_approval" ? "Ask for approval again" : "Send again"}</button>}
          {!canSend && v.status !== "awaiting_approval" && !v.paid_at && <button style={btn()} disabled={busy} onClick={() => act("refresh")}>Check for signature</button>}
          {v.link && <button style={btn()} onClick={() => { navigator.clipboard?.writeText(v.link!); setMsg("Client link copied."); }}>Copy client link</button>}
          {v.signed_pdf && <a style={{ ...btn(), textDecoration: "none" }} href={v.signed_pdf} target="_blank" rel="noopener noreferrer">Signed PDF</a>}
          {unpaid && v.status !== "awaiting_approval" && <button style={{ ...btn(), color: T.danger }} disabled={busy} onClick={() => act("withdraw", {}, "Withdraw this proposal? The client link stops working and any unpaid deposit invoice is voided.")}>Withdraw</button>}
        </div>
      </div>

      {canSend && problems.length > 0 && (
        <ul style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 12, color: T.muted }}>{problems.map((p) => <li key={p}>{p}</li>)}</ul>
      )}
      {v.sent_differs && !canSend && (
        <div style={{ marginTop: 12, fontSize: 12, color: T.danger }}>You&rsquo;ve edited this proposal since it was sent. The client is still seeing (and signing) the version that went out. Withdraw and send again to replace it.</div>
      )}
      {msg && <div style={{ marginTop: 12, fontSize: 13, color: T.textSub }}>{msg}</div>}

      {v.paid_at && (
        <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textSub, marginBottom: 8 }}>Billing after the deposit</div>
          {deal.milestones.length === 0 && toCents(deal.monthly) === 0 && <div style={{ fontSize: 12, color: T.muted }}>Nothing else to bill on this deal.</div>}
          {deal.milestones.map((m, i) => {
            const st = v.milestones_state[String(i)] ?? {};
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                <span>{m.label} · <span style={{ fontFamily: MONO }}>{usd(toCents(m.amount))}</span></span>
                {st.paid_at ? <span style={{ color: T.ok }}>Paid {when(st.paid_at)}</span>
                  : st.invoice_url ? <a href={st.invoice_url} target="_blank" rel="noopener noreferrer" style={{ color: T.accent }}>Invoiced {when(st.done_at ?? null)}</a>
                  : st.claimed_at ? <span style={{ color: T.muted }}>Invoicing…</span>
                  : <button style={btn()} disabled={busy} onClick={() => act("milestone", { idx: i }, `Mark "${m.label}" delivered and email the ${usd(toCents(m.amount))} invoice to ${deal.signerEmail}?`)}>Mark done + invoice</button>}
              </div>
            );
          })}
          {toCents(deal.monthly) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 13 }}>
              <span>{deal.monthlyLabel} · <span style={{ fontFamily: MONO }}>{usd(toCents(deal.monthly))}/mo</span></span>
              {v.subscription_id ? <span style={{ color: T.ok }}>Running</span>
                : <button style={btn()} disabled={busy} onClick={() => act("monthly", {}, `It's go-live: start billing ${usd(toCents(deal.monthly))} a month to ${deal.signerEmail} today?`)}>Start monthly billing</button>}
            </div>
          )}
        </div>
      )}

      {v.events.length > 0 && (
        <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
          {v.events.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSub, padding: "3px 0" }}>
              <span>{EVENT_LABEL[e.kind] ?? e.kind}</span><span style={{ color: T.muted }}>{when(e.created_at)}</span>
            </div>
          ))}
          {v.doc_hash && <div style={{ fontSize: 11, color: T.muted, marginTop: 6, fontFamily: MONO }}>Sent version fingerprint {v.doc_hash.slice(0, 12)}</div>}
          {isLocked(v.status) && v.deposit_invoice_url && !v.paid_at && <a href={v.deposit_invoice_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: T.accent }}>Open the deposit invoice</a>}
        </div>
      )}
    </div>
  );
}
