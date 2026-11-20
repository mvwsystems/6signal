import { notFound } from "next/navigation";
import { asSystem, getDealByToken, markViewed } from "../../lib/close";
import { dealOf, toCents, usd, ACH_ONLY_OVER_CENTS, type ProposalDoc } from "../../lib/closeCore";
import ClosePage from "./ClosePage";

export const dynamic = "force-dynamic";

// The client's one page: proposal summary, the agreement to sign (DocuSeal,
// embedded), then the deposit (Stripe hosted invoice), then what's next.
// Deliberately outside the marketing shell (no Nav/Footer), like /get pages:
// the client should see their deal and nothing else.
const C = { bg: "#060606", panel: "#0e0e0c", text: "#f5f5f3", sub: "#b9b9b4", muted: "#8a8a86", accent: "#E6FF00", border: "rgba(255,255,255,0.09)" };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await getDealByToken(token);
  if (!d) notFound();
  await asSystem(() => markViewed(d)).catch(() => null);
  const t: ProposalDoc = d.sent_payload ?? d.payload;
  const deal = dealOf(t);
  const first = (d.signer_name ?? deal.signerName).split(" ")[0];
  const deposit = toCents(deal.deposit);
  const row = (a: string, b: string, i: number) => (
    <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "10px 0", borderBottom: `1px solid ${C.border}`, fontSize: 14 }}>
      <span style={{ color: C.sub }}>{a}</span><span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{b}</span>
    </div>
  );
  const schedule: [string, string][] = [
    ["Deposit, due on signing", usd(deposit)],
    ...deal.milestones.map((m): [string, string] => [`${m.label}, when delivered`, usd(toCents(m.amount))]),
    ...(toCents(deal.monthly) > 0 ? [[`${deal.monthlyLabel || "Monthly"}, from go-live`, `${usd(toCents(deal.monthly))}/mo`] as [string, string]] : []),
  ];

  return (
    <main style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 16px 80px" }}>
        <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontWeight: 700, fontSize: 20 }}>6<span style={{ color: C.accent }}>Signal</span></div>
        <div style={{ fontSize: 12, letterSpacing: "0.18em", color: C.muted, marginTop: 4, textTransform: "uppercase" }}>Prepared for {t.businessName}</div>

        <h1 style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 34, lineHeight: 1.1, margin: "36px 0 8px" }}>{t.headline}</h1>
        <p style={{ color: C.sub, margin: 0 }}>{t.subhead}</p>

        <section style={{ background: C.panel, border: `1px solid ${C.border}`, padding: 20, marginTop: 28 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", marginBottom: 6 }}>What you&rsquo;re getting</div>
          {t.sections.map((s, i) => row(s.title, s.totalPrice, i))}
          <div style={{ fontSize: 12, letterSpacing: "0.14em", color: C.muted, textTransform: "uppercase", margin: "22px 0 6px" }}>How it&rsquo;s billed</div>
          {schedule.map(([a, b], i) => row(a, b, i))}
          <p style={{ fontSize: 12, color: C.muted, marginTop: 12 }}>
            Invoices over {usd(ACH_ONLY_OVER_CENTS)} are paid by bank transfer (ACH). The full scope and agreement are in the document below.
          </p>
        </section>

        <ClosePage
          token={token}
          firstName={first}
          initial={{ status: d.status, signed: !!d.signed_at, paid: !!d.paid_at, invoiceUrl: d.deposit_invoice_url }}
          embedSrc={d.docuseal_embed_src}
          email={d.signer_email}
          deposit={usd(deposit)}
          achOnly={deposit > ACH_ONLY_OVER_CENTS}
          provider={t.preparedBy}
        />
      </div>
    </main>
  );
}
