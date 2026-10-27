import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ventureId = req.nextUrl.searchParams.get("ventureId");
  const owner = req.nextUrl.searchParams.get("owner");
  const tasks = await prisma.ventureTask.findMany({
    where: {
      ...(ventureId ? { ventureId } : {}),
      ...(owner ? { owner } : {}),
    },
    include: { venture: { select: { name: true, slug: true } } },
    orderBy: { priority: "desc" },
  });
  return NextResponse.json({ data: tasks });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ventureId, owner, title, priority } = body;
  if (!ventureId || !title) return NextResponse.json({ error: "ventureId and title required" }, { status: 400 });
  const task = await prisma.ventureTask.create({
    data: { ventureId, owner: owner ?? "claude", title, priority: priority ?? 0 },
  });
  return NextResponse.json({ data: task }, { status: 201 });
}
