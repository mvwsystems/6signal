import { NextRequest, NextResponse } from "next/server";
import { sendEmail, emailShell, heading, paragraph, button, monoLabel } from "../../lib/email";

// Delivers the free-check result to the user's inbox — the promise the
// /ai-visibility-check page has been making. Called by the page right after
// the check renders.

interface SignalSummaryItem {
  signal?: string;
  finding?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: NextRequest) {
  let body: {
    email?: string;
    name?: string;
    trade?: string;
    city?: string;
    ai_response?: string;
    signal_summary?: SignalSummaryItem[];
    found?: boolean;
  } | null = null;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, name, trade, city, ai_response, signal_summary, found } = body ?? {};
  if (!email || !name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const findings = (signal_summary ?? [])
    .filter((s) => s?.finding)
    .map(
      (s) => `<tr><td style="padding-bottom:14px;">
        <span style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.2em;color:#E6FF00;">${esc(s.signal ?? "SIGNAL")}</span>
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#9a9a98;margin:6px 0 0;">${esc(s.finding ?? "")}</p>
      </td></tr>`
    )
    .join("");

  const verdict = found
    ? `${esc(name)} appeared in the projected response. That position is worth protecting — most contractors holding it don't know why they hold it.`
    : `${esc(name)} did not appear. When buyers in ${esc(city ?? "your market")} ask AI who to call, other names are filling that answer.`;

  const html = emailShell(
    [
      monoLabel("Your AI visibility check"),
      heading(found ? "You appeared in the answer." : "Your business didn't appear."),
      paragraph(`Here is the result of your AI visibility check for <strong style="color:#f5f5f3;">${esc(name)}</strong>${trade ? ` (${esc(trade)}` : ""}${trade && city ? `, ${esc(city)})` : trade ? ")" : ""}.`),
      ai_response
        ? `<tr><td style="padding:4px 0 22px;">
            <div style="border-left:2px solid #E6FF00;padding:4px 0 4px 18px;">
              <p style="font-family:Arial,Helvetica,sans-serif;font-style:italic;font-size:15px;line-height:1.6;color:#b8b8b5;margin:0;">${esc(ai_response)}</p>
            </div>
          </td></tr>`
        : "",
      paragraph(verdict),
      findings ? monoLabel("What we observed") : "",
      findings,
      paragraph(
        "The full AI Visibility Brief maps your buyer's journey, scores all six signals, and gives you a prioritized 90-day roadmap — specific to your business, trade, and market."
      ),
      button("Get the full brief — $27", "https://6signal.co/visibility-check"),
    ].join("")
  );

  const sent = await sendEmail({
    to: email,
    subject: found
      ? `${name}: you appeared in the AI answer`
      : `${name}: AI didn't name your business`,
    html,
  });

  return NextResponse.json({ sent });
}
