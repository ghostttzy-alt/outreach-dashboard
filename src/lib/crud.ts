import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { readJson, route, type IdCtx } from "./api";
import { pickFields } from "./validate";

// Minimal delegate shape shared by the simple models.
type Delegate = {
  findMany(args: object): Promise<unknown[]>;
  findUnique(args: object): Promise<unknown>;
  create(args: object): Promise<unknown>;
  update(args: object): Promise<unknown>;
  delete(args: object): Promise<unknown>;
};

type Options = {
  model: "site" | "client" | "coverage" | "activity" | "template";
  fields: Parameters<typeof pickFields>[1];
  required: string[];
  filters?: string[];
  orderBy: object;
  include?: object;
};

/** Standard REST handlers: collection (GET list, POST create) and item (GET, PATCH, DELETE). */
export function crud(opts: Options) {
  const db = () => prisma[opts.model] as unknown as Delegate;

  const collection = {
    GET: route(async (req: Request) => {
      const sp = new URL(req.url).searchParams;
      const where: Record<string, string> = {};
      for (const f of opts.filters ?? []) {
        const v = sp.get(f);
        if (v) where[f] = v;
      }
      const take = Math.min(Number(sp.get("limit")) || 500, 1000);
      const data = await db().findMany({ where, orderBy: opts.orderBy, include: opts.include, take });
      return NextResponse.json({ data });
    }),
    POST: route(async (req: Request) => {
      const data = pickFields(await readJson(req), opts.fields, opts.required);
      const created = await db().create({ data, include: opts.include });
      return NextResponse.json({ data: created }, { status: 201 });
    }),
  };

  const item = {
    GET: route(async (_req: Request, { params }: IdCtx) => {
      const { id } = await params;
      const found = await db().findUnique({ where: { id }, include: opts.include });
      if (!found) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ data: found });
    }),
    PATCH: route(async (req: Request, { params }: IdCtx) => {
      const { id } = await params;
      const data = pickFields(await readJson(req), opts.fields);
      const updated = await db().update({ where: { id }, data, include: opts.include });
      return NextResponse.json({ data: updated });
    }),
    DELETE: route(async (_req: Request, { params }: IdCtx) => {
      const { id } = await params;
      await db().delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }),
  };

  return { collection, item };
}
