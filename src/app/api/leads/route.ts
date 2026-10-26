import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { actor, asList, readJson, route } from "@/lib/api";
import { leadQueryFromParams } from "@/lib/leadQuery";
import { addLead } from "@/lib/leads";
import { ApiError } from "@/lib/validate";

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

// POST /api/leads  one lead object, or an array / { "leads": [...] } for bulk (max 200).
// Duplicates (same email, same name+city, or same website), Do Not Contact addresses and
// blocklisted chains are rejected.
export const POST = route(async (req) => {
  const { list, single } = asList(await readJson(req), "leads");
  if (list.length > 200) throw new ApiError(400, "Send at most 200 leads per request");
  const by = actor(req);
  const results = [];
  for (const item of list) results.push(await addLead(item, by));

  if (single) {
    const r = results[0];
    if (r.ok) return NextResponse.json({ data: await prisma.lead.findUnique({ where: { id: r.id } }) }, { status: 201 });
    const status = r.reason === "duplicate" ? 409 : r.reason === "do_not_contact" ? 403 : r.reason === "chain" ? 422 : 400;
    return NextResponse.json({ error: r.error, reason: r.reason, matches: r.matches }, { status });
  }
  const created = results.filter((r) => r.ok).length;
  return NextResponse.json({ created, rejected: results.length - created, results }, { status: created ? 201 : 200 });
});
