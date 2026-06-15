import { NextRequest, NextResponse } from "next/server";
import { checkPassword, dashboardToken, isAuthed, DASH_COOKIE } from "../../../lib/dashboard-auth";

// GET  → current auth state (and whether a password is even configured)
// POST → { password } sets the gate cookie on success
// DELETE → log out

export async function GET(req: NextRequest) {
  return NextResponse.json({ authed: isAuthed(req), configured: !!dashboardToken() });
}

export async function POST(req: NextRequest) {
  let body: { password?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const token = dashboardToken();
  if (!token) {
    return NextResponse.json(
      { error: "Dashboard password is not configured on the server." },
      { status: 503 }
    );
  }
  if (!checkPassword(body?.password ?? "")) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(DASH_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DASH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
