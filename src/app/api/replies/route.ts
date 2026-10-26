import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { route } from "@/lib/api";
import { stripQuoted } from "@/lib/replies";

// GET /api/replies?category=Unclassified&leadId=&limit=
export const GET = route(async (req) => {
  const sp = new URL(req.url).searchParams;
  const where: Prisma.EmailWhereInput = { direction: "inbound" };
  if (sp.get("category")) where.category = sp.get("category")!;
  if (sp.get("leadId")) where.leadId = sp.get("leadId")!;
  const take = Math.min(Number(sp.get("limit")) || 100, 500);
  const replies = await prisma.email.findMany({
    where, take, orderBy: { sentAt: "desc" },
    include: { lead: { select: { id: true, businessName: true, email: true, stage: true } } },
  });
  return NextResponse.json({ data: replies.map((r) => ({ ...r, text: stripQuoted(r.body) })) });
});
