import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJson, route, type IdCtx } from "@/lib/api";
import { updateLead } from "@/lib/services";
import { LEAD_FIELDS, pickFields } from "@/lib/validate";

export const GET = route(async (_req, { params }: IdCtx) => {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      emails: { orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }] },
      sites: { orderBy: { createdAt: "desc" } },
      client: true,
      activities: { where: { type: { not: "bounce_notice" } }, orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: lead });
});

export const PATCH = route(async (req, { params }: IdCtx) => {
  const { id } = await params;
  const body = await readJson(req);
  // "problem" is accepted as a short name for mainProblem.
  if (body && typeof body === "object" && "problem" in body && !("mainProblem" in body)) body.mainProblem = body.problem;
  const lead = await updateLead(id, pickFields(body, LEAD_FIELDS));
  return NextResponse.json({ data: lead });
});

export const DELETE = route(async (_req, { params }: IdCtx) => {
  const { id } = await params;
  await prisma.$transaction([prisma.activity.deleteMany({ where: { leadId: id } }), prisma.lead.delete({ where: { id } })]);
  return NextResponse.json({ ok: true });
});
