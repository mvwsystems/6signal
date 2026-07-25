import { NextResponse } from "next/server";
import crypto from "crypto";
import { markIntakePaid, recordPurchase } from "../../lib/db";
import { sendEmail, emailShell, heading, paragraph, button, monoLabel } from "../../lib/email";
import { pushAlert } from "../../lib/notify";

// Stripe webhook: records every checkout.session.completed so purchases are
// linked to intakes server-side, and emails the buyer a recovery link to
// their brief. Configure in Stripe Dashboard:
//   endpoint  https://6signal.co/api/stripe-webhook
//   events    checkout.session.completed
// and set STRIPE_WEBHOOK_SECRET in Netlify env.

const SITE = "https://6signal.co";

function verifyStripeSignature(payload: string, header: string, secret: string): boolean {
  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=") as [string, string])
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  // 5-minute tolerance against replay
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${payload}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

function productFromAmount(amountTotal: number | null): string {
  switch (amountTotal) {
    case 2700: return "brief_27";
    case 9700: return "strategy_97";
    case 19700: return "call_197";
    case 75000: return "website_deposit_750";
    default: return "unknown";
  }
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  if (!secret) {
    console.warn("[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — ignoring event");
    return NextResponse.json({ received: true });
  }
  if (!verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data?.object ?? {};
  const sessionId = String(session.id ?? "");
  const intakeId = (session.client_reference_id as string | null) ?? null;
  const email =
    ((session.customer_details as Record<string, unknown> | undefined)?.email as string | undefined) ??
    (session.customer_email as string | undefined) ??
    null;
  const amountTotal = (session.amount_total as number | undefined) ?? null;
  const product = productFromAmount(amountTotal);

  if (!sessionId) return NextResponse.json({ received: true });

  const isNew = await recordPurchase({
    stripeSessionId: sessionId,
    intakeId,
    email,
    amountTotal,
    currency: (session.currency as string | undefined) ?? null,
    product,
    raw: session,
  });

  if (intakeId) await markIntakePaid(intakeId);

  // Instant phone push for every sale. Website deposits and Strategy Calls
  // are urgent — both mean the owner picks up the phone.
  if (isNew) {
    const amount = amountTotal != null ? `$${(amountTotal / 100).toFixed(0)}` : "$?";
    const labels: Record<string, string> = {
      brief_27: "AI Visibility Audit",
      strategy_97: "Strategy Brief",
      call_197: "Strategy Call",
      website_deposit_750: "WEBSITE BUILD DEPOSIT",
    };
    const urgent = product === "website_deposit_750" || product === "call_197";
    await pushAlert({
      title: `${labels[product] ?? "Purchase"} — ${amount}`,
      message:
        product === "website_deposit_750"
          ? `${email ?? "unknown buyer"} paid the deposit. Call them to lock direction — they're expecting it.`
          : `${email ?? "unknown buyer"} · ${product}`,
      priority: urgent ? "urgent" : "default",
      tags: urgent ? "rotating_light,moneybag" : "moneybag",
    });
  }

  // Recovery email: even if localStorage dies on the way back from Stripe,
  // the buyer has a durable link to their results.
  if (isNew && email && intakeId && (product === "brief_27" || product === "strategy_97")) {
    const doc = product === "brief_27" ? "audit" : "Strategy Brief";
    const link = `${SITE}/audit-results?intake=${intakeId}`;
    await sendEmail({
      to: email,
      subject: `Your 6 Signal ${doc} — permanent access link`,
      html: emailShell(
        [
          monoLabel("Order confirmed"),
          heading(`Your ${doc} is ready when you are.`),
          paragraph(
            `Your results should already be on screen. If you closed the tab, switched devices, or anything interrupted the page, this link regenerates your ${doc} from the details you submitted — any time, any device.`
          ),
          button(`Open my ${doc}`, link),
          paragraph(
            `If anything looks wrong, reply to this email or write <a href="mailto:hello@6signal.co" style="color:#E6FF00;">hello@6signal.co</a> and we'll fix it or refund you. No forms, no friction.`
          ),
        ].join("")
      ),
    });
  }

  // Website build deposit: alert the owner (build is greenlit) and confirm
  // to the buyer what happens next.
  if (isNew && product === "website_deposit_750") {
    await sendEmail({
      to: process.env.LEAD_ALERT_TO || "hello@6signal.co",
      ...(email ? { replyTo: email } : {}),
      subject: "🔥 Website Build PAID — deposit received 🔥",
      html: emailShell(
        [
          monoLabel("Website build · $750 deposit received"),
          heading("A website build is greenlit."),
          paragraph(
            `<strong style="color:#f5f5f3;">Buyer:</strong> ${email ?? "unknown"}<br/>` +
            `<strong style="color:#f5f5f3;">Intake:</strong> ${intakeId ?? "no intake linked — check the 🔥 Website Build Intake email for the questionnaire"}<br/>` +
            `<strong style="color:#f5f5f3;">Next:</strong> call the client to lock direction (they've been told to expect it), then open Claude Code and start the build from the intake answers.`
          ),
        ].join("")
      ),
    });
    if (email) {
      await sendEmail({
        to: email,
        subject: "Deposit received — your website build has started",
        html: emailShell(
          [
            monoLabel("6 Signal · Website build"),
            heading("We're on it."),
            paragraph(
              "Your $750 deposit is confirmed and your build is in the queue. First: expect a call from Matt Vincent Walker. He'll have already been through every answer in your questionnaire before he dials — the call is where the direction gets locked, and where you get his read on what actually moves buyers in your market. It's short, and it's why one-operator builds come out right the first time."
            ),
            paragraph(
              "After that call, the build starts. You'll see a first preview before the full site is built, and most sites are live within 2–3 weeks of this email. The remaining $750 is due at launch, once you've approved the site."
            ),
            paragraph(
              `Something to add before the call? Reply to this email — it goes straight to the operator building your site.`
            ),
          ].join("")
        ),
      });
    }
  }

  return NextResponse.json({ received: true });
}
