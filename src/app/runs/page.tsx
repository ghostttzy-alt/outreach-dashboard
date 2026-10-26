import { Bot } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

function label(key: string) {
  return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export default async function RunsPage() {
  const runs = await prisma.run.findMany({ orderBy: { startedAt: "desc" }, take: 60 });
  return (
    <>
      <PageHeader title="Runs" description="Reports from the daily Claude session" />
      {runs.length === 0 ? (
        <Card><EmptyState icon={<Bot className="size-6" />} title="No runs yet">The daily session reports here with POST /api/runs when it finishes.</EmptyState></Card>
      ) : (
        <div className="space-y-3">
          {runs.map((r) => {
            const counts = (r.counts && typeof r.counts === "object" && !Array.isArray(r.counts) ? r.counts : {}) as Record<string, unknown>;
            const errors = Array.isArray(r.errors) ? r.errors : [];
            return (
              <Card key={r.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{formatDateTime(r.startedAt)}</span>
                  <span className="text-xs text-muted">{timeAgo(r.startedAt)}</span>
                  <Badge color={r.status === "ok" ? "green" : r.status === "partial" ? "amber" : "red"} className="ml-auto capitalize">{r.status}</Badge>
                </div>
                {Object.keys(counts).length > 0 && (
                  <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {Object.entries(counts).map(([k, v]) => (
                      <div key={k} className="rounded-lg border border-border px-3 py-2">
                        <dt className="truncate text-[11px] text-muted">{label(k)}</dt>
                        <dd className="text-lg font-semibold tabular-nums">{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {r.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{r.notes}</p>}
                {errors.length > 0 && (
                  <ul className="mt-3 space-y-1 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
                    {errors.map((e, i) => <li key={i}>{typeof e === "string" ? e : JSON.stringify(e)}</li>)}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
