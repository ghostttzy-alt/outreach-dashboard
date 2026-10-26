"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft, Ban, ChevronDown, ExternalLink, Eye, Inbox, Mail, Plus, Send, Sparkles, Trash2, Trophy,
} from "lucide-react";
import { EMAIL_TYPE_LABELS, REPLY_CATEGORIES, SENT_STATUSES, STAGES, WEBSITE_STATUSES } from "@/lib/constants";
import type { EmailDTO, LeadFull, SettingsDTO, TemplateDTO } from "@/lib/types";
import { cn, ensureUrl, formatDate, formatDateTime, formatMoney, timeAgo } from "@/lib/utils";
import { Badge, Button, CardHeader, Card, CategoryBadge, EmailStatusBadge, Modal, Score, Select, StageBadge, Textarea, WebsiteBadge, api } from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { useToast } from "@/components/toast";
import { EmailComposer } from "@/components/EmailComposer";
import { EditableField } from "./EditableField";
import { LogReplyModal } from "./LogReplyModal";

type Props = { lead: LeadFull; templates: TemplateDTO[]; settings: SettingsDTO };

export function LeadDetail({ lead, templates, settings }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [composer, setComposer] = useState<{ open: boolean; draft?: EmailDTO | null; type?: string }>({ open: false });
  const [logReply, setLogReply] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState(lead.notes);
  const [expanded, setExpanded] = useState<string | null>(null);

  const dnc = lead.stage === "Do Not Contact";
  const refresh = () => router.refresh();

  const save = async (patch: Record<string, unknown>, message?: string) => {
    try {
      await api(`/api/leads/${lead.id}`, { method: "PATCH", body: patch });
      if (message) toast(message);
      refresh();
    } catch (err) {
      toast((err as Error).message, "error");
      throw err;
    }
  };
  const field = (key: string) => (v: string) => save({ [key]: v });

  const setStage = async (stage: string) => {
    if (stage === lead.stage) return;
    if (stage === "Do Not Contact") {
      const ok = await confirm({
        title: "Mark as Do Not Contact?",
        message: "This lead will be locked out of the outreach queue and outbound email will be blocked. You can change the stage back later.",
        confirmLabel: "Mark Do Not Contact",
      });
      if (!ok) return;
    }
    await save({ stage }, `Moved to ${stage}`);
  };

  const deleteLead = async () => {
    const ok = await confirm({
      title: `Delete ${lead.businessName}?`,
      message: "All emails, notes, sites, the client record and activity for this lead will be deleted. This can't be undone.",
    });
    if (!ok) return;
    await api(`/api/leads/${lead.id}`, { method: "DELETE" });
    toast(`Deleted ${lead.businessName}`);
    router.push("/leads");
    router.refresh();
  };

  const deleteEmail = async (e: EmailDTO) => {
    const ok = await confirm({ title: "Delete this email?", message: `“${e.subject || "(no subject)"}” will be removed from the timeline.` });
    if (!ok) return;
    await api(`/api/emails/${e.id}`, { method: "DELETE" });
    toast("Email deleted");
    refresh();
  };

  const classify = async (e: EmailDTO, category: string) => {
    try {
      await api(`/api/replies/${e.id}/classify`, { method: "POST", body: { category } });
      toast(`Classified as ${category}`);
      refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const setEmailStatus = async (e: EmailDTO, status: string) => {
    try {
      await api(`/api/emails/${e.id}`, { method: "PATCH", body: { status } });
      refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  };

  const nextType =
    lead.stage === "Queued" ? "first" : lead.stage === "Contacted" ? "followup1" : lead.stage === "Follow-up 1" ? "followup2" : ["Interested", "Replied"].includes(lead.stage) ? "mockup" : "reply";

  return (
    <>
      <Link href="/leads" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Leads
      </Link>

      {dnc && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
          <Ban className="mt-0.5 size-4 shrink-0 text-red-500" />
          <div>
            <p className="font-semibold text-red-600 dark:text-red-400">Do Not Contact</p>
            <p className="text-muted">This lead is locked out of the outreach queue. Outbound emails can&apos;t be logged or sent.</p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{lead.businessName}</h1>
            <StageBadge stage={lead.stage} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {[lead.niche, lead.city].filter(Boolean).join(" · ")} · Added {formatDate(lead.createdAt)}
            {lead.createdBy && ` by ${lead.createdBy}`}
            {lead.source && <> · Source: {lead.sourceUrl ? <a href={ensureUrl(lead.sourceUrl)} target="_blank" rel="noreferrer" className="underline hover:text-fg">{lead.source}</a> : lead.source}</>}
          </p>
          {lead.nextFollowUpAt && lead.nextFollowUpType && (
            <p className="mt-1 text-xs text-muted">
              Next: {lead.nextFollowUpType === "cold" ? "marked Cold if no reply" : EMAIL_TYPE_LABELS[lead.nextFollowUpType]} on {formatDate(lead.nextFollowUpAt)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setStage("Interested")} disabled={lead.stage === "Interested"}>
            <Sparkles className="size-4 text-amber-500" /> Interested
          </Button>
          <Button onClick={() => setStage("Won")} disabled={lead.stage === "Won"}>
            <Trophy className="size-4 text-emerald-500" /> Won
          </Button>
          <Button onClick={() => setStage("Do Not Contact")} disabled={dnc}>
            <Ban className="size-4 text-red-500" /> Do Not Contact
          </Button>
          <Select value={lead.stage} onChange={(e) => setStage(e.target.value)} className="w-auto" aria-label="Stage">
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader title="Company" description="Click any field to edit" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:p-5">
              <EditableField className="col-span-2" label="Business name" value={lead.businessName} onSave={field("businessName")} />
              <EditableField label="Contact" value={lead.contactName} onSave={field("contactName")} />
              <EditableField label="Phone" value={lead.phone} onSave={field("phone")} display={<a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{lead.phone}</a>} />
              <EditableField className="col-span-2" label="Email" type="email" value={lead.email} onSave={field("email")} />
              <EditableField label="Niche" value={lead.niche} onSave={field("niche")} />
              <EditableField label="City" value={lead.city} onSave={field("city")} />
              <EditableField
                className="col-span-2"
                label="Website"
                value={lead.website}
                onSave={field("website")}
                display={
                  <span className="inline-flex items-center gap-1">
                    {lead.website}
                    <a href={ensureUrl(lead.website)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted hover:text-fg" aria-label="Open website">
                      <ExternalLink className="size-3.5" />
                    </a>
                  </span>
                }
              />
              <EditableField label="Website status" value={lead.websiteStatus} options={WEBSITE_STATUSES} onSave={field("websiteStatus")} display={<WebsiteBadge status={lead.websiteStatus} />} />
              <EditableField label="Score" value={String(lead.score)} options={["1", "2", "3", "4", "5"]} onSave={(v) => save({ score: Number(v) })} display={<Score value={lead.score} />} />
              <EditableField className="col-span-2" label="Main problem" type="textarea" value={lead.mainProblem} onSave={field("mainProblem")} />
              <EditableField
                label="Date contacted"
                type="date"
                value={lead.dateContacted ? lead.dateContacted.slice(0, 10) : ""}
                onSave={(v) => save({ dateContacted: v ? new Date(`${v}T12:00:00`).toISOString() : null })}
                display={formatDate(lead.dateContacted)}
              />
              <div>
                <div className="mb-0.5 text-xs text-muted">Last updated</div>
                <div className="py-1 text-sm">{timeAgo(lead.updatedAt)}</div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Mockup" />
            <div className="space-y-3 p-4 sm:p-5">
              <EditableField label="Mockup link" type="url" value={lead.mockupUrl} onSave={field("mockupUrl")} placeholder="Paste a mockup URL…" />
              {lead.mockupUrl && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setPreview(lead.mockupUrl)}><Eye className="size-3.5" /> Preview</Button>
                  <a href={ensureUrl(lead.mockupUrl)} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost"><ExternalLink className="size-3.5" /> Open</Button>
                  </a>
                </div>
              )}
              {lead.sites.length > 0 && (
                <ul className="space-y-1.5 border-t border-border pt-3 text-sm">
                  {lead.sites.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-muted">{s.type === "mockup" ? "Mockup" : "Client site"} · {formatDate(s.createdAt)}</span>
                      <Badge color={s.status === "Live" ? "green" : s.status === "In Progress" ? "amber" : "fuchsia"}>{s.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {lead.client && (
            <Card>
              <CardHeader title="Client" action={<Link href="/clients" className="text-xs text-muted hover:text-fg">All clients →</Link>} />
              <dl className="grid grid-cols-2 gap-3 p-4 text-sm sm:p-5">
                <div><dt className="text-xs text-muted">Setup</dt><dd className="font-medium">{formatMoney(lead.client.setupPrice)}</dd></div>
                <div><dt className="text-xs text-muted">Monthly</dt><dd className="font-medium">{formatMoney(lead.client.monthlyFee)}/mo</dd></div>
                <div><dt className="text-xs text-muted">Since</dt><dd>{formatDate(lead.client.startDate)}</dd></div>
                <div><dt className="text-xs text-muted">Status</dt><dd className="capitalize">{lead.client.status}</dd></div>
              </dl>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              title="Email timeline"
              description={`${lead.emails.length} email${lead.emails.length === 1 ? "" : "s"}`}
              action={
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setLogReply(true)}><Inbox className="size-3.5" /> Log reply</Button>
                  <Button size="sm" variant="primary" disabled={dnc} onClick={() => setComposer({ open: true, type: nextType })}>
                    <Plus className="size-3.5" /> Write email
                  </Button>
                </div>
              }
            />
            {lead.emails.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">No emails yet.</p>
            ) : (
              <ol className="relative px-4 py-4 sm:px-5">
                <span className="absolute bottom-6 left-[1.85rem] top-6 w-px bg-border sm:left-[2.1rem]" aria-hidden />
                {lead.emails.map((e) => {
                  const inbound = e.direction === "inbound";
                  const open = expanded === e.id;
                  return (
                    <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
                      <span
                        className={cn(
                          "relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border",
                          inbound ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-panel-2 text-muted",
                        )}
                      >
                        {inbound ? <Inbox className="size-3.5" /> : !e.sentAt ? <Mail className="size-3.5" /> : <Send className="size-3.5" />}
                      </span>
                      <div className="min-w-0 flex-1 rounded-lg border border-border bg-panel-2/40 p-3">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-xs font-medium">{inbound ? "Received" : EMAIL_TYPE_LABELS[e.type] ?? e.type}</span>
                          {inbound ? <CategoryBadge category={e.category} /> : <EmailStatusBadge status={e.status} />}
                          {e.needsYou && <Badge color="amber">Needs you</Badge>}
                          <span className="ml-auto text-xs text-muted">{e.sentAt ? formatDateTime(e.sentAt) : `Not sent · ${timeAgo(e.createdAt)}`}</span>
                        </div>
                        <button className="mt-1.5 flex w-full items-start gap-1 text-left text-sm font-medium" onClick={() => setExpanded(open ? null : e.id)}>
                          <span className="min-w-0 flex-1">{e.subject || "(no subject)"}</span>
                          <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
                        </button>
                        {e.error && <p className="mt-1 text-xs text-red-500">{e.error}</p>}
                        {open && (
                          <>
                            {e.needsYouNote && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{e.needsYouNote}</p>}
                            <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm text-muted">{e.body || "(empty)"}</pre>
                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                              {inbound ? (
                                <Select className="h-8 w-auto text-xs" value={e.category || "Unclassified"} onChange={(ev) => classify(e, ev.target.value)} aria-label="Reply category">
                                  {REPLY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </Select>
                              ) : ["draft", "approved", "failed"].includes(e.status) ? (
                                <Link href="/queue"><Button size="sm" variant="primary">Open approval queue</Button></Link>
                              ) : SENT_STATUSES.includes(e.status) ? (
                                <Select className="h-8 w-auto text-xs" value={e.status} onChange={(ev) => setEmailStatus(e, ev.target.value)} aria-label="Email status">
                                  {SENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </Select>
                              ) : null}
                              <Button size="sm" variant="ghost" className="ml-auto text-red-500 hover:text-red-500" onClick={() => deleteEmail(e)}>
                                <Trash2 className="size-3.5" /> Delete
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <Card>
            <CardHeader title="Notes" />
            <div className="p-4 sm:p-5">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything worth remembering about this business…" className="min-h-28" />
              <div className="mt-2 flex justify-end">
                <Button size="sm" variant="primary" disabled={notes === lead.notes} onClick={() => save({ notes }, "Notes saved")}>Save notes</Button>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Activity" />
            <ul className="divide-y divide-border">
              {lead.activities.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm sm:px-5">
                  <span className="min-w-0">{a.description}</span>
                  <span className="shrink-0 text-xs text-muted">{timeAgo(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="flex justify-end">
            <Button variant="ghost" className="text-red-500 hover:text-red-500" onClick={deleteLead}>
              <Trash2 className="size-4" /> Delete lead
            </Button>
          </div>
        </div>
      </div>

      <EmailComposer
        open={composer.open}
        draft={composer.draft}
        initialType={composer.type}
        onClose={() => setComposer({ open: false })}
        onSaved={refresh}
        lead={lead}
        templates={templates}
        settings={settings}
      />
      <LogReplyModal open={logReply} onClose={() => setLogReply(false)} onSaved={refresh} leadId={lead.id} />
      <MockupPreview url={preview} onClose={() => setPreview(null)} />
    </>
  );
}

export function MockupPreview({ url, onClose }: { url: string | null; onClose: () => void }) {
  return (
    <Modal open={!!url} onClose={onClose} title="Mockup preview" size="xl">
      {url && (
        <>
          <div className="mb-3 flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-muted">{url}</span>
            <a href={ensureUrl(url)} target="_blank" rel="noreferrer">
              <Button size="sm"><ExternalLink className="size-3.5" /> Open in new tab</Button>
            </a>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-white">
            <iframe src={ensureUrl(url)} title="Mockup preview" className="h-[70vh] w-full" sandbox="allow-scripts allow-same-origin" />
          </div>
          <p className="mt-2 text-xs text-muted">If the preview is blank, the site may block embedding. Use “Open in new tab”.</p>
        </>
      )}
    </Modal>
  );
}
