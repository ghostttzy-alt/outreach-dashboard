import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJson, route } from "@/lib/api";
import { publicOrigin } from "@/lib/gmail";
import { saveMockup } from "@/lib/mockups";
import { ApiError } from "@/lib/validate";

// GET /api/mockups?leadId=  (without the HTML)
export const GET = route(async (req) => {
  const leadId = new URL(req.url).searchParams.get("leadId");
  const data = await prisma.mockup.findMany({
    where: leadId ? { leadId } : {},
    select: { id: true, leadId: true, slug: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json({ data });
});

// POST /api/mockups { leadId, html, slug? }  → public link /preview/{slug}, saved on the lead
export const POST = route(async (req) => {
  const body = await readJson(req);
  if (typeof body.html !== "string") throw new ApiError(400, "html is required");
  const mockup = await saveMockup({ leadId: String(body.leadId ?? ""), html: body.html, slug: body.slug, origin: publicOrigin(req) });
  return NextResponse.json({ data: mockup }, { status: 201 });
});
