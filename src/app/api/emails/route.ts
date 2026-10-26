import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { readJson, route } from "@/lib/api";
import { createEmail } from "@/lib/services";
import { EMAIL_FIELDS, pickFields } from "@/lib/validate";

// GET /api/emails?leadId=&status=&direction=&type=&limit=
export const GET = route(async (req) => {
  const sp = new URL(req.url).searchParams;
  const where: Prisma.EmailWhereInput = {};
  for (const f of ["leadId", "status", "direction", "type"] as const) {
    const v = sp.get(f);
    if (v) where[f] = v;
  }
  const take = Math.min(Number(sp.get("limit")) || 500, 2000);
  const data = await prisma.email.findMany({
    where, take, orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
    include: { lead: { select: { id: true, businessName: true, stage: true } } },
  });
  return NextResponse.json({ data });
});

// Outbound emails to Do Not Contact leads are rejected with 403.
// Sending an email (status other than draft) advances the lead's stage and logs activity.
export const POST = route(async (req) => {
  const data = pickFields(await readJson(req), EMAIL_FIELDS, ["leadId"]);
  const email = await createEmail(data as Prisma.EmailUncheckedCreateInput);
  return NextResponse.json({ data: email }, { status: 201 });
});
