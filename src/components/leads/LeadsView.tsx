"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Kanban, Plus, Search, Table2, Upload, X } from "lucide-react";
import { STAGES, WEBSITE_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button, Input, PageHeader, Select, api } from "@/components/ui";
import { LeadsTable } from "./LeadsTable";
import { LeadsBoard } from "./LeadsBoard";
import { AddLeadModal } from "./AddLeadModal";
import { ImportModal } from "./ImportModal";
import type { Filters, LeadRow } from "./types";

type ListResponse = { data: LeadRow[]; total: number; page: number; pages: number };
const FILTER_KEYS: (keyof Filters)[] = ["q", "stage", "niche", "city", "websiteStatus", "minScore"];

export function LeadsView({ niches, cities }: { niches: string[]; cities: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const view = sp.get("view") === "board" ? "board" : "table";
  const filters: Filters = useMemo(
    () => Object.fromEntries(FILTER_KEYS.map((k) => [k, sp.get(k) ?? ""])) as Filters,
    [sp],
  );
  const sort = sp.get("sort") ?? "updatedAt";
  const order = sp.get("order") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(sp.get("page")) || 1);

  const [search, setSearch] = useState(filters.q);
  const [result, setResult] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      if (!("page" in patch)) next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [sp, router, pathname],
  );

  // Keep the box in sync when the top-bar search navigates here.
  useEffect(() => setSearch(filters.q), [filters.q]);
  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setParams({ q: search || null }), 250);
    return () => clearTimeout(t);
  }, [search, filters.q, setParams]);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    for (const k of FILTER_KEYS) if (filters[k]) p.set(k, filters[k]);
    p.set("sort", sort);
    p.set("order", order);
    if (view === "board") p.set("pageSize", "500");
    else p.set("page", String(page));
    return p.toString();
  }, [filters, sort, order, page, view]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResult(await api<ListResponse>(`/api/leads?${query}`));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const activeFilters = FILTER_KEYS.filter((k) => k !== "q" && filters[k]).length;
  const exportHref = `/api/export?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString()}`;

  return (
    <>
      <PageHeader
        title="Leads"
        description={result ? `${result.total} ${result.total === 1 ? "company" : "companies"}${activeFilters || filters.q ? " match" : ""}` : "Loading…"}
        actions={
          <>
            <Button variant="secondary" onClick={() => setImporting(true)}>
              <Upload className="size-4" /> Import
            </Button>
            <a href={exportHref}>
              <Button variant="secondary">
                <Download className="size-4" /> Export
              </Button>
            </a>
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Plus className="size-4" /> Add lead
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative lg:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads…" className="pl-9" aria-label="Search leads" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-1">
          <Select value={filters.stage} onChange={(e) => setParams({ stage: e.target.value || null })} aria-label="Filter by stage" className="lg:w-auto">
            <option value="">All stages</option>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select value={filters.niche} onChange={(e) => setParams({ niche: e.target.value || null })} aria-label="Filter by niche" className="lg:w-auto">
            <option value="">All niches</option>
            {niches.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select value={filters.city} onChange={(e) => setParams({ city: e.target.value || null })} aria-label="Filter by city" className="lg:w-auto">
            <option value="">All cities</option>
            {cities.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select value={filters.websiteStatus} onChange={(e) => setParams({ websiteStatus: e.target.value || null })} aria-label="Filter by website status" className="lg:w-auto">
            <option value="">Any website</option>
            {WEBSITE_STATUSES.map((s) => <option key={s} value={s}>{s === "None" ? "No site" : s}</option>)}
          </Select>
          <Select value={filters.minScore} onChange={(e) => setParams({ minScore: e.target.value || null })} aria-label="Minimum score" className="lg:w-auto">
            <option value="">Any score</option>
            {[5, 4, 3, 2].map((n) => <option key={n} value={n}>{n === 5 ? "Score 5" : `Score ${n}+`}</option>)}
          </Select>
          {activeFilters > 0 && (
            <Button variant="ghost" onClick={() => setParams({ stage: null, niche: null, city: null, websiteStatus: null, minScore: null })}>
              <X className="size-4" /> Clear
            </Button>
          )}
        </div>
        <div className="flex rounded-lg border border-border bg-panel p-0.5 lg:ml-auto">
          {(["table", "board"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setParams({ view: v === "table" ? null : v })}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                view === v ? "bg-panel-2 font-medium text-fg" : "text-muted hover:text-fg",
              )}
            >
              {v === "table" ? <Table2 className="size-4" /> : <Kanban className="size-4" />}
              {v === "table" ? "Table" : "Board"}
            </button>
          ))}
        </div>
      </div>

      {view === "table" ? (
        <LeadsTable
          result={result}
          loading={loading}
          sort={sort}
          order={order}
          onSort={(field) => setParams({ sort: field, order: sort === field && order === "asc" ? "desc" : "asc" })}
          onPage={(p) => setParams({ page: String(p) })}
          reload={load}
        />
      ) : (
        <LeadsBoard leads={result?.data ?? []} loading={loading} reload={load} />
      )}

      <AddLeadModal open={adding} onClose={() => setAdding(false)} onCreated={load} />
      <ImportModal open={importing} onClose={() => setImporting(false)} onImported={load} />
    </>
  );
}
