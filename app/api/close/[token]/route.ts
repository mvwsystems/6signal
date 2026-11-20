import { NextRequest, NextResponse } from "next/server";
import { asSystem, getDealByToken, syncSigned } from "../../../lib/close";

export const dynamic = "force-dynamic";

// Public, token-only: what the client page needs to move from "sign" to "pay"
// to "done". POST { op: "signed" } is only a hint from the browser that the
// DocuSeal form finished; syncSigned verifies it with DocuSeal's API before
// anything changes, so a forged call can't mark a deal signed.
const view = (d: NonNullable<Awaited<ReturnType<typeof getDealByToken>>>) => ({
  status: d.status, signed: !!d.signed_at, paid: !!d.paid_at, invoiceUrl: d.deposit_invoice_url,
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await getDealByToken(token);
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(view(d));
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const d = await getDealByToken(token);
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const next = await asSystem(() => syncSigned(d));
    return NextResponse.json(view(next));
  } catch (e) {
    console.error("[close] sign sync", e);
    return NextResponse.json({ ...view(d), retry: true });
  }
}
