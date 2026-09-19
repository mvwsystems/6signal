import { NextResponse } from "next/server";
import { insertLead } from "../../lib/db";
import { pushToKit, KIT_TAG_MASTER } from "../../lib/kit";
import { sendEmail, emailShell, heading, paragraph, button, monoLabel } from "../../lib/email";
import { LEVER_QUESTIONS, LEVER_COUNT, leverBandFor, scoreLevers } from "../../lib/levers-quiz-data";

// The ten-levers audit embedded in the MIT post. Same shape as /profit-leak:
// persist the lead first, then Kit, then two best-effort emails — the reader's
// scored answers, and the owner alert with everything captured.

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POST_URL = "https://6signal.co/research/mit-10-levers-generative-ai-contractors";

interface Body {
  name?: string;
  email?: string;
  answers?: unknown;
  attribution?: Record<string, unknown> | null;
  website?: string; // honeypot
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

const row = (label: string, value: string) =>
  `<tr><td style="padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
    <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.18em;color:#7a7a78;text-transform:uppercase;display:inline-block;width:96px;vertical-align:top;">${label}</span>
    <span style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#f5f5f3;">${value}</span>
  </td></tr>`;

function answersHtml(answers: boolean[]): string {
  const items = LEVER_QUESTIONS.map((q, i) => {
    const yes = answers[i];
    return `<tr><td style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
      <span style="font-family:'Courier New',monospace;font-size:12px;color:${yes ? "#E6FF00" : "#555553"};display:inline-block;width:34px;vertical-align:top;">${yes ? "YES" : "NO"}</span>
      <span style="font-family:'Courier New',monospace;font-size:11px;color:#7a7a78;display:inline-block;width:150px;vertical-align:top;">${q.num} ${esc(q.lever)}</span>
      <span style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${yes ? "#f5f5f3" : "#8a8a87"};display:inline-block;max-width:320px;">${esc(q.question)}</span>
    </td></tr>`;
  });
  return `<tr><td style="padding:6px 0 14px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items.join("")}</table></td></tr>`;
}

function scoreHtml(total: number, label: string, text: string): string {
  return `<tr><td style="padding:8px 0 22px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.1);background:#0e0e0c;">
      <tr><td style="padding:22px 26px;">
        <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;color:#7a7a78;text-transform:uppercase;">Your score</span><br/>
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:44px;font-weight:700;color:#E6FF00;line-height:1.1;">${total}</span>
        <span style="font-family:'Courier New',monospace;font-size:13px;color:#7a7a78;"> / ${LEVER_COUNT}</span><br/>
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
  if (body.website) return NextResponse.json({ ok: true, score: 0, band: leverBandFor(0), lowest: [], emailed: false });

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "Enter a valid email" }, { status: 400 });
  }
  const name = (body.name ?? "").trim().slice(0, 80);
  const firstName = name.split(/\s+/)[0] || "";

  if (!Array.isArray(body.answers) || body.answers.length !== LEVER_COUNT) {
    return NextResponse.json({ ok: false, error: "Answer all ten questions" }, { status: 400 });
  }
  const answers = body.answers.map(Boolean);
  const { total, lowest } = scoreLevers(answers);
  const band = leverBandFor(total);

  // 1. Persist first.
  await insertLead({ businessId: null, email, source: "ai-levers-quiz", attribution: body.attribution ?? null });

  // 2. Kit: master list. (A dedicated tag can be added once one exists in the account.)
  await pushToKit({ email, firstName: firstName || undefined, tagIds: [KIT_TAG_MASTER] });

  // 3. The reader's copy.
  const greet = firstName ? `${esc(firstName)}, here` : "Here";
  const lowestHtml = lowest.length
    ? paragraph(`<strong style="color:#f5f5f3;">Start with:</strong> ${lowest.map((l) => `${l.num} ${esc(l.lever)}`).join(" · ")}. Each one is a practice, not a purchase — the post explains what it looks like on a job site.`)
    : "";
  const visitorSent = await sendEmail({
    to: email,
    replyTo: process.env.LEAD_ALERT_TO || "hello@6signal.co",
    subject: `Your ten-levers score: ${total} of ${LEVER_COUNT}`,
    html: emailShell(
      [
        monoLabel("MIT's ten levers · your audit"),
        heading(`${greet} is how your shop scored.`),
        scoreHtml(total, band.label, band.text),
        lowestHtml,
        answersHtml(answers),
        button("Re-read the ten levers", POST_URL),
        paragraph(
          `Reply to this email if you want to talk through your lowest levers. And if you have not checked whether the AI engines can find your business yet, that is the other half of the picture: <a href="https://6signal.co/visibility-check" style="color:#E6FF00;">the AI Visibility Audit</a>, $27, self-serve.`
        ),
      ].join("")
    ),
  });

  // 4. Owner alert.
  await sendEmail({
    to: process.env.LEAD_ALERT_TO || "hello@6signal.co",
    replyTo: email,
    subject: `Ten-levers audit — ${name || email} scored ${total}/${LEVER_COUNT}`,
    html: emailShell(
      [
        monoLabel("Research · ten-levers audit completed"),
        heading(name ? esc(name) : esc(email)),
        `<tr><td style="padding-bottom:8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${row("Email", `<a href="mailto:${esc(email)}" style="color:#E6FF00;">${esc(email)}</a>`)}
            ${row("Post", `<a href="${POST_URL}" style="color:#E6FF00;">MIT's 10 Levers</a>`)}
            ${row("Source", esc(String(body.attribution?.source ?? "(direct)")))}
            ${row("Kit", "Tagged 6 SIGNAL")}
          </table>
        </td></tr>`,
        scoreHtml(total, band.label, band.text),
        answersHtml(answers),
        paragraph(`Reply to this email to reach ${firstName ? esc(firstName) : "them"} directly.`),
      ].join("")
    ),
  });

  return NextResponse.json({
    ok: true,
    score: total,
    band: { label: band.label, text: band.text },
    lowest: lowest.map((l) => ({ num: l.num, lever: l.lever })),
    emailed: visitorSent,
  });
}
