import { NextRequest, NextResponse } from "next/server";
import { insertLead } from "../../lib/db";
import { sendEmail, emailShell, heading, paragraph, monoLabel } from "../../lib/email";
import { pushAlert } from "../../lib/notify";

// Structured inquiry form (/inquire + /contact). Replaces the old mailto:
// links, which silently fail for anyone without a configured mail client.
// Sends the owner a 🔥-flagged email per rung (the inbox cue), sets reply-to
// to the inquirer, and best-effort records a lead.

const REGARDING = new Set(["start", "stabilize", "scale", "systemize", "training", "general"]);

const LABELS: Record<string, string> = {
  start: "Start — Website & Brand",
  stabilize: "Stabilize — Front-Office AI",
  scale: "Scale — AI Visibility",
  systemize: "Systemize — AI Infrastructure",
  training: "Team Training",
  general: "General",
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: NextRequest) {
  let body: Record<string, string> | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, company, email, phone, url, regarding, message, hp } = body ?? {};

  // Honeypot: bots fill every field; humans never see this one.
  if (hp) return NextResponse.json({ ok: true });

  if (!name?.trim() || !email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Name and a valid email are required" }, { status: 400 });
  }
  const about = REGARDING.has(regarding ?? "") ? (regarding as string) : "general";

  const rows = [
    ["Name", name],
    ["Company", company],
    ["Email", email],
    ["Phone", phone],
    ["Website", url],
    ["Regarding", LABELS[about]],
  ]
    .filter(([, v]) => v?.trim())
    .map(([k, v]) => `<strong style="color:#f5f5f3;">${k}:</strong> ${esc(v as string)}`)
    .join("<br/>");

  const sections = [
    monoLabel(`Inquiry · ${LABELS[about]}`),
    heading(`${esc(name)}${company?.trim() ? ` — ${esc(company)}` : ""}`),
    paragraph(rows),
    ...(message?.trim() ? [paragraph(`<strong style="color:#f5f5f3;">Message:</strong><br/>${esc(message).replace(/\n/g, "<br/>")}`)] : []),
    paragraph(`Reply to this email to respond directly.`),
  ].join("");

  const sent = await sendEmail({
    to: process.env.LEAD_ALERT_TO || "hello@6signal.co",
    replyTo: email,
    subject: `🔥 ${LABELS[about]} Inquiry 🔥`,
    html: emailShell(sections),
  });

  // Best-effort lead record — funnel unaffected if persistence is off.
  await insertLead({ businessId: null, email, source: `inquiry_${about}` });

  await pushAlert({
    title: `Inquiry — ${LABELS[about]}`,
    message: `${name}${company?.trim() ? ` (${company})` : ""} · ${email}`,
    priority: "default",
    tags: "inbox_tray",
  });

  if (!sent) {
    return NextResponse.json({ error: "Send failed — email hello@6signal.co directly." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
