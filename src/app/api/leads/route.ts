import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJson, route } from "@/lib/api";
import { leadQueryFromParams } from "@/lib/leadQuery";
import { createLead } from "@/lib/services";
import { LEAD_FIELDS, pickFields } from "@/lib/validate";
import type { Prisma } from "@prisma/client";

// GET /api/leads?q=&stage=&niche=&city=&websiteStatus=&minScore=&maxScore=&sort=&order=&page=&pageSize=
export const GET = route(async (req) => {
  const { where, orderBy, page, pageSize } = leadQueryFromParams(new URL(req.url).searchParams);
  const [total, leads] = await prisma.$transaction([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where, orderBy, skip: (page - 1) * pageSize, take: pageSize,
      include: { activities: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } },
    }),
  ]);
  const data = leads.map(({ activities, ...lead }) => ({
    ...lead,
    lastActivity: activities[0]?.createdAt ?? lead.updatedAt,
  }));
  return NextResponse.json({ data, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) });
});

export const POST = route(async (req) => {
  const data = pickFields(await readJson(req), LEAD_FIELDS, ["businessName"]);
  const lead = await createLead(data as Prisma.LeadUncheckedCreateInput);
  return NextResponse.json({ data: lead }, { status: 201 });
});
