import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authEnabled, safeEqual, sessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  if (!authEnabled()) return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie && safeEqual(cookie, await sessionToken())) return NextResponse.next();

  const apiToken = process.env.API_TOKEN;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (apiToken && bearer && safeEqual(bearer, apiToken)) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const login = new URL("/login", req.url);
  if (req.nextUrl.pathname !== "/") login.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
