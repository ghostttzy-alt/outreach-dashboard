import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return n === 0 ? "$0" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const ITEM_STATUS_COLOR: Record<string, string> = {
  active: "text-[#3ddc97]",
  done: "text-[#8a8a8a] line-through",
  paused: "text-yellow-400",
  dropped: "text-red-400",
};

export default async function VentureDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const venture = await prisma.venture.findUnique({
    where: { slug },
    include: {
      tasks: { orderBy: [{ owner: "asc" }, { priority: "desc" }] },
      items: { orderBy: { createdAt: "desc" } },
      revenues: { orderBy: { date: "desc" }, take: 50 },
      logs: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });

  if (!venture) notFound();

  const totalRevenue = venture.revenues.reduce((s, r) => s + r.amount, 0);
  const mrr = venture.revenues.filter((r) => r.isMonthly).reduce((s, r) => s + r.amount, 0);

  const claudeTasks = venture.tasks.filter((t) => t.owner === "claude");
  const myTasks = venture.tasks.filter((t) => t.owner === "me");

  const clients = venture.items.filter((i) => i.type === "client");
  const products = venture.items.filter((i) => i.type === "product");
  const videos = venture.items.filter((i) => i.type === "video");
  const agencies = venture.items.filter((i) => i.type === "agency");
  const prospects = venture.items.filter((i) => i.type === "prospect");
  const other = venture.items.filter((i) => !["client", "product", "video", "agency", "prospect"].includes(i.type));

  const pipelines = [
    { label: "Clients", items: clients },
    { label: "Products", items: products },
    { label: "Videos", items: videos },
    { label: "Agencies", items: agencies },
    { label: "Prospects", items: prospects },
    { label: "Other", items: other },
  ].filter((p) => p.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/hq" className="mb-3 flex items-center gap-1.5 text-xs text-[#8a8a8a] hover:text-white">
          <ArrowLeft className="size-3.5" /> Back to HQ
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{venture.name}</h1>
            {venture.description && <p className="mt-1 text-sm text-[#8a8a8a]">{venture.description}</p>}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-bold text-[#3ddc97]">{fmt(totalRevenue)}</div>
            {mrr > 0 && <div className="text-xs text-[#8a8a8a]">{fmt(mrr)}/mo recurring</div>}
          </div>
        </div>
        {venture.nextStep && (
          <div className="mt-3 rounded-lg border border-[#3ddc97]/20 bg-[#3ddc97]/5 px-3 py-2 text-sm text-[#3ddc97]">
            Next: {venture.nextStep}
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">Your tasks</h2>
          {myTasks.length === 0 ? (
            <p className="text-xs text-[#8a8a8a]">Nothing for you right now.</p>
          ) : (
            <ul className="space-y-2">
              {myTasks.map((t) => (
                <li key={t.id} className="flex items-start gap-2.5">
                  {t.done ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#3ddc97]" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-[#2a2a2a]" />
                  )}
                  <span className={`text-sm ${t.done ? "text-[#8a8a8a] line-through" : ""}`}>{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-4">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8a8a8a]">Claude&apos;s tasks</h2>
          {claudeTasks.length === 0 ? (
            <p className="text-xs text-[#8a8a8a]">Nothing queued.</p>
          ) : (
            <ul className="space-y-2">
              {claudeTasks.map((t) => (
                <li key={t.id} className="flex items-start gap-2.5">
                  {t.done ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#3ddc97]" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-[#2a2a2a]" />
                  )}
                  <span className={`text-sm ${t.done ? "text-[#8a8a8a] line-through" : ""}`}>{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Pipeline sections */}
      {pipelines.map(({ label, items }) => (
        <div key={label} className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a]">
          <div className="border-b border-[#1f1f1f] px-5 py-3">
            <h2 className="text-sm font-semibold">{label}</h2>
          </div>
          <ul className="divide-y divide-[#1f1f1f]">
            {items.map((item) => {
              const d = item.details as Record<string, string> | null;
              return (
                <li key={item.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${ITEM_STATUS_COLOR[item.status] ?? ""}`}>{item.title}</span>
                      </div>
                      {d && Object.keys(d).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-3">
                          {Object.entries(d)
                            .filter(([, v]) => v)
                            .map(([k, v]) => (
                              <span key={k} className="text-xs text-[#8a8a8a]">
                                {k}: {v}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                    {item.url && (
                      <a
                        href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 text-xs text-[#8a8a8a] hover:text-[#3ddc97]"
                      >
                        Visit →
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {/* Revenue log */}
      {venture.revenues.length > 0 && (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a]">
          <div className="flex items-center justify-between border-b border-[#1f1f1f] px-5 py-3">
            <h2 className="text-sm font-semibold">Revenue</h2>
            <Link href="/hq/revenue" className="text-xs text-[#8a8a8a] hover:text-white">
              Add →
            </Link>
          </div>
          <ul className="divide-y divide-[#1f1f1f]">
            {venture.revenues.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm">{r.note || r.client || "—"}</p>
                  <p className="text-xs text-[#8a8a8a]">{format(r.date, "MMM d, yyyy")} {r.isMonthly ? "· monthly" : ""}</p>
                </div>
                <span className="text-sm font-semibold text-[#3ddc97]">{fmt(r.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Log */}
      {venture.logs.length > 0 && (
        <div className="rounded-xl border border-[#1f1f1f] bg-[#0a0a0a]">
          <div className="border-b border-[#1f1f1f] px-5 py-3">
            <h2 className="text-sm font-semibold">Activity log</h2>
          </div>
          <ul className="divide-y divide-[#1f1f1f]">
            {venture.logs.map((l) => (
              <li key={l.id} className="px-5 py-3">
                <p className="text-sm">{l.note}</p>
                <p className="mt-0.5 text-xs text-[#8a8a8a]">{format(l.createdAt, "MMM d, h:mm a")}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
