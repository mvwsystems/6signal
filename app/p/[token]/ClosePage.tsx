"use client";
import { createElement, useCallback, useEffect, useRef, useState } from "react";

// Step 2 and 3 of the client page. Signing happens inside DocuSeal's embedded
// form; its "completed" event only tells the server to go check DocuSeal
// itself. Then the page waits for the deposit invoice and shows the pay button.
interface State { status: string; signed: boolean; paid: boolean; invoiceUrl: string | null }
const C = { panel: "#0e0e0c", text: "#f5f5f3", sub: "#b9b9b4", muted: "#8a8a86", accent: "#E6FF00", border: "rgba(255,255,255,0.09)" };

export default function ClosePage(p: { token: string; firstName: string; initial: State; embedSrc: string | null; email: string | null; deposit: string; achOnly: boolean; provider: string }) {
  const [s, setS] = useState<State>(p.initial);
  const [working, setWorking] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const closed = s.status === "expired" || s.status === "void";

  const poll = useCallback(async (op?: "signed") => {
    const r = await fetch(`/api/close/${p.token}`, op ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op }) } : {});
    if (r.ok) setS(await r.json());
  }, [p.token]);

  // Load DocuSeal's web component once, only while there's something to sign.
  useEffect(() => {
    if (s.signed || closed || !p.embedSrc) return;
    if (!document.querySelector('script[data-docuseal]')) {
      const el = document.createElement("script");
      el.src = "https://cdn.docuseal.com/js/form.js";
      el.dataset.docuseal = "1";
      document.body.appendChild(el);
    }
    const form = host.current?.querySelector("docuseal-form");
    const done = () => setWorking(true); // the polling effect below does the checking
    form?.addEventListener("completed", done);
    return () => form?.removeEventListener("completed", done);
  }, [s.signed, closed, p.embedSrc, poll]);

  // After signing, keep checking until the invoice exists (a few seconds), then until it's paid.
  // One request at a time: the next check is scheduled only after the last one answers.
  useEffect(() => {
    if (!working && !(s.signed && !s.paid)) return;
    let stop = false, timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      // Until the invoice exists, ask the server to check (it verifies with DocuSeal and retries the invoice).
      await poll(s.invoiceUrl ? undefined : "signed").catch(() => null);
      if (!stop) timer = setTimeout(tick, s.invoiceUrl ? 15000 : 4000);
    };
    timer = setTimeout(tick, 1500);
    return () => { stop = true; if (timer) clearTimeout(timer); };
  }, [working, s.signed, s.paid, s.invoiceUrl, poll]);
  useEffect(() => { if (s.signed) setWorking(false); }, [s.signed]);

  const box = (children: React.ReactNode) => <section style={{ background: C.panel, border: `1px solid ${C.border}`, padding: 24, marginTop: 20 }}>{children}</section>;
  const step = (n: string, title: string) => <div style={{ fontSize: 12, letterSpacing: "0.14em", color: C.accent, textTransform: "uppercase", marginBottom: 8 }}>{n} · {title}</div>;

  if (closed) return box(<p style={{ margin: 0, color: C.sub }}>This proposal link is no longer active. Reply to {p.provider}&rsquo;s email and a fresh one will come your way.</p>);

  if (s.paid) return box(<>
    {step("Done", "You're all set")}
    <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>Thank you, {p.firstName}. Your deposit is in.</h2>
    <p style={{ color: C.sub, margin: 0 }}>Check your email for the welcome note: it has the kickoff call link and the short intake form. Your signed agreement was emailed to you when you signed.</p>
  </>);

  if (s.signed) return box(<>
    {step("Step 2 of 2", "Pay the deposit")}
    <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>Signed. One step left: the {p.deposit} deposit.</h2>
    <p style={{ color: C.sub, margin: "0 0 16px" }}>
      {p.achOnly ? "This invoice is paid by bank transfer (ACH)." : "Pay by bank transfer or card."} A copy of the invoice is in your inbox too, for your accounts payable team.
    </p>
    {s.invoiceUrl
      ? <a href={s.invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", background: C.accent, color: "#060606", fontWeight: 700, padding: "12px 22px", textDecoration: "none" }}>Pay the deposit</a>
      : <p style={{ color: C.muted, margin: 0 }}>Preparing your invoice&hellip;</p>}
  </>);

  return box(<>
    {step("Step 1 of 2", "Review and sign")}
    <p style={{ color: C.sub, margin: "0 0 16px" }}>Read the agreement, add your title, and sign at the bottom. {p.provider}&rsquo;s signature is added as soon as you sign.</p>
    {working && <p style={{ color: C.accent }}>Signed. Preparing your deposit invoice&hellip;</p>}
    <div ref={host} style={{ background: "#fff", minHeight: 600 }}>
      {p.embedSrc && createElement("docuseal-form", {
        "data-src": p.embedSrc,
        "data-email": p.email ?? undefined,
        "data-send-copy-email": "true",
        "data-with-download-button": "true",
        "data-with-title": "false",
        "data-completed-message-title": "Signed",
        "data-completed-message-body": "Scroll up: your deposit invoice is ready.",
      })}
    </div>
  </>);
}
