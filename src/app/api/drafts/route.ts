import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { actor, asList, readJson, route } from "@/lib/api";
import { addDraft } from "@/lib/drafts";
import { ApiError } from "@/lib/validate";

// GET /api/drafts?status=draft|approved|failed|cancelled (default: draft)
export const GET = route(async (req) => {
  const status = new URL(req.url).searchParams.get("status") ?? "draft";
  const where: Prisma.EmailWhereInput = { direction: "outbound", status };
  const data = await prisma.email.findMany({
    where, orderBy: { createdAt: "asc" }, take: 500,
    include: { lead: { select: { id: true, businessName: true, email: true, stage: true } } },
  });
  return NextResponse.json({ data });
});

// POST /api/drafts  { leadId, type, subject, body } or an array / { "drafts": [...] } (max 200).
// Drafts wait in the Approval Queue until approved on the dashboard.
export const POST = route(async (req) => {
  const { list, single } = asList(await readJson(req), "drafts");
  if (list.length > 200) throw new ApiError(400, "Send at most 200 drafts per request");
  const by = actor(req);
  const results = [];
  for (const item of list) results.push(await addDraft(item, by));
  if (single) {
    const r = results[0];
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: /Do Not Contact/.test(r.error) ? 403 : /not found/i.test(r.error) ? 404 : 400 });
    return NextResponse.json({ data: await prisma.email.findUnique({ where: { id: r.id } }) }, { status: 201 });
  }
  const created = results.filter((r) => r.ok).length;
  return NextResponse.json({ created, rejected: results.length - created, results }, { status: created ? 201 : 200 });
});
