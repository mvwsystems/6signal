import { NextResponse } from "next/server";
import { insertLead } from "../../lib/db";
import { pushToKit, KIT_TAG_MASTER, KIT_TAG_PROFIT_LEAK } from "../../lib/kit";
import { sendEmail, emailShell, heading, paragraph, button, monoLabel } from "../../lib/email";
import { SECTIONS, QUESTION_COUNT, bandFor, scoreAnswers, PDF_URL, PDF_PATH } from "../../profit-leak/audit-data";

// /profit-leak has two paths that share one contact form:
//   download — capture contact, subscribe, send the PDF link
//   audit    — capture contact + 21 yes/no answers, score them, send the
//              visitor their filled-in audit, alert the owner with everything
// Every path persists the lead first; email and Kit are best-effort after.

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Body {
  mode?: string;
  name?: string;
  email?: string;
  company?: string;
  answers?: unknown;
  attribution?: Record<string, unknown> | null;
  website?: string; // honeypot — real forms leave it empty
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const row = (label: string, value: string) =>
  `<tr><td style="padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
    <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.18em;color:#7a7a78;text-transform:uppercase;display:inline-block;width:96px;vertical-align:top;">${label}</span>
    <span style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#f5f5f3;">${value}</span>
  </td></tr>`;

// The filled-in audit, section by section, as a table both emails share.
function answersHtml(answers: boolean[], sectionScores: number[]): string {
  const blocks = SECTIONS.map((s, i) => {
    const qs = s.questions
      .map((q, j) => {
        const yes = answers[i * 3 + j];
        return `<tr><td style="padding:5px 0;">
          <span style="font-family:'Courier New',monospace;font-size:12px;color:${yes ? "#E6FF00" : "#555553"};display:inline-block;width:34px;vertical-align:top;">${yes ? "YES" : "NO"}</span>
          <span style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${yes ? "#f5f5f3" : "#8a8a87"};">${esc(q)}</span>
        </td></tr>`;
      })
      .join("");
    return `<tr><td style="padding:18px 0 4px;">
      <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;color:#E6FF00;text-transform:uppercase;">${s.num} / ${esc(s.leak)}</span>
      <span style="font-family:'Courier New',monospace;font-size:11px;color:#7a7a78;float:right;">${sectionScores[i]} of 3</span>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">${qs}</table>
    </td></tr>`;
  });
  return blocks.join("");
}

function scoreHtml(total: number, label: string, text: string): string {
  return `<tr><td style="padding:8px 0 22px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.1);background:#0e0e0c;">
      <tr><td style="padding:22px 26px;">
        <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;color:#7a7a78;text-transform:uppercase;">Your score</span><br/>
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:44px;font-weight:700;color:#E6FF00;line-height:1.1;">${total}</span>
        <span style="font-family:'Courier New',monospace;font-size:13px;color:#7a7a78;"> / ${QUESTION_COUNT}</span><br/>
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:600;color:#f5f5f3;display:inline-block;margin-top:10px;">${esc(label)}</span><br/>
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#b8b8b5;display:inline-block;margin-top:4px;">${esc(text)}</span>
      </td></tr>
    </table>
  </td></tr>`;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // Honeypot: bots fill every field. Pretend success, do nothing.
  if (body.website) return NextResponse.json({ ok: true, downloadUrl: PDF_PATH });

  const mode = body.mode === "audit" ? "audit" : "download";
  const name = (body.name ?? "").trim().slice(0, 80);
  const email = (body.email ?? "").trim().toLowerCase();
  const company = (body.company ?? "").trim().slice(0, 120);

  if (name.length < 2) return NextResponse.json({ ok: false, error: "Enter your name" }, { status: 400 });
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "Enter a valid email" }, { status: 400 });
  }
  if (company.length < 2) return NextResponse.json({ ok: false, error: "Enter your company name" }, { status: 400 });

  let answers: boolean[] = [];
  let total = 0;
  let sectionScores: number[] = [];
  if (mode === "audit") {
    if (!Array.isArray(body.answers) || body.answers.length !== QUESTION_COUNT) {
      return NextResponse.json({ ok: false, error: "Answer all twenty-one questions" }, { status: 400 });
    }
    answers = body.answers.map(Boolean);
    ({ total, sections: sectionScores } = scoreAnswers(answers));
  }
  const band = bandFor(total);

  // 1. Persist first — this is the record of the lead regardless of what follows.
  await insertLead({
    businessId: null,
    email,
    source: mode === "audit" ? "profit-leak-audit" : "profit-leak-download",
    attribution: body.attribution ?? null,
  });

  // 2. Kit: master list + the profit-leak segment.
  const firstName = name.split(/\s+/)[0];
  await pushToKit({ email, firstName, tagIds: [KIT_TAG_MASTER, KIT_TAG_PROFIT_LEAK] });

  // 3. Email the visitor.
  const visitorInner =
    mode === "audit"
      ? [
          monoLabel("Field Guide No. 01 · your scored audit"),
          heading(`${esc(firstName)}, here is what you filled in.`),
          scoreHtml(total, band.label, band.text),
          paragraph(
            "A low score is not a judgment about how well you build. It is a measurement of how much of your company still lives in one person's head. Pick the two sections where you scored lowest and ignore the rest until those are running without you."
          ),
          answersHtml(answers, sectionScores),
          paragraph("The full guide — the seven leaks, the model, the fixes, and the ninety-day sequence — is attached below."),
          button("Download the Field Guide (PDF)", PDF_URL),
          paragraph(
            `Reply to this email if you want to talk through your two lowest sections. Otherwise, the next thing worth knowing is how visible your company is to the AI search engines now deciding who gets recommended — the <a href="https://6signal.co/visibility-check" style="color:#E6FF00;">AI Visibility Audit</a> is a self-serve report on your numbers for $27.`
          ),
        ].join("")
      : [
          monoLabel("Field Guide No. 01"),
          heading(`${esc(firstName)}, your copy of the Contractor Profit Leak Audit.`),
          paragraph(
            "Seven places general contractors lose money that never show up as a line item, the one question that exposes each of them, and a twenty-one-question scored audit you can work in about fifteen minutes."
          ),
          button("Download the Field Guide (PDF)", PDF_URL),
          paragraph(
            `If you would rather score the audit online and get your result immediately, it is on the same page: <a href="https://6signal.co/profit-leak" style="color:#E6FF00;">6signal.co/profit-leak</a>.`
          ),
        ].join("");

  const visitorSent = await sendEmail({
    to: email,
    replyTo: process.env.LEAD_ALERT_TO || "hello@6signal.co",
    subject:
      mode === "audit"
        ? `Your Profit Leak Audit score: ${total} of ${QUESTION_COUNT}`
        : "Your copy of the Contractor Profit Leak Audit",
    html: emailShell(visitorInner),
  });

  // 4. Alert the owner with everything captured.
  const alertInner = [
    monoLabel(mode === "audit" ? "Profit leak · audit completed" : "Profit leak · PDF download"),
    heading(`${esc(name)} — ${esc(company)}`),
    `<tr><td style="padding-bottom:8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row("Company", esc(company))}
        ${row("Email", `<a href="mailto:${esc(email)}" style="color:#E6FF00;">${esc(email)}</a>`)}
        ${row("Path", mode === "audit" ? "Scored the audit on the page" : "Downloaded the PDF")}
        ${row("Source", esc(String(body.attribution?.source ?? "(direct)")))}
        ${row("Kit", "Tagged 6 SIGNAL + profit-leak")}
      </table>
    </td></tr>`,
    mode === "audit" ? scoreHtml(total, band.label, band.text) : "",
    mode === "audit" ? answersHtml(answers, sectionScores) : "",
    paragraph(`Reply to this email to reach ${esc(firstName)} directly.`),
  ].join("");

  await sendEmail({
    to: process.env.LEAD_ALERT_TO || "hello@6signal.co",
    replyTo: email,
    subject:
      mode === "audit"
        ? `Profit leak audit — ${name} (${company}) scored ${total}/${QUESTION_COUNT}`
        : `Profit leak download — ${name} (${company})`,
    html: emailShell(alertInner),
  });

  return NextResponse.json({
    ok: true,
    downloadUrl: PDF_PATH,
    emailed: visitorSent,
    ...(mode === "audit" ? { score: total, sections: sectionScores, band: { label: band.label, text: band.text } } : {}),
  });
}
