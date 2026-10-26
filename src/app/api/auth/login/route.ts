import { NextResponse } from "next/server";
import { AUTH_COOKIE, authEnabled, safeEqual, sessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  if (!authEnabled()) return NextResponse.json({ ok: true });
  const { password } = await req.json().catch(() => ({ password: "" }));
  const expected = process.env.DASHBOARD_PASSWORD ?? "";
  if (typeof password !== "string" || !safeEqual(password, expected)) {
    await new Promise((r) => setTimeout(r, 500)); // slow down guessing
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
