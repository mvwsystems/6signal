import { NextRequest, NextResponse } from "next/server";
import {
  whoFromRequest, checkBreakGlass, breakGlassConfigured, googleConfigured, actorName, DASH_COOKIE, OLD_COOKIE,
} from "../../../lib/dashboard-auth";
import { encodeSession } from "../../../lib/session";
import { runAs } from "../../../lib/actor";
import { breakGlassUsed } from "../../../lib/commandCenter";

// GET    → who is signed in, and which sign-in methods are set up
// POST   → { password } break-glass sign-in (owner). Always logged + alarmed.
// DELETE → sign out
// Google sign-in lives at ./google (start) and ./google/callback.

export async function GET(req: NextRequest) {
  const who = whoFromRequest(req);
  return NextResponse.json({
    authed: !!who, role: who?.role ?? null, name: who?.name ?? null, email: who?.email ?? null, method: who?.method ?? null,
    google: googleConfigured(), breakGlass: breakGlassConfigured(),
    ownerName: actorName("owner"), operatorName: actorName("operator"),
  });
}

export async function POST(req: NextRequest) {
  let body: { password?: string } | null = null;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  if (!breakGlassConfigured()) return NextResponse.json({ error: "The break-glass password is not set on the server." }, { status: 503 });
  if (!checkBreakGlass(body?.password ?? "")) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });

  const token = encodeSession({ email: "break-glass", role: "owner", method: "break_glass" }, 60 * 60 * 12);
  if (!token) return NextResponse.json({ error: "Sessions can't be signed: set SESSION_SECRET." }, { status: 503 });
  // The alarm goes out before the session is handed over.
  await runAs({ role: "owner", name: `${actorName("owner")} (break-glass)` }, () =>
    breakGlassUsed({ ip: req.headers.get("x-nf-client-connection-ip") ?? req.headers.get("x-forwarded-for"), userAgent: req.headers.get("user-agent") }));
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DASH_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  res.cookies.set(OLD_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DASH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set(OLD_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
