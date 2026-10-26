"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, Grid3x3, List, MapPinned, Plus, Trash2 } from "lucide-react";
import { cn, daysBetween, formatDate } from "@/lib/utils";
import { Button, Card, CardHeader, EmptyState, Field, Input, PageHeader, api } from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { useToast } from "@/components/toast";

type Row = { id: string; city: string; niche: string; searchedAt: string; leadsFound: number };

const norm = (s: string) => s.trim().toLowerCase();

/** Recency shading: one hue, stronger = searched more recently. */
function recencyClass(days: number) {
  if (days <= 7) return "bg-accent/35 text-fg";
  if (days <= 30) return "bg-accent/20 text-fg";
  if (days <= 90) return "bg-accent/10 text-muted";
  return "bg-panel-2 text-muted";
}

export function CoverageView({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ city: "", niche: "", searchedAt: today, leadsFound: "" });
  const [view, setView] = useState<"grid" | "list">("grid");

  // Latest search per city+niche.
  const latest = useMemo(() => {
    const m = new Map<string, Row & { count: number }>();
    for (const r of rows) {
      const k = `${norm(r.city)}|${norm(r.niche)}`;
      const prev = m.get(k);
      if (!prev) m.set(k, { ...r, count: 1 });
      else prev.count++;
    }
    return m;
  }, [rows]);

  const cities = useMemo(() => [...new Set(rows.map((r) => r.city))].sort(), [rows]);
  const niches = useMemo(() => [...new Set(rows.map((r) => r.niche))].sort(), [rows]);

  const match = form.city && form.niche ? latest.get(`${norm(form.city)}|${norm(form.niche)}`) : undefined;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api("/api/coverage", {
        method: "POST",
        body: { city: form.city, niche: form.niche, searchedAt: new Date(`${form.searchedAt}T12:00:00`).toISOString(), leadsFound: Number(form.leadsFound) || 0 },
      });
      toast(`Logged ${form.niche} in ${form.city}`);
      setForm({ ...form, niche: "", leadsFound: "" });
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const remove = async (r: Row) => {
    const ok = await confirm({ title: "Delete this search?", message: `${r.niche} in ${r.city} on ${formatDate(r.searchedAt)} will be removed from coverage history.` });
    if (!ok) return;
    await api(`/api/coverage/${r.id}`, { method: "DELETE" });
    toast("Deleted");
    router.refresh();
  };

  return (
    <>
      <PageHeader title="Coverage" description={`${latest.size} city + niche combinations searched across ${cities.length} cities`} />

      <Card className="mb-4">
        <CardHeader title="Log a search" description="Type a city and niche to check whether you've already covered it" />
        <form onSubmit={add} className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[1fr_1fr_10rem_8rem_auto] lg:items-end">
          <Field label="City">
            <Input list="cities" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Austin, TX" required />
          </Field>
          <Field label="Niche">
            <Input list="niches" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} placeholder="Plumber" required />
          </Field>
          <Field label="Searched on">
            <Input type="date" value={form.searchedAt} onChange={(e) => setForm({ ...form, searchedAt: e.target.value })} required />
          </Field>
          <Field label="Leads found">
            <Input type="number" min={0} value={form.leadsFound} onChange={(e) => setForm({ ...form, leadsFound: e.target.value })} placeholder="0" />
          </Field>
          <Button type="submit" variant="primary"><Plus className="size-4" /> Log</Button>
          <datalist id="cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
          <datalist id="niches">{niches.map((n) => <option key={n} value={n} />)}</datalist>
        </form>
        {match && (
          <p className="mx-4 mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm sm:mx-5">
            <AlertTriangle className="size-4 shrink-0 text-amber-500" />
            Already searched {match.niche} in {match.city} on {formatDate(match.searchedAt)} ({daysBetween(new Date(match.searchedAt), new Date())} days ago, {match.leadsFound} leads).
          </p>
        )}
      </Card>

      <Card>
        <CardHeader
          title={view === "grid" ? "City × niche" : "Search history"}
          description={view === "grid" ? "Darker = searched more recently" : `${rows.length} searches`}
          action={
            <div className="flex rounded-lg border border-border p-0.5">
              {(["grid", "list"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={cn("rounded-md p-1.5", view === v ? "bg-panel-2 text-fg" : "text-muted hover:text-fg")} aria-label={`${v} view`}>
                  {v === "grid" ? <Grid3x3 className="size-4" /> : <List className="size-4" />}
                </button>
              ))}
            </div>
          }
        />
        {rows.length === 0 ? (
          <EmptyState icon={<MapPinned className="size-6" />} title="No searches logged yet" />
        ) : view === "grid" ? (
          <div className="overflow-x-auto p-4 scrollbar-thin sm:p-5">
            <table className="border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-panel" />
                  {niches.map((n) => <th key={n} className="min-w-24 px-1 pb-1 text-left font-medium text-muted">{n}</th>)}
                </tr>
              </thead>
              <tbody>
                {cities.map((c) => (
                  <tr key={c}>
                    <th className="sticky left-0 z-10 whitespace-nowrap bg-panel pr-3 text-left font-medium">{c}</th>
                    {niches.map((n) => {
                      const r = latest.get(`${norm(c)}|${norm(n)}`);
                      if (!r) {
                        return (
                          <td key={n}>
                            <button
                              onClick={() => setForm({ ...form, city: c, niche: n })}
                              className="h-12 w-full rounded-md border border-dashed border-border text-muted/60 transition-colors hover:border-accent hover:text-fg"
                              title={`Not searched yet. Click to log ${n} in ${c}`}
                            >
                              —
                            </button>
                          </td>
                        );
                      }
                      const days = daysBetween(new Date(r.searchedAt), new Date());
                      return (
                        <td key={n}>
                          <div className={cn("flex h-12 flex-col justify-center rounded-md px-2", recencyClass(days))} title={`${n} in ${c}: last searched ${formatDate(r.searchedAt)}, ${r.leadsFound} leads, ${r.count} search(es)`}>
                            <span className="font-medium tabular-nums">{new Date(r.searchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            <span className="text-[10px] opacity-80">{r.leadsFound} leads</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="px-4 py-2.5 font-medium">City</th>
                  <th className="px-3 py-2.5 font-medium">Niche</th>
                  <th className="px-3 py-2.5 font-medium">Searched</th>
                  <th className="px-3 py-2.5 font-medium">Leads found</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-panel-2/40">
                    <td className="px-4 py-2.5">{r.city}</td>
                    <td className="px-3 py-2.5">{r.niche}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted">{formatDate(r.searchedAt)}</td>
                    <td className="px-3 py-2.5 tabular-nums">{r.leadsFound}</td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => remove(r)} className="rounded-md p-1.5 text-muted hover:bg-panel-2 hover:text-red-500" aria-label="Delete">
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
