"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, Trash2, Users } from "lucide-react";
import { STAGES } from "@/lib/constants";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { Button, Card, EmptyState, Score, Select, StageBadge, WebsiteBadge, api } from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { useToast } from "@/components/toast";
import type { LeadRow } from "./types";

type Props = {
  result: { data: LeadRow[]; total: number; page: number; pages: number } | null;
  loading: boolean;
  sort: string;
  order: "asc" | "desc";
  onSort: (field: string) => void;
  onPage: (page: number) => void;
  reload: () => void;
};

const COLUMNS: { key: string; label: string; sortable?: boolean; className?: string }[] = [
  { key: "businessName", label: "Business", sortable: true, className: "min-w-48" },
  { key: "niche", label: "Niche", sortable: true },
  { key: "city", label: "City", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "website", label: "Website", sortable: true },
  { key: "websiteStatus", label: "Site status", sortable: true },
  { key: "mainProblem", label: "Main problem", className: "min-w-56" },
  { key: "score", label: "Score", sortable: true },
  { key: "stage", label: "Stage", sortable: true },
  { key: "dateContacted", label: "Contacted", sortable: true },
  { key: "updatedAt", label: "Last activity", sortable: true },
];

export function LeadsTable({ result, loading, sort, order, onSort, onPage, reload }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const rows = result?.data ?? [];

  useEffect(() => setSelected(new Set()), [result]);

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const bulkStage = async (stage: string) => {
    if (!stage) return;
    await api("/api/leads/bulk", { method: "POST", body: { ids: [...selected], action: "stage", stage } });
    toast(`Moved ${selected.size} lead(s) to ${stage}`);
    reload();
  };

  const bulkDelete = async () => {
    const ok = await confirm({
      title: `Delete ${selected.size} lead${selected.size === 1 ? "" : "s"}?`,
      message: "Their emails, sites, client records and activity will be deleted too. This can't be undone.",
    });
    if (!ok) return;
    await api("/api/leads/bulk", { method: "POST", body: { ids: [...selected], action: "delete" } });
    toast(`Deleted ${selected.size} lead(s)`);
    reload();
  };

  return (
    <Card className="overflow-hidden">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-panel-2 px-4 py-2.5">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Select className="h-8 w-auto text-xs" defaultValue="" onChange={(e) => { bulkStage(e.target.value); e.target.value = ""; }} aria-label="Change stage">
            <option value="" disabled>Change stage…</option>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <a href={`/api/export?ids=${[...selected].join(",")}`}>
            <Button size="sm"><Download className="size-3.5" /> Export CSV</Button>
          </a>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500" onClick={bulkDelete}>
            <Trash2 className="size-3.5" /> Delete
          </Button>
          <button className="ml-auto text-xs text-muted hover:text-fg" onClick={() => setSelected(new Set())}>Clear selection</button>
        </div>
      )}

      <div className={cn("overflow-x-auto scrollbar-thin transition-opacity", loading && "opacity-60")}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="w-10 px-4 py-2.5">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all" className="size-4 accent-[var(--accent)]" />
              </th>
              {COLUMNS.map((c) => (
                <th key={c.key} className={cn("whitespace-nowrap px-3 py-2.5 font-medium", c.className)}>
                  {c.sortable ? (
                    <button onClick={() => onSort(c.key)} className="inline-flex items-center gap-1 hover:text-fg">
                      {c.label}
                      {sort === c.key ? (
                        order === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((l) => {
              const dnc = l.stage === "Do Not Contact";
              return (
                <tr
                  key={l.id}
                  onClick={() => router.push(`/leads/${l.id}`)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-panel-2/60",
                    selected.has(l.id) && "bg-panel-2/60",
                    dnc && "bg-red-500/[0.04] shadow-[inset_3px_0_0_0_rgb(220,38,38)]",
                  )}
                >
                  <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} aria-label={`Select ${l.businessName}`} className="size-4 accent-[var(--accent)]" />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/leads/${l.id}`} className={cn("font-medium hover:underline", dnc && "text-muted line-through decoration-red-500/60")} onClick={(e) => e.stopPropagation()}>
                      {l.businessName}
                    </Link>
                    {l.contactName && <div className="text-xs text-muted">{l.contactName}</div>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">{l.niche}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">{l.city}</td>
                  <td className="max-w-48 truncate px-3 py-2.5 text-muted">{l.email || "—"}</td>
                  <td className="max-w-40 truncate px-3 py-2.5 text-muted">{l.website || "—"}</td>
                  <td className="px-3 py-2.5"><WebsiteBadge status={l.websiteStatus} /></td>
                  <td className="max-w-64 px-3 py-2.5 text-muted"><span className="line-clamp-2">{l.mainProblem || "—"}</span></td>
                  <td className="px-3 py-2.5"><Score value={l.score} /></td>
                  <td className="px-3 py-2.5"><StageBadge stage={l.stage} /></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">{formatDate(l.dateContacted)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted">{timeAgo(l.lastActivity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <EmptyState icon={<Users className="size-6" />} title="No leads found">
            Try clearing filters, or add a lead.
          </EmptyState>
        )}
      </div>

      {result && result.pages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted">
          <span>
            Page {result.page} of {result.pages} · {result.total} leads
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" disabled={result.page <= 1} onClick={() => onPage(result.page - 1)} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </Button>
            <Button size="sm" variant="secondary" disabled={result.page >= result.pages} onClick={() => onPage(result.page + 1)} aria-label="Next page">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
