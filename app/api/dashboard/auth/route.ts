import { NextRequest, NextResponse } from "next/server";
import { checkPassword, dashboardToken, sessionRole, tokenFor, actorName, DASH_COOKIE } from "../../../lib/dashboard-auth";

// GET  → current auth state, the signed-in account (role + name), and whether
//        a password is even configured
// POST → { password } sets the gate cookie for whichever account it opens
// DELETE → log out

export async function GET(req: NextRequest) {
  const role = sessionRole(req);
  return NextResponse.json({
    authed: !!role, configured: !!dashboardToken(), role, name: role ? actorName(role) : null,
    ownerName: actorName("owner"), operatorName: actorName("operator"),
  });
}

export async function POST(req: NextRequest) {
  let body: { password?: string } | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!dashboardToken()) {
    return NextResponse.json(
      { error: "Dashboard password is not configured on the server." },
      { status: 503 }
    );
  }
  const role = checkPassword(body?.password ?? "");
  const token = role ? tokenFor(role) : null;
  if (!role || !token) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, role, name: actorName(role) });
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
