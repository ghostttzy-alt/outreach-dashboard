"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, ExternalLink, Trash2 } from "lucide-react";
import { CLIENT_STATUSES } from "@/lib/constants";
import type { ClientDTO } from "@/lib/types";
import { cn, ensureUrl, formatMoney } from "@/lib/utils";
import { Card, EmptyState, PageHeader, api } from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { useToast } from "@/components/toast";

type Row = ClientDTO & {
  lead: { id: string; businessName: string; niche: string; city: string; website: string; sites: { liveUrl: string; status: string }[] };
};

const STATUS_STYLE: Record<string, string> = {
  active: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 ring-emerald-500/25",
  paused: "text-amber-700 dark:text-amber-300 bg-amber-500/10 ring-amber-500/30",
  cancelled: "text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 ring-zinc-500/20",
};

const cellInput = "w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm hover:border-border focus:border-accent focus:bg-panel focus:outline-none";

export function ClientsView({ clients }: { clients: Row[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();

  const oneTime = clients.filter((c) => c.status !== "cancelled").reduce((s, c) => s + c.setupPrice, 0);
  const mrr = clients.filter((c) => c.status === "active").reduce((s, c) => s + c.monthlyFee, 0);
  const active = clients.filter((c) => c.status === "active").length;

  const update = async (id: string, patch: Record<string, unknown>) => {
    try {
      await api(`/api/clients/${id}`, { method: "PATCH", body: patch });
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const remove = async (c: Row) => {
    const ok = await confirm({ title: `Remove ${c.lead.businessName} as a client?`, message: "The client record (pricing, start date, status) will be deleted. The lead stays." });
    if (!ok) return;
    await api(`/api/clients/${c.id}`, { method: "DELETE" });
    toast("Client removed");
    router.refresh();
  };

  const siteUrl = (c: Row) => c.lead.sites.find((s) => s.liveUrl)?.liveUrl || c.lead.website;

  return (
    <>
      <PageHeader title="Clients" description="Mark a lead as Won to add it here. Click a value to edit it." />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="One-time revenue" value={formatMoney(oneTime)} />
        <Stat label="Monthly recurring" value={`${formatMoney(mrr)}/mo`} />
        <Stat label="Annual run rate" value={formatMoney(mrr * 12)} />
        <Stat label="Active clients" value={`${active} of ${clients.length}`} />
      </div>

      <Card className="overflow-hidden">
        {clients.length === 0 ? (
          <EmptyState icon={<Briefcase className="size-6" />} title="No clients yet">Win your first lead to see it here.</EmptyState>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="px-4 py-2.5 font-medium">Business</th>
                  <th className="px-3 py-2.5 font-medium">Site</th>
                  <th className="px-3 py-2.5 font-medium">Setup</th>
                  <th className="px-3 py-2.5 font-medium">Monthly</th>
                  <th className="px-3 py-2.5 font-medium">Start date</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="w-10 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-panel-2/40">
                    <td className="px-4 py-2.5">
                      <Link href={`/leads/${c.lead.id}`} className="font-medium hover:underline">{c.lead.businessName}</Link>
                      <div className="text-xs text-muted">{c.lead.niche} · {c.lead.city}</div>
                    </td>
                    <td className="max-w-52 px-3 py-2.5">
                      {siteUrl(c) ? (
                        <a href={ensureUrl(siteUrl(c))} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-muted hover:text-fg">
                          <span className="truncate">{siteUrl(c).replace(/^https?:\/\//, "")}</span> <ExternalLink className="size-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-muted">Not live yet</span>
                      )}
                    </td>
                    <td className="w-32 px-1 py-1.5">
                      <MoneyInput value={c.setupPrice} onCommit={(v) => update(c.id, { setupPrice: v })} />
                    </td>
                    <td className="w-32 px-1 py-1.5">
                      <MoneyInput value={c.monthlyFee} onCommit={(v) => update(c.id, { monthlyFee: v })} />
                    </td>
                    <td className="w-40 px-1 py-1.5">
                      <input
                        type="date"
                        defaultValue={c.startDate.slice(0, 10)}
                        className={cellInput}
                        onBlur={(e) => e.target.value && e.target.value !== c.startDate.slice(0, 10) && update(c.id, { startDate: new Date(`${e.target.value}T12:00:00`).toISOString() })}
                        aria-label="Start date"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={c.status}
                        onChange={(e) => update(c.id, { status: e.target.value })}
                        className={cn("rounded-md px-1.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset focus:outline-none", STATUS_STYLE[c.status])}
                        aria-label="Status"
                      >
                        {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => remove(c)} className="rounded-md p-1.5 text-muted hover:bg-panel-2 hover:text-red-500" aria-label="Remove client">
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-panel-2/40 text-sm font-medium">
                  <td className="px-4 py-2.5" colSpan={2}>Totals <span className="font-normal text-muted">(excl. cancelled; MRR active only)</span></td>
                  <td className="px-3 py-2.5 tabular-nums">{formatMoney(oneTime)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatMoney(mrr)}/mo</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function MoneyInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
      <input
        type="number"
        min={0}
        step="1"
        defaultValue={value}
        className={cn(cellInput, "pl-5 tabular-nums")}
        onBlur={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n) && n !== value) onCommit(n);
        }}
        aria-label="Amount"
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1.5 text-xl font-semibold tabular-nums tracking-tight">{value}</p>
    </Card>
  );
}
