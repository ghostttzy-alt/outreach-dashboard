import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJson, route } from "@/lib/api";
import { STAGES } from "@/lib/constants";
import { updateLead } from "@/lib/services";
import { ApiError } from "@/lib/validate";

// POST /api/leads/bulk  { "ids": [...], "action": "stage", "stage": "Contacted" } | { "ids": [...], "action": "delete" }
export const POST = route(async (req) => {
  const body = await readJson(req);
  const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
  if (!ids.length) throw new ApiError(400, "ids must be a non-empty array");

  if (body.action === "stage") {
    if (!STAGES.includes(body.stage)) throw new ApiError(400, `stage must be one of: ${STAGES.join(", ")}`);
    for (const id of ids) await updateLead(id, { stage: body.stage });
    return NextResponse.json({ ok: true, updated: ids.length });
  }
  if (body.action === "delete") {
    const [, result] = await prisma.$transaction([
      prisma.activity.deleteMany({ where: { leadId: { in: ids } } }),
      prisma.lead.deleteMany({ where: { id: { in: ids } } }),
    ]);
    return NextResponse.json({ ok: true, deleted: result.count });
  }
  throw new ApiError(400, 'action must be "stage" or "delete"');
});
