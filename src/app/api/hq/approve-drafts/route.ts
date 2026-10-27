import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/hq/approve-drafts  { ids: ["id1","id2"] } or { all: true }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const now = new Date();

  let ids: string[] = [];

  if (body.all === true) {
    const drafts = await prisma.email.findMany({
      where: { direction: "outbound", status: "draft" },
      select: { id: true },
    });
    ids = drafts.map((d) => d.id);
  } else if (Array.isArray(body.ids)) {
    ids = body.ids;
  } else {
    return NextResponse.json({ error: "Provide ids array or all:true" }, { status: 400 });
  }

  if (ids.length === 0) return NextResponse.json({ data: { approved: 0 } });

  const result = await prisma.email.updateMany({
    where: { id: { in: ids }, status: "draft" },
    data: { status: "approved", approvedAt: now },
  });

  return NextResponse.json({ data: { approved: result.count } });
}
