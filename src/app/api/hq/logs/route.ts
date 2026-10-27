import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? "50");
  const logs = await prisma.hqLog.findMany({
    take: Math.min(limit, 200),
    orderBy: { createdAt: "desc" },
    include: { venture: { select: { name: true, slug: true } } },
  });
  return NextResponse.json({ data: logs });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ventureId, project, note } = body;
  if (!note) return NextResponse.json({ error: "note required" }, { status: 400 });
  const log = await prisma.hqLog.create({
    data: { ventureId: ventureId ?? null, project: project ?? "", note },
  });
  return NextResponse.json({ data: log }, { status: 201 });
}
