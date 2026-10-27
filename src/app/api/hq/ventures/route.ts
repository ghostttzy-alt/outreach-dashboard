import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const ventures = await prisma.venture.findMany({
    include: {
      tasks: { orderBy: { priority: "desc" } },
      items: { orderBy: { createdAt: "desc" } },
      revenues: { orderBy: { date: "desc" } },
      logs: { orderBy: { createdAt: "desc" }, take: 10 },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ data: ventures });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { slug, name, description, status, nextStep } = body;
  if (!slug || !name) return NextResponse.json({ error: "slug and name required" }, { status: 400 });
  const venture = await prisma.venture.create({
    data: { slug, name, description: description ?? "", status: status ?? "Not started", nextStep: nextStep ?? "" },
  });
  return NextResponse.json({ data: venture }, { status: 201 });
}
