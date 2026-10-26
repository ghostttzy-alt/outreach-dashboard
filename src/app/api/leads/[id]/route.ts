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
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: lead });
});

export const PATCH = route(async (req, { params }: IdCtx) => {
  const { id } = await params;
  const lead = await updateLead(id, pickFields(await readJson(req), LEAD_FIELDS));
  return NextResponse.json({ data: lead });
});

export const DELETE = route(async (_req, { params }: IdCtx) => {
  const { id } = await params;
  await prisma.$transaction([prisma.activity.deleteMany({ where: { leadId: id } }), prisma.lead.delete({ where: { id } })]);
  return NextResponse.json({ ok: true });
});
