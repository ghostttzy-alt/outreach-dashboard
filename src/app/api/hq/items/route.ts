import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ventureId = req.nextUrl.searchParams.get("ventureId");
  const type = req.nextUrl.searchParams.get("type");
  const items = await prisma.ventureItem.findMany({
    where: {
      ...(ventureId ? { ventureId } : {}),
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ventureId, type, title, url, status, details } = body;
  if (!ventureId || !title) return NextResponse.json({ error: "ventureId and title required" }, { status: 400 });
  const item = await prisma.ventureItem.create({
    data: {
      ventureId,
      type: type ?? "other",
      title,
      url: url ?? "",
      status: status ?? "active",
      details: details ?? {},
    },
  });
  return NextResponse.json({ data: item }, { status: 201 });
}
