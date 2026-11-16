import { NextRequest, NextResponse } from "next/server";
import { unsubscribe, prospectFromToken } from "../../lib/campaigns";

export const dynamic = "force-dynamic";

// The link in every campaign email. GET shows a one-button page (so a mail
// scanner opening the link doesn't unsubscribe anyone); pressing it, or a
// one-click List-Unsubscribe POST, marks the prospect Do Not Contact.

const page = (title: string, body: string) => new NextResponse(
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="margin:0;background:#060606;color:#f2f2f2;font:16px/1.5 Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center">
<main style="max-width:440px;padding:32px 24px;text-align:center"><div style="font:600 11px monospace;letter-spacing:.24em;color:#E6FF00;margin-bottom:24px">6 SIGNAL</div>${body}</main></body></html>`,
  { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
);

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t") ?? "";
  if (t === "test" || t === "preview") return page("Test link", "<h1 style=\"font-size:20px\">This is a test link</h1><p>It doesn't unsubscribe anyone.</p>");
  if (!prospectFromToken(t)) return page("Link not valid", "<h1 style=\"font-size:20px\">This link isn't valid</h1><p>Reply to the email with \"unsubscribe\" and we'll take you off the list.</p>");
  return page("Unsubscribe", `<h1 style="font-size:20px">Stop these emails?</h1><p>Press the button and you won't get another email from us.</p>
<form method="post"><input type="hidden" name="t" value="${esc(t)}"><button type="submit" style="margin-top:12px;background:#E6FF00;color:#0b0d02;border:0;border-radius:6px;padding:12px 24px;font-weight:600;font-size:15px;cursor:pointer">Unsubscribe</button></form>`);
}

export async function POST(req: NextRequest) {
  let t = req.nextUrl.searchParams.get("t") ?? "";
  try {
    const form = await req.formData();
    t = String(form.get("t") ?? t);
  } catch { /* one-click POST with no body */ }
  try {
    const r = await unsubscribe(t);
    if (r === "invalid") return page("Link not valid", "<h1 style=\"font-size:20px\">This link isn't valid</h1><p>Reply to the email with \"unsubscribe\" and we'll take you off the list.</p>");
    return page("Unsubscribed", "<h1 style=\"font-size:20px\">You're unsubscribed</h1><p>You won't get another email from us.</p>");
  } catch {
    return page("Something went wrong", "<h1 style=\"font-size:20px\">That didn't go through</h1><p>Reply to the email with \"unsubscribe\" and we'll take you off the list.</p>");
  }
}
