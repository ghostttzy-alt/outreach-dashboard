import { NextResponse } from "next/server";
import { AUTH_COOKIE, SESSION_DAYS, authRequired, createSessionToken, safeEqual } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getState } from "@/lib/services";

const MAX_FAILURES = 10;
const LOCK_MINUTES = 15;

/**
 * The password is stored as a scrypt hash in the database. On the very first sign-in there is no hash yet,
 * so DASHBOARD_PASSWORD is checked and then saved as a hash. After that, changing the password happens in
 * Settings. To recover a forgotten password, set PASSWORD_RESET=true and a new DASHBOARD_PASSWORD in Netlify.
 */
export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !password) return NextResponse.json({ error: "Enter your password" }, { status: 400 });

  const state = await getState();
  if (state.lockedUntil && state.lockedUntil > new Date()) {
    return NextResponse.json({ error: `Too many wrong attempts. Try again after ${state.lockedUntil.toLocaleTimeString("en-US")}.` }, { status: 429 });
  }

  const envPassword = process.env.DASHBOARD_PASSWORD ?? "";
  const useEnv = !state.passwordHash || process.env.PASSWORD_RESET === "true";
  let ok: boolean;
  if (useEnv) {
    if (!envPassword) {
      if (!authRequired()) return signIn(); // local development without a password
      return NextResponse.json({ error: "No password set yet. Add DASHBOARD_PASSWORD in Netlify's environment variables and redeploy." }, { status: 503 });
    }
    ok = safeEqual(password, envPassword);
    if (ok) await prisma.systemState.update({ where: { id: 1 }, data: { passwordHash: await hashPassword(password) } });
  } else {
    ok = await verifyPassword(password, state.passwordHash);
  }

  if (!ok) {
    const failures = state.failedLogins + 1;
    await prisma.systemState.update({
      where: { id: 1 },
      data: failures >= MAX_FAILURES ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) } : { failedLogins: failures },
    });
    await new Promise((r) => setTimeout(r, 500)); // slow down guessing
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  if (state.failedLogins || state.lockedUntil) {
    await prisma.systemState.update({ where: { id: 1 }, data: { failedLogins: 0, lockedUntil: null } });
  }
  return signIn();
}

async function signIn() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
  return res;
}
