import { NextRequest, NextResponse } from "next/server";
import { upsertBusiness, createIntake, insertLead } from "../../lib/db";
import { sendEmail, emailShell, heading, paragraph, monoLabel } from "../../lib/email";

// Receives the completed /start website questionnaire. Persists the intake
// (the id rides to Stripe as client_reference_id if the deposit step is ever
// switched back on) and emails the owner the full formatted Q&A immediately.

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: NextRequest) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    trade?: string;
    currentSite?: string;
    answers?: { section: string; label: string; answer: string }[];
    hp?: string;
    attribution?: Record<string, unknown> | null;
  } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, phone, company, trade, currentSite, answers, hp, attribution } = body ?? {};
  if (hp) return NextResponse.json({ ok: true, id: null });

  if (!name?.trim() || !company?.trim() || !trade?.trim() || !email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Name, company, trade, and a valid email are required" }, { status: 400 });
  }
  const answered = (answers ?? []).filter((a) => a?.answer?.trim());

  // Persist first — the funnel works even if email fails.
  const serviceArea = answered.find((a) => /service area|cities|where/i.test(a.label))?.answer ?? "TBD";
  const businessId = await upsertBusiness({ name: company, url: currentSite ?? "", trade, city: serviceArea.slice(0, 80) });
  const intakeId = await createIntake({
    businessId,
    form: {
      type: "website_build",
      name,
      email,
      phone: phone ?? "",
      company,
      trade,
      currentSite: currentSite ?? "",
      answers: answered,
    },
    attribution: attribution ?? null,
  });
  await insertLead({ businessId, email, source: "website_intake", attribution: attribution ?? null });

  // Owner notification — full Q&A, formatted, reply-to the prospect.
  const bySection = new Map<string, { label: string; answer: string }[]>();
  for (const a of answered) {
    const key = a.section || "Questionnaire";
    if (!bySection.has(key)) bySection.set(key, []);
    bySection.get(key)!.push(a);
  }
  const qaHtml = [...bySection.entries()]
    .map(
      ([section, items]) =>
        monoLabel(esc(section)) +
        paragraph(
          items
            .map((i) => `<strong style="color:#f5f5f3;">${esc(i.label)}</strong><br/>${esc(i.answer).replace(/\n/g, "<br/>")}`)
            .join("<br/><br/>")
        )
    )
    .join("");

  await sendEmail({
    to: process.env.LEAD_ALERT_TO || "hello@6signal.co",
    replyTo: email,
    subject: `🔥 Website Build Intake — ${company} (${trade}) 🔥`,
    html: emailShell(
      [
        monoLabel("Website build · questionnaire completed"),
        heading(`${esc(company)} — ${esc(trade)}`),
        paragraph(
          `<strong style="color:#f5f5f3;">Contact:</strong> ${esc(name)} · ${esc(email)}${phone?.trim() ? ` · ${esc(phone)}` : ""}<br/>` +
          (currentSite?.trim() ? `<strong style="color:#f5f5f3;">Current website:</strong> ${esc(currentSite)} — crawl it for seed material at build time<br/>` : "") +
          `<strong style="color:#f5f5f3;">Intake ID:</strong> ${intakeId ?? "not persisted"}<br/>` +
          `<strong style="color:#f5f5f3;">Next:</strong> no payment step — build V1 from these answers and send it back.`
        ),
        qaHtml,
      ].join("")
    ),
  });

  return NextResponse.json({ ok: true, id: intakeId });
}
