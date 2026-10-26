import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, apiKeyValid, authRequired, cronSecret, safeEqual, verifySessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isApi = path.startsWith("/api/");

  if (isApi) {
    const key = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (apiKeyValid(key)) return NextResponse.next();
    if (path.startsWith("/api/cron/")) {
      const secret = req.headers.get("x-cron-secret");
      if (secret && safeEqual(secret, await cronSecret())) return NextResponse.next();
    }
  }

  if (!authRequired()) return NextResponse.next();
  if (await verifySessionToken(req.cookies.get(AUTH_COOKIE)?.value)) return NextResponse.next();

  if (isApi) return NextResponse.json({ error: "Unauthorized. Send your API key in the x-api-key header." }, { status: 401 });
  const login = new URL("/login", req.url);
  if (path !== "/") login.searchParams.set("next", path + req.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  // Public: the sign-in page and its API, mockup previews, and static files.
  matcher: ["/((?!login|api/auth/login|preview/|_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
