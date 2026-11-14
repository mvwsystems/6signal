import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { googleConfigured } from "../../../../lib/dashboard-auth";
import { STATE_COOKIE, redirectUri } from "../../../../lib/googleAuth";

export const dynamic = "force-dynamic";

// GET → send the browser to Google's account chooser (OpenID Connect, email only).
export async function GET(req: NextRequest) {
  if (!googleConfigured()) return NextResponse.redirect(new URL("/dashboard?login_error=google_not_set_up", req.nextUrl.origin));
  const state = crypto.randomBytes(24).toString("base64url");
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!.trim());
  u.searchParams.set("redirect_uri", redirectUri(req));
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email");
  u.searchParams.set("state", state);
  u.searchParams.set("prompt", "select_account");
  const res = NextResponse.redirect(u.toString());
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/dashboard/auth/google", maxAge: 600 });
  return res;
}
