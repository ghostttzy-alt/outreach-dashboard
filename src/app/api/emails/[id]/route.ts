import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJson, route, type IdCtx } from "@/lib/api";
import { updateEmail } from "@/lib/services";
import { EMAIL_FIELDS, pickFields } from "@/lib/validate";

export const GET = route(async (_req, { params }: IdCtx) => {
  const { id } = await params;
  const email = await prisma.email.findUnique({ where: { id } });
  if (!email) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: email });
});

export const PATCH = route(async (req, { params }: IdCtx) => {
  const { id } = await params;
  const { leadId: _ignored, ...data } = pickFields(await readJson(req), EMAIL_FIELDS);
  const email = await updateEmail(id, data);
  return NextResponse.json({ data: email });
});

export const DELETE = route(async (_req, { params }: IdCtx) => {
  const { id } = await params;
  await prisma.email.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
