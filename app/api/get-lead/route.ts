import { NextRequest, NextResponse } from "next/server";
import { insertLead } from "../../lib/db";
import { sendEmail, emailShell, heading, paragraph, button, monoLabel } from "../../lib/email";
import { pushAlert } from "../../lib/notify";
import { looksLikeSpam } from "../../lib/spam";

// Lead capture for the /get/<keyword> lead-magnet pages (static HTML in
// public/get/, built from the "AI Adoption in AEC" playbook). Two kinds:
//   audit_request — RADAR and NAMED free mini audits: firm, city, trade, website
//   tool_result   — email capture under the seven /get tools, with the score
// Same shape as /api/inquiry: record the lead first, then owner email + push
// (audit requests only), then a best-effort copy to the visitor.

export const dynamic = "force-dynamic";

const ASSETS: Record<string, string> = {
  RADAR: "6-Signal Radar Scorecard",
  CURVE: "Adoption Curve Self-Score",
  SCAN: "Plan Review Prompt Pack",
  STAKES: "AI Table Stakes Checklist",
  SIGNALS: "Six Signals Self-Rating",
  OVERNIGHT: "Overnight Shift Blueprint",
  SIXAM: "6 AM Punch Digest",
  STATIC: "12 Reasons You Render as Static",
  ROADMAP: "24-Month Adoption Roadmap",
  AUDIT: "DIY AI Visibility Check",
  LATER: "Cost of Later Calculator",
  STACK: "AI Infrastructure Stack Checklist",
  SCHEMA: "Contractor Schema Generator",
  NODE: "Recommendation Content Map",
  FOOTINGS: "Six Footings Self-Check",
  RFI: "RFI Response Drafter",
  STAMP: "Submittal Pre-Review Prompt",
  CLOUD: "Drawing Conflict Finder",
  CRASH: "Schedule Compression Prompt",
  TAKEOFF: "Takeoff QA + Room Finish Schedule",
  CLASH: "Clash Triage Prompt",
  DAILY: "Daily Report Autopilot",
  TALK: "Toolbox Talk Generator",
  PUNCH: "Photo-to-Punch Prompt",
  PAYAPP: "G703 Percent-Complete Fill",
  BID: "Bid / No-Bid Scorecard",
  VARIANCE: "Estimate vs Actual Review",
  PREQUAL: "Prequal Packet Assembler",
  NAMED: "Who AI Names Instead of You",
  PROFILE: "GBP Gap Fix Guide",
  NOTES: "OAC Meeting → Action Items",
  SPEC: "Ask the Spec Book Setup",
  INBOX: "Change-Order Risk Inbox Triage",
  WALK: "360 Walk → Percent Complete",
  TICKET: "Delivery Ticket → Ledger Line",
  PROPOSAL: "Proposal Section Drafter",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Honeypot: bots fill every field; humans never see this one.
  if (body.hp) return NextResponse.json({ ok: true });

  const kind = body.kind === "audit_request" ? "audit_request" : "tool_result";
  const keyword = clip(body.keyword, 20).toUpperCase();
  const asset = ASSETS[keyword];
  const email = clip(body.email, 254).toLowerCase();
  const firm = clip(body.firm, 120);
  const city = clip(body.city, 80);
  const trade = clip(body.trade, 120);
  const website = clip(body.website, 200);
  const result = clip(body.result, 4000);
  const attribution = (body.attribution && typeof body.attribution === "object" ? body.attribution : null) as Record<string, unknown> | null;

  if (!asset) return NextResponse.json({ error: "Unknown asset" }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  if (kind === "audit_request" && (!firm || !city || !trade)) {
    return NextResponse.json({ error: "Firm, city and trade are required" }, { status: 400 });
  }

  const spam = looksLikeSpam({ name: firm, company: firm, email, message: trade });
  if (spam) {
    console.warn("[get-lead] dropped spam:", spam);
    return NextResponse.json({ ok: true });
  }

  // 1. Persist first — the record of the lead regardless of what follows.
  await insertLead({ businessId: null, email, source: `get_${keyword.toLowerCase()}`, attribution });

  const pageUrl = `https://6signal.co/get/${keyword.toLowerCase()}`;
  const rows = [
    ["Asset", `${keyword} · ${asset}`],
    ["Email", email],
    ["Firm", firm],
    ["City", city],
    ["Trade", trade],
    ["Website", website],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<strong style="color:#f5f5f3;">${k}:</strong> ${esc(v)}`)
    .join("<br/>");

  // 2. Owner email. Audit requests carry a 48-hour promise, so they get the 🔥 flag and a push.
  const ownerSent = await sendEmail({
    to: process.env.LEAD_ALERT_TO || "hello@6signal.co",
    replyTo: email,
    subject: kind === "audit_request" ? `🔥 ${keyword} Mini Audit Request 🔥` : `${keyword} tool result — ${email}`,
    html: emailShell(
      [
        monoLabel(kind === "audit_request" ? `Free mini audit · deliver within 48 hours` : `Tool result · /get/${keyword.toLowerCase()}`),
        heading(firm ? esc(firm) : esc(email)),
        paragraph(rows),
        ...(result ? [paragraph(`<strong style="color:#f5f5f3;">Result:</strong><br/>${esc(result).replace(/\n/g, "<br/>")}`)] : []),
        paragraph("Reply to this email to respond directly."),
      ].join(""),
    ),
  });

  if (kind === "audit_request") {
    await pushAlert({
      title: `${keyword} mini audit request`,
      message: `${firm} · ${city} · ${trade} · ${email}`,
      priority: "high",
      tags: "inbox_tray",
    });
  }

  // 3. Visitor copy (best effort).
  await sendEmail({
    to: email,
    subject: kind === "audit_request" ? `Your ${asset} request` : `Your ${asset} result`,
    html: emailShell(
      [
        monoLabel(`6 Signal · ${keyword}`),
        heading(kind === "audit_request" ? "Request received." : "Your result"),
        kind === "audit_request"
          ? paragraph(`I have ${esc(firm)} in ${esc(city)} (${esc(trade)}). Your results arrive within 48 hours, from this address.`)
          : paragraph(esc(result).replace(/\n/g, "<br/>") || "Saved."),
        button("Back to the asset", pageUrl),
        paragraph("Matt Vincent Walker · 6 Signal"),
      ].join(""),
    ),
  });

  if (kind === "audit_request" && !ownerSent) {
    return NextResponse.json({ error: "Send failed — email hello@6signal.co directly." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
