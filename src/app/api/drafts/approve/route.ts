import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJson, route } from "@/lib/api";
import { isDoNotContact } from "@/lib/services";
import { ApiError } from "@/lib/validate";

// POST /api/drafts/approve { "ids": [...] } or { "all": true }
// Approved emails are sent gradually by the scheduler. Do Not Contact is checked again at send time.
export const POST = route(async (req) => {
  const body = await readJson(req);
  const ids: string[] | null = Array.isArray(body.ids) ? body.ids.map(String) : null;
  if (!ids && body.all !== true) throw new ApiError(400, 'Pass "ids" or "all": true');
  const drafts = await prisma.email.findMany({
    where: { direction: "outbound", status: "draft", ...(ids ? { id: { in: ids } } : {}) },
    include: { lead: true },
  });
  let approved = 0;
  const skipped: { id: string; reason: string }[] = [];
  for (const d of drafts) {
    if (d.lead.stage === "Do Not Contact" || (await isDoNotContact(d.lead.email))) {
      await prisma.email.update({ where: { id: d.id }, data: { status: "cancelled", error: "Do Not Contact" } });
      skipped.push({ id: d.id, reason: "Do Not Contact" });
      continue;
    }
    await prisma.email.update({ where: { id: d.id }, data: { status: "approved", approvedAt: new Date(), error: "" } });
    approved++;
  }
  return NextResponse.json({ approved, skipped });
});
