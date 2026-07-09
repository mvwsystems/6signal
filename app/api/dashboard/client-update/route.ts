import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { getBusiness, listTasks, getProbeResults, setBusinessContactEmail } from "../../../lib/db";
import { sendEmail, emailShell, heading, paragraph, monoLabel } from "../../../lib/email";

export const maxDuration = 60;

// Owner-triggered client update: composes a plain-English "here's what we're
// doing / here's what we need from you" email from the client's live tasks +
// tracking data, and sends it to the client (reply-to hello@6signal.co).

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

  const [tasks, results] = await Promise.all([listTasks(businessId), getProbeResults(businessId, 14)]);
  const open6 = tasks.filter((t) => t.status !== "done" && t.owner !== "Client");
  const openClient = tasks.filter((t) => t.status !== "done" && t.owner === "Client");
  const done = tasks.filter((t) => t.status === "done");
  const mentionRate = results.length ? Math.round((100 * results.filter((r) => (r as { mentioned: boolean }).mentioned).length) / results.length) : null;

  // Claude writes the client-facing narrative — friendly, concrete, no jargon.
  let intro = `Quick update on the AI-visibility work for ${business.name}.`;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const facts = {
        business: business.name, trade: business.trade, city: business.city,
        mention_rate_last_14d: mentionRate,
        tasks_done: done.map((t) => t.task).slice(0, 8),
        we_are_working_on: open6.map((t) => t.task).slice(0, 6),
        client_needs_to_do: openClient.map((t) => ({ task: t.task, detail: t.detail })).slice(0, 5),
      };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 600, temperature: 0,
          system: `You write a short, warm, plain-English progress paragraph (2-4 sentences) for a contractor client of 6 Signal (an AI-visibility practice). Ground it ONLY in the facts given — real numbers when present, no hype, no jargon, no invented results. If there's a mention-rate number, explain it simply ("when people ask AI assistants about ${business.trade.toLowerCase()} services in your area, you currently come up X% of the time"). Return ONLY JSON: {"intro": "..."}`,
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
      console.error("[client-update] narrative failed:", e);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list = (ts: any[]) => ts.map((t) => `• ${t.task}`).join("<br/>");
  const sections = [
    monoLabel(`${business.name} · AI visibility update`),
    heading("Where things stand."),
    paragraph(intro),
    done.length ? paragraph(`<span style="color:#22c55e;">Recently completed:</span><br/>${list(done.slice(-5))}`) : "",
    open6.length ? paragraph(`<strong style="color:#f5f5f3;">What we're working on now:</strong><br/>${list(open6.slice(0, 6))}`) : "",
    openClient.length ? paragraph(`<strong style="color:#E6FF00;">What we need from you:</strong><br/>${list(openClient.slice(0, 5))}`) : "",
    paragraph(`Questions? Just reply to this email — it comes straight to me.<br/>— Matt Vincent Walker, 6 Signal`),
  ].filter(Boolean).join("");

  const sent = await sendEmail({
    to: email,
    replyTo: "hello@6signal.co",
    subject: `${business.name} — your AI visibility update`,
    html: emailShell(sections),
  });
  if (!sent) return NextResponse.json({ error: "Email send failed (check Resend config)." }, { status: 502 });

  await setBusinessContactEmail(businessId, email);
  return NextResponse.json({ ok: true });
}
