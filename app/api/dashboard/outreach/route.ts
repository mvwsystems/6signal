import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "../../../lib/dashboard-auth";
import { getBusiness, listCompletedAudits, getAudit } from "../../../lib/db";

export const maxDuration = 60;

// Cold-outreach draft for a prospect: uses their latest stored scan/battle
// plan as evidence ("ChatGPT recommends your competitor — here's proof") and
// returns subject + body for Matt to copy/send. Nothing is sent from here.

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: { businessId?: string } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body?.businessId) return NextResponse.json({ error: "businessId required" }, { status: 400 });

  const business = await getBusiness(body.businessId);
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const reports = await listCompletedAudits(body.businessId);
  const latest = reports.find((r) => String(r.prompt_version ?? "").startsWith("scan") || String(r.prompt_version ?? "").startsWith("battleplan"));
  const auditPayload = latest ? (await getAudit(String(latest.id)))?.payload : null;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

  const facts = {
    business: business.name, trade: business.trade, city: business.city,
    evidence: auditPayload ? JSON.stringify(auditPayload).slice(0, 4000) : "No scan on file — write a curiosity-based opener instead.",
  };
  const system = `You write a cold outreach email FROM Matt Vincent Walker of 6 Signal (AI-visibility practice for contractors) TO the owner of the business described. Goal: get a reply/short call. Style: direct, respectful of their time, specific — lead with the most striking piece of REAL evidence from their scan (e.g. who AI recommends instead of them, their Maps position, review gap vs a named competitor). No hype words, no exclamation points, under 130 words, first person, ends with a low-friction ask (a free 60-second visibility check link: 6signal.co/ai-visibility-check, or a short call). Return ONLY JSON: {"subject":"...", "body":"..."} — body is plain text with line breaks.`;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 700, temperature: 0, system, messages: [{ role: "user", content: JSON.stringify(facts) }] }),
    });
    if (!res.ok) return NextResponse.json({ error: `Draft failed (${res.status})` }, { status: 502 });
    const data = await res.json();
    const text: string = (data.content ?? []).filter((b: { type: string }) => b.type === "text").map((b: { text: string }) => b.text).join("");
    const m = text.replace(/```json\n?|```\n?/g, "").match(/\{[\s\S]*\}/);
    if (!m) return NextResponse.json({ error: "Draft was malformed" }, { status: 502 });
    const parsed = JSON.parse(m[0]);
    return NextResponse.json({ subject: String(parsed.subject ?? ""), body: String(parsed.body ?? "") });
  } catch (e) {
    console.error("[outreach]", e);
    return NextResponse.json({ error: "Draft failed" }, { status: 502 });
  }
}
