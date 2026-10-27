import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Circle, TrendingUp, Users, DollarSign, ArrowRight, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  "Not started": "text-[#8a8a8a]",
  "Setting up": "text-yellow-400",
  Live: "text-blue-400",
  Earning: "text-[#3ddc97]",
};

const STATUS_DOT: Record<string, string> = {
  "Not started": "bg-[#2a2a2a]",
  "Setting up": "bg-yellow-400",
  Live: "bg-blue-400",
  Earning: "bg-[#3ddc97]",
};

function fmt(n: number) {
  return n === 0 ? "$0" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default async function HqPage() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [ventures, allRevenue, thisMonthRevenue, myTodos, logs] = await Promise.all([
    prisma.venture.findMany({
      include: {
        tasks: { where: { done: false, owner: "me" }, orderBy: { priority: "desc" }, take: 1 },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.revenue.findMany({ where: { isMonthly: true } }),
    prisma.revenue.findMany({ where: { date: { gte: monthStart, lte: monthEnd } } }),
    prisma.ventureTask.findMany({
      where: { owner: "me", done: false },
      include: { venture: { select: { name: true, slug: true } } },
      orderBy: { priority: "desc" },
      take: 8,
    }),
    prisma.hqLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { venture: { select: { name: true, slug: true } } },
    }),
  ]);

  const mrr = allRevenue.reduce((s, r) => s + r.amount, 0);
  const thisMonth = thisMonthRevenue.reduce((s, r) => s + r.amount, 0);
  const payingClients = await prisma.ventureItem.count({ where: { type: "client", status: "active" } });

  const ventureRevMap: Record<string, number> = {};
  for (const r of thisMonthRevenue) {
    ventureRevMap[r.ventureId] = (ventureRevMap[r.ventureId] ?? 0) + r.amount;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-medium tracking-widest text-[#8a8a8a] uppercase">Ghosttt · HQ</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Command Center</h1>
        <p className="mt-1 text-sm text-[#8a8a8a]">{format(now, "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-4 transition-all hover:border-[#2a2a2a]">
          <div className="flex items-center gap-2 text-xs text-[#8a8a8a]">
            <DollarSign className="size-3.5" /> This month
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-[#3ddc97]">{fmt(thisMonth)}</div>
          <div className="mt-1 text-xs text-[#8a8a8a]">earned so far</div>
        </div>
        <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-4 transition-all hover:border-[#2a2a2a]">
          <div className="flex items-center gap-2 text-xs text-[#8a8a8a]">
            <TrendingUp className="size-3.5" /> Monthly recurring
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-white">{fmt(mrr)}</div>
          <div className="mt-1 text-xs text-[#8a8a8a]">per month</div>
        </div>
        <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-4 transition-all hover:border-[#2a2a2a]">
          <div className="flex items-center gap-2 text-xs text-[#8a8a8a]">
            <Users className="size-3.5" /> Paying clients
          </div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-white">{payingClients}</div>
          <div className="mt-1 text-xs text-[#8a8a8a]">active</div>
        </div>
      </div>

      {/* My To-Do */}
      {myTodos.length > 0 && (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-5">
          <h2 className="mb-4 text-sm font-semibold">Your to-do</h2>
          <ul className="space-y-2">
            {myTodos.map((t) => (
              <li key={t.id} className="flex items-start gap-3">
                <Circle className="mt-0.5 size-4 shrink-0 text-[#2a2a2a]" />
                <div>
                  <p className="text-sm">{t.title}</p>
                  {t.venture && (
                    <Link href={`/hq/${t.venture.slug}`} className="text-xs text-[#8a8a8a] hover:text-[#3ddc97]">
                      {t.venture.name}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Project Cards */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Projects</h2>
          <Link href="/hq/revenue" className="text-xs text-[#8a8a8a] hover:text-white">
            Revenue →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ventures.map((v) => (
            <Link
              key={v.id}
              href={`/hq/${v.slug}`}
              className="group rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-4 transition-all hover:border-[#3ddc97]/30 hover:shadow-[0_0_20px_rgba(61,220,151,0.05)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${STATUS_DOT[v.status] ?? "bg-[#2a2a2a]"}`} />
                  <span className={`text-xs font-medium ${STATUS_COLOR[v.status] ?? "text-[#8a8a8a]"}`}>{v.status}</span>
                </div>
                <ArrowRight className="size-3.5 text-[#2a2a2a] transition-colors group-hover:text-[#8a8a8a]" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{v.name}</h3>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-[#8a8a8a]">{fmt(ventureRevMap[v.id] ?? 0)} this month</span>
              </div>
              {v.nextStep && (
                <p className="mt-2 text-xs text-[#8a8a8a] line-clamp-1">Next: {v.nextStep}</p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* What Claude Did Log */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a]">
          <div className="border-b border-[#1f1f1f] px-5 py-3">
            <h2 className="text-sm font-semibold">What Claude did</h2>
          </div>
          <ul className="divide-y divide-[#1f1f1f]">
            {logs.map((l) => (
              <li key={l.id} className="flex gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{l.note}</p>
                  <p className="mt-0.5 text-xs text-[#8a8a8a]">
                    {l.venture?.name ?? l.project} · {format(l.createdAt, "MMM d, h:mm a")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {logs.length === 0 && myTodos.length === 0 && (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] px-5 py-10 text-center">
          <p className="text-sm text-[#8a8a8a]">Night 1 — HQ is live. Claude is building your projects now.</p>
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        <a
          href="/api/hq/leads-export"
          className="flex items-center gap-1.5 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 text-xs text-[#8a8a8a] transition-colors hover:border-[#2a2a2a] hover:text-white"
        >
          <ExternalLink className="size-3" /> Export leads CSV
        </a>
        <Link
          href="/care"
          target="_blank"
          className="flex items-center gap-1.5 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 text-xs text-[#8a8a8a] transition-colors hover:border-[#2a2a2a] hover:text-white"
        >
          <ExternalLink className="size-3" /> Care plan page (/care)
        </Link>
        <Link
          href="/hq/revenue"
          className="flex items-center gap-1.5 rounded-lg border border-[#1f1f1f] bg-[#0a0a0a] px-3 py-2 text-xs text-[#8a8a8a] transition-colors hover:border-[#2a2a2a] hover:text-white"
        >
          <DollarSign className="size-3" /> Log revenue
        </Link>
      </div>
    </div>
  );
}
