import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [ventures, allRevenue, thisMonthRevenue, logs] = await Promise.all([
    prisma.venture.findMany({
      include: {
        tasks: { where: { done: false }, orderBy: { priority: "desc" } },
        _count: { select: { items: true, revenues: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.revenue.findMany({ where: { isMonthly: true } }),
    prisma.revenue.findMany({ where: { date: { gte: monthStart, lte: monthEnd } } }),
    prisma.hqLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { venture: { select: { name: true, slug: true } } },
    }),
  ]);

  const mrr = allRevenue.filter((r) => r.isMonthly).reduce((s, r) => s + r.amount, 0);
  const thisMonth = thisMonthRevenue.reduce((s, r) => s + r.amount, 0);

  const payingClients = await prisma.ventureItem.count({
    where: { type: "client", status: "active" },
  });

  const myTodos = await prisma.ventureTask.findMany({
    where: { owner: "me", done: false },
    include: { venture: { select: { name: true, slug: true } } },
    orderBy: { priority: "desc" },
    take: 10,
  });

  const ventureRevenues = await prisma.revenue.groupBy({
    by: ["ventureId"],
    where: { date: { gte: monthStart, lte: monthEnd } },
    _sum: { amount: true },
  });
  const revenueMap = Object.fromEntries(ventureRevenues.map((v) => [v.ventureId, v._sum.amount ?? 0]));

  return NextResponse.json({
    data: {
      thisMonth,
      mrr,
      payingClients,
      myTodos,
      ventures: ventures.map((v) => ({ ...v, thisMonthRevenue: revenueMap[v.id] ?? 0 })),
      logs,
    },
  });
}
