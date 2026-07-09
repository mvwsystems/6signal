import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { getBusiness, listTasks, getLatestClientReport, ensureShareToken, setBusinessContactEmail } from "../../../lib/db";
import { buildClientReport } from "../../../lib/clientReport";
import { sendEmail, emailShell, heading, paragraph, monoLabel, button } from "../../../lib/email";

export const maxDuration = 60;

// New-client welcome: ensures a baseline report exists (generates one if not),
// includes their live share link, the initial split of who-does-what, and a
// warm Claude-written intro. Sent to the client, CC the owner, replies to
// hello@6signal.co.

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { businessId?: string; email?: string } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { businessId, email } = body ?? {};
  if (!businessId || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "businessId and a valid email required" }, { status: 400 });
  }

  const business = await getBusiness(businessId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  // Baseline + share link are prerequisites — create them if missing.
  let latest = await getLatestClientReport(businessId);
  if (!latest) {
    const built = await buildClientReport(businessId);
    if (built) latest = { payload: built.payload };
  }
  const token = await ensureShareToken(businessId);
  const shareUrl = token ? `https://6signal.co/c/${token}` : null;

  const tasks = await listTasks(businessId);
  const ourTasks = tasks.filter((t) => t.status !== "done" && t.owner !== "Client").map((t) => String(t.task)).slice(0, 5);
  const clientTasks = tasks.filter((t) => t.status !== "done" && t.owner === "Client").map((t) => String(t.task)).slice(0, 5);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = latest?.payload ?? null;

  let intro = `Welcome aboard — we're genuinely glad to be working on ${business.name}'s AI visibility.`;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const facts = {
        business: business.name, trade: business.trade, city: business.city,
        baseline_mention_rate: payload?.metrics?.mention_rate ?? null,
        baseline_headline: payload?.narrative?.headline ?? null,
        first_things_we_do: ourTasks, what_client_does: clientTasks,
      };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 500, temperature: 0,
          system: `You write the opening 2-3 sentences of a WELCOME email from Matt Vincent Walker (6 Signal) to a newly signed contractor client. Warm, confident, plain English, no hype, no exclamation points. Reference their real baseline simply if a number is present, and frame the 90 days ahead. Return ONLY JSON: {"intro": "..."}`,
          messages: [{ role: "user", content: JSON.stringify(facts) }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text: string = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
        const m = text.replace(/```json\n?|```\n?/g, "").match(/\{[\s\S]*\}/);
        if (m) intro = JSON.parse(m[0]).intro || intro;
      }
    } catch (e) {
      console.error("[welcome-client] intro failed:", e);
    }
  }

  const list = (ts: string[]) => ts.map((t) => `• ${t}`).join("<br/>");
  const sections = [
    monoLabel(`Welcome · ${business.name}`),
    heading("Your AI visibility work starts now."),
    paragraph(intro),
    paragraph(`Here's how this works: we track how AI assistants (ChatGPT, Gemini, Perplexity, Claude, Google) answer real buyer questions about ${business.trade.toLowerCase()} services in ${business.city} — and we do the work that makes you the answer. You'll get a progress report from us regularly, and your live results page is available to you any time, day or night:`),
    ...(shareUrl ? [button("View my live results", shareUrl)] : []),
    ourTasks.length ? paragraph(`<strong style="color:#f5f5f3;">What we're doing first:</strong><br/>${list(ourTasks)}`) : "",
    clientTasks.length ? paragraph(`<strong style="color:#E6FF00;">What we need from you to start:</strong><br/>${list(clientTasks)}`) : "",
    paragraph(`Questions any time — just reply to this email and it comes straight to me.<br/>— Matt Vincent Walker, 6 Signal`),
  ].filter(Boolean).join("");

  const sent = await sendEmail({
    to: email,
    cc: [process.env.LEAD_ALERT_TO || "hello@6signal.co"],
    replyTo: "hello@6signal.co",
    subject: `Welcome to 6 Signal — ${business.name}`,
    html: emailShell(sections),
  });
  if (!sent) return NextResponse.json({ error: "Email send failed (check Resend config)." }, { status: 502 });

  await setBusinessContactEmail(businessId, email);
  return NextResponse.json({ ok: true, share_url: shareUrl });
}
