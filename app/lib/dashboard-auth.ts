import crypto from "crypto";
import { NextRequest } from "next/server";

// Password gate for the internal /dashboard, now with two accounts:
//   owner    → DASHBOARD_PASSWORD (Matt). Unchanged, so existing sessions stay valid.
//   operator → OPERATOR_PASSWORD (Casey). Optional; unset means no operator login.
// Stateless: the cookie holds a sha256 of the password (salted with the role
// for the operator), and each request recomputes and constant-time compares.
// The password itself is never derivable from the stored hash. The role
// decides what an account may do with approvals (see commandCenter.ts).

export const DASH_COOKIE = "6sig_dash";

export type Role = "owner" | "operator";

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const ownerPw = () => process.env.DASHBOARD_PASSWORD?.trim() || "";
const operatorPw = () => {
  const pw = process.env.OPERATOR_PASSWORD?.trim() || "";
  // The same password for both would make every login the owner; refuse it.
  return pw && pw !== ownerPw() ? pw : "";
};

export function dashboardToken(): string | null {
  const pw = ownerPw();
  return pw ? sha(pw) : null;
}

function operatorToken(): string | null {
  const pw = operatorPw();
  return pw ? sha(`operator:${pw}`) : null;
}

export function tokenFor(role: Role): string | null {
  return role === "owner" ? dashboardToken() : operatorToken();
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

// Which account a typed password opens, or null.
export function checkPassword(input: string): Role | null {
  if (!input) return null;
  const o = ownerPw();
  if (o && safeEqual(input, o)) return "owner";
  const p = operatorPw();
  if (p && safeEqual(input, p)) return "operator";
  return null;
}

export function sessionRole(req: NextRequest): Role | null {
  const cookie = req.cookies.get(DASH_COOKIE)?.value;
  if (!cookie) return null;
  const owner = dashboardToken();
  if (owner && safeEqual(cookie, owner)) return "owner";
  const op = operatorToken();
  if (op && safeEqual(cookie, op)) return "operator";
  return null;
}

export function isAuthed(req: NextRequest): boolean {
  return sessionRole(req) !== null; // unset passwords = locked, not open
}

// Display names written into the activity log.
export function actorName(role: Role): string {
  return role === "owner"
    ? process.env.DASHBOARD_OWNER_NAME?.trim() || "Matt"
    : process.env.OPERATOR_NAME?.trim() || "Casey";
}
