import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ApiError } from "./validate";

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/** Wrap a route handler so thrown errors become clean JSON responses. */
export function route<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (err.code === "P2002") return NextResponse.json({ error: "Already exists" }, { status: 409 });
        if (err.code === "P2003") return NextResponse.json({ error: "Related record not found" }, { status: 400 });
      }
      if (err instanceof SyntaxError) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      console.error(err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export async function readJson(req: Request) {
  const text = await req.text();
  return text ? JSON.parse(text) : {};
}

export type IdCtx = { params: Promise<{ id: string }> };

/** Who is calling: the daily Claude session (API key) or the signed-in dashboard. */
export function actor(req: Request) {
  return req.headers.get("x-api-key") || /^Bearer\s/i.test(req.headers.get("authorization") ?? "") ? "daily-session" : "dashboard";
}

/** Accept a single object, an array, or { items: [...] } / { leads: [...] } / { drafts: [...] }. */
export function asList(body: unknown, key: string): { list: unknown[]; single: boolean } {
  if (Array.isArray(body)) return { list: body, single: false };
  if (body && typeof body === "object" && Array.isArray((body as Record<string, unknown>)[key])) return { list: (body as Record<string, unknown[]>)[key], single: false };
  if (body && typeof body === "object" && Array.isArray((body as Record<string, unknown>).items)) return { list: (body as Record<string, unknown[]>).items, single: false };
  return { list: [body], single: true };
}
