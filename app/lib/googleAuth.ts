import { NextRequest } from "next/server";

export const STATE_COOKIE = "6sig_oauth_state";

// The redirect URI must match one listed on the Google OAuth client exactly.
export function redirectUri(req: NextRequest): string {
  return process.env.GOOGLE_REDIRECT_URI?.trim() || `${req.nextUrl.origin}/api/dashboard/auth/google/callback`;
}
