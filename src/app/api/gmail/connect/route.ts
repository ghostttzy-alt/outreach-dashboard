import { NextResponse } from "next/server";
import { authUrl, gmailConfigured, publicOrigin } from "@/lib/gmail";

// GET /api/gmail/connect → Google's consent screen. A random state cookie protects the callback.
export async function GET(req: Request) {
  const origin = publicOrigin(req);
  if (!gmailConfigured()) return NextResponse.redirect(`${origin}/settings?gmail=not_configured`);
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(authUrl(origin, state));
  res.cookies.set("gmail_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
