import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ventureId = req.nextUrl.searchParams.get("ventureId");
  const revenues = await prisma.revenue.findMany({
    where: ventureId ? { ventureId } : {},
    include: { venture: { select: { name: true, slug: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ data: revenues });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ventureId, amount, isMonthly, client, note, date } = body;
  if (!ventureId || amount == null) return NextResponse.json({ error: "ventureId and amount required" }, { status: 400 });
  const revenue = await prisma.revenue.create({
    data: {
      ventureId,
      amount: Number(amount),
      isMonthly: isMonthly ?? false,
      client: client ?? "",
      note: note ?? "",
      date: date ? new Date(date) : new Date(),
    },
  });
  return NextResponse.json({ data: revenue }, { status: 201 });
}
