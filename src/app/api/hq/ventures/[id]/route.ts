import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const venture = await prisma.venture.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      tasks: { orderBy: { priority: "desc" } },
      items: { orderBy: { createdAt: "desc" } },
      revenues: { orderBy: { date: "desc" } },
      logs: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
  if (!venture) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: venture });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const venture = await prisma.venture.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.nextStep !== undefined && { nextStep: body.nextStep }),
      ...(body.description !== undefined && { description: body.description }),
    },
  });
  return NextResponse.json({ data: venture });
}
