"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Eye, Globe, Pencil, Plus, Trash2 } from "lucide-react";
import { SITE_STATUSES } from "@/lib/constants";
import type { SiteDTO } from "@/lib/types";
import { cn, ensureUrl, formatDate } from "@/lib/utils";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, api } from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { useToast } from "@/components/toast";
import { MockupPreview } from "@/components/lead/LeadDetail";

type SiteRow = SiteDTO & { lead: { id: string; businessName: string; niche: string; city: string } };
const STATUS_COLOR: Record<string, string> = { Mockup: "fuchsia", "In Progress": "amber", Live: "green" };
const GRADIENTS = [
  "from-indigo-500/20 to-sky-500/10", "from-fuchsia-500/20 to-rose-500/10", "from-emerald-500/20 to-teal-500/10",
  "from-amber-500/20 to-orange-500/10", "from-violet-500/20 to-indigo-500/10",
];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function Thumbnail({ site }: { site: SiteRow }) {
  if (site.thumbnailUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={site.thumbnailUrl} alt={`${site.lead.businessName} screenshot`} className="h-full w-full object-cover object-top" />;
  }
  const initials = site.lead.businessName.split(/\s+/).filter((w) => /[a-z]/i.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className={cn("flex h-full w-full flex-col bg-gradient-to-br p-3", GRADIENTS[hash(site.lead.businessName) % GRADIENTS.length])}>
      <div className="flex gap-1">
        <span className="size-1.5 rounded-full bg-fg/20" /><span className="size-1.5 rounded-full bg-fg/20" /><span className="size-1.5 rounded-full bg-fg/20" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
        <span className="text-3xl font-bold tracking-tight text-fg/70">{initials}</span>
        <span className="h-1.5 w-24 rounded-full bg-fg/15" />
        <span className="h-1.5 w-16 rounded-full bg-fg/10" />
      </div>
    </div>
  );
}

const EMPTY = { leadId: "", type: "mockup", status: "Mockup", previewUrl: "", liveUrl: "", thumbnailUrl: "" };

export function SitesView({ sites, leads }: { sites: SiteRow[]; leads: { id: string; businessName: string }[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [filter, setFilter] = useState("All");
  const [preview, setPreview] = useState<string | null>(null);
  const [editing, setEditing] = useState<(typeof EMPTY & { id?: string }) | null>(null);

  const shown = filter === "All" ? sites : sites.filter((s) => s.status === filter);
  const counts = Object.fromEntries(SITE_STATUSES.map((s) => [s, sites.filter((x) => x.status === s).length]));

  const save = async () => {
    if (!editing) return;
    try {
      const { id, ...body } = editing;
      if (id) await api(`/api/sites/${id}`, { method: "PATCH", body });
      else await api("/api/sites", { method: "POST", body });
      toast("Site saved");
      setEditing(null);
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const remove = async (s: SiteRow) => {
    const ok = await confirm({ title: "Delete this site?", message: `The ${s.type} for ${s.lead.businessName} will be removed from this list.` });
    if (!ok) return;
    await api(`/api/sites/${s.id}`, { method: "DELETE" });
    toast("Site deleted");
    router.refresh();
  };

  return (
    <>
      <PageHeader
        title="Sites & mockups"
        description={`${sites.length} total · ${counts.Live ?? 0} live`}
        actions={<Button variant="primary" onClick={() => setEditing({ ...EMPTY, leadId: leads[0]?.id ?? "" })}><Plus className="size-4" /> Add site</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {["All", ...SITE_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              filter === s ? "border-accent bg-accent/10 text-fg" : "border-border text-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {s} <span className="tabular-nums text-muted">{s === "All" ? sites.length : counts[s]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card><EmptyState icon={<Globe className="size-6" />} title="No sites yet">Add a mockup link on a lead, or click Add site.</EmptyState></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((s) => (
            <Card key={s.id} className="group overflow-hidden transition-colors hover:border-border-strong">
              <button className="block aspect-[16/10] w-full overflow-hidden border-b border-border" onClick={() => s.previewUrl || s.liveUrl ? setPreview(s.liveUrl || s.previewUrl) : undefined} aria-label="Preview">
                <Thumbnail site={s} />
              </button>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/leads/${s.lead.id}`} className="block truncate font-medium hover:underline">{s.lead.businessName}</Link>
                    <p className="text-xs text-muted">{s.type === "mockup" ? "Mockup" : "Client site"} · {formatDate(s.createdAt)}</p>
                  </div>
                  <Badge color={STATUS_COLOR[s.status]}>{s.status}</Badge>
                </div>
                {s.liveUrl && (
                  <a href={ensureUrl(s.liveUrl)} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 truncate text-sm text-emerald-600 hover:underline dark:text-emerald-400">
                    <Globe className="size-3.5 shrink-0" /> {s.liveUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.previewUrl && <Button size="sm" onClick={() => setPreview(s.previewUrl)}><Eye className="size-3.5" /> Preview</Button>}
                  {s.liveUrl && (
                    <a href={ensureUrl(s.liveUrl)} target="_blank" rel="noreferrer"><Button size="sm" variant="ghost"><ExternalLink className="size-3.5" /> Live</Button></a>
                  )}
                  <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setEditing({ ...EMPTY, ...s, id: s.id })} aria-label="Edit"><Pencil className="size-3.5" /></Button>
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500" onClick={() => remove(s)} aria-label="Delete"><Trash2 className="size-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit site" : "Add site"}>
        {editing && (
          <div className="space-y-3">
            <Field label="Lead">
              <Select value={editing.leadId} onChange={(e) => setEditing({ ...editing, leadId: e.target.value })} disabled={!!editing.id}>
                {leads.map((l) => <option key={l.id} value={l.id}>{l.businessName}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                  <option value="mockup">Mockup</option>
                  <option value="client">Client site</option>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  {SITE_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Preview URL"><Input value={editing.previewUrl} onChange={(e) => setEditing({ ...editing, previewUrl: e.target.value })} /></Field>
            <Field label="Live URL"><Input value={editing.liveUrl} onChange={(e) => setEditing({ ...editing, liveUrl: e.target.value })} /></Field>
            <Field label="Screenshot / thumbnail URL (optional)"><Input value={editing.thumbnailUrl} onChange={(e) => setEditing({ ...editing, thumbnailUrl: e.target.value })} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" onClick={save} disabled={!editing.leadId}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
      <MockupPreview url={preview} onClose={() => setPreview(null)} />
    </>
  );
}
