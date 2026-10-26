"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CheckCheck, Inbox, Pencil, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { EMAIL_TYPE_LABELS } from "@/lib/constants";
import type { EmailDTO } from "@/lib/types";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageHeader, Textarea, api } from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { useToast } from "@/components/toast";

type Item = EmailDTO & { finalBody: string; lead: { id: string; businessName: string; email: string; stage: string; niche: string; city: string } };
type Data = {
  items: Item[];
  send: {
    ramp: { week: number; limit: number };
    sentToday: number;
    blockers: string[];
    paused: boolean;
    pausedReason: string;
    nextSendAt: string | null;
    gmailEmail: string;
    timezone: string;
    sendStartHour: number;
    sendEndHour: number;
  };
};

const BLOCKER_TEXT: Record<string, string> = {
  paused: "Outreach is paused. Nothing will send until you resume it in Settings.",
  gmail: "Gmail isn't connected, so nothing can send. Connect it in Settings.",
  outside_hours: "Outside your sending hours. Approved emails will start going out at the next sending window.",
  daily_limit: "Today's limit is reached. The rest go out tomorrow.",
};

export function QueueView({ data }: { data: Data }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Item | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = data.items.filter((e) => e.status === "draft");
  const approved = data.items.filter((e) => e.status === "approved" || e.status === "sending");
  const failed = data.items.filter((e) => e.status === "failed");
  const { send } = data;

  const run = async (fn: () => Promise<unknown>, message?: string) => {
    setBusy(true);
    try {
      await fn();
      if (message) toast(message);
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };
  const patch = (e: Item, body: Record<string, unknown>, message?: string) => run(() => api(`/api/drafts/${e.id}`, { method: "PATCH", body }), message);
  const remove = async (e: Item) => {
    if (!(await confirm({ title: "Remove this email?", message: `“${e.subject || EMAIL_TYPE_LABELS[e.type]}” to ${e.lead.businessName} will be deleted and not sent.`, confirmLabel: "Remove" }))) return;
    run(() => api(`/api/drafts/${e.id}`, { method: "DELETE" }), "Removed");
  };
  const approveAll = async () => {
    if (!(await confirm({ title: `Approve all ${pending.length} emails?`, message: `They'll send gradually, 2–6 minutes apart, within today's limit of ${send.ramp.limit}. Anything over the limit goes out on the next sending day.`, confirmLabel: "Approve all", danger: false }))) return;
    run(() => api("/api/drafts/approve", { method: "POST", body: { all: true } }), `Approved ${pending.length} emails`);
  };

  return (
    <>
      <PageHeader
        title="Approval queue"
        description="Nothing is sent until you approve it"
        actions={pending.length > 0 && <Button variant="primary" onClick={approveAll} disabled={busy}><CheckCheck className="size-4" /> Approve all ({pending.length})</Button>}
      />

      <Card className="mb-4 p-4 text-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <span><span className="font-semibold tabular-nums">{send.sentToday}</span><span className="text-muted"> / {send.ramp.limit} sent today (ramp week {send.ramp.week})</span></span>
          <span><span className="font-semibold tabular-nums">{approved.length}</span><span className="text-muted"> approved, waiting to send</span></span>
          {send.nextSendAt && !send.blockers.length && new Date(send.nextSendAt) > new Date() && (
            <span className="text-muted">Next send after {formatDateTime(send.nextSendAt)}</span>
          )}
          <span className="text-muted">Sending hours {send.sendStartHour}:00–{send.sendEndHour}:00 ({send.timezone})</span>
        </div>
        {send.blockers.filter((b) => b !== "outside_hours" || approved.length > 0).map((b) => (
          <p key={b} className={cn("mt-3 flex items-start gap-2", b === "outside_hours" || b === "daily_limit" ? "text-muted" : "text-red-600 dark:text-red-400")}>
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {BLOCKER_TEXT[b] ?? b}
          </p>
        ))}
      </Card>

      <Card>
        <CardHeader title="Waiting for approval" description={`${pending.length} email${pending.length === 1 ? "" : "s"}`} />
        {pending.length === 0 ? (
          <EmptyState icon={<Inbox className="size-6" />} title="Nothing to approve">The daily session adds drafts here.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {pending.map((e) => (
              <EmailRow key={e.id} e={e}>
                <Button size="sm" variant="primary" disabled={busy} onClick={() => patch(e, { status: "approved" }, "Approved")}>Approve</Button>
                <Button size="sm" disabled={busy} onClick={() => setEditing(e)}><Pencil className="size-3.5" /> Edit</Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500" disabled={busy} onClick={() => remove(e)}><Trash2 className="size-3.5" /> Remove</Button>
              </EmailRow>
            ))}
          </ul>
        )}
      </Card>

      {approved.length > 0 && (
        <Card className="mt-4">
          <CardHeader title="Approved, waiting to send" description="Sent in this order: replies and mockups first, then follow-ups, then first emails" />
          <ul className="divide-y divide-border">
            {approved.map((e) => (
              <EmailRow key={e.id} e={e} compact>
                {e.status === "sending" ? <Badge color="blue">Sending…</Badge> : (
                  <>
                    <Button size="sm" disabled={busy} onClick={() => patch(e, { status: "draft" }, "Moved back to approval")}><Undo2 className="size-3.5" /> Unapprove</Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500" disabled={busy} onClick={() => remove(e)}><Trash2 className="size-3.5" /></Button>
                  </>
                )}
              </EmailRow>
            ))}
          </ul>
        </Card>
      )}

      {failed.length > 0 && (
        <Card className="mt-4">
          <CardHeader title="Failed" description="These couldn't be sent. Retry or remove them." />
          <ul className="divide-y divide-border">
            {failed.map((e) => (
              <EmailRow key={e.id} e={e} compact>
                <Button size="sm" disabled={busy} onClick={() => patch(e, { status: "approved" }, "Queued again")}><RotateCcw className="size-3.5" /> Retry</Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500" disabled={busy} onClick={() => remove(e)}><Trash2 className="size-3.5" /></Button>
              </EmailRow>
            ))}
          </ul>
        </Card>
      )}

      {editing && <EditModal item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh(); }} />}
    </>
  );
}

function EmailRow({ e, compact, children }: { e: Item; compact?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!compact);
  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/leads/${e.lead.id}`} className="font-medium hover:underline">{e.lead.businessName}</Link>
            <Badge color={e.type === "first" ? "blue" : e.type.startsWith("followup") ? "violet" : "amber"}>{EMAIL_TYPE_LABELS[e.type] ?? e.type}</Badge>
            <span className="text-xs text-muted">to {e.lead.email || "no email!"} · {[e.lead.niche, e.lead.city].filter(Boolean).join(", ")} · added {timeAgo(e.createdAt)}{e.createdBy ? ` by ${e.createdBy}` : ""}</span>
          </div>
          <button className="mt-1 block text-left text-sm font-medium" onClick={() => setOpen(!open)}>{e.subject || <span className="text-muted">(same thread: “Re:” the first email)</span>}</button>
          {e.error && <p className="mt-1 text-xs text-red-500">{e.error}</p>}
          {open && <pre className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-panel-2/40 p-3 font-sans text-sm leading-relaxed">{e.finalBody}</pre>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      </div>
    </li>
  );
}

function EditModal({ item, onClose, onSaved }: { item: Item; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [subject, setSubject] = useState(item.subject);
  const [body, setBody] = useState(item.body);
  const [busy, setBusy] = useState(false);
  const save = async (approve: boolean) => {
    setBusy(true);
    try {
      await api(`/api/drafts/${item.id}`, { method: "PATCH", body: { subject, body, ...(approve ? { status: "approved" } : {}) } });
      toast(approve ? "Saved and approved" : "Saved");
      onSaved();
    } catch (err) {
      toast((err as Error).message, "error");
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={`Edit email to ${item.lead.businessName}`} size="lg">
      <div className="space-y-3">
        <Field label="To"><Input value={item.lead.email} readOnly className="text-muted" /></Field>
        <Field label="Subject"><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
        <Field label="Body"><Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-72 text-[13px]" /></Field>
        <p className="text-xs text-muted">Your mailing address and an unsubscribe line are added automatically to first emails and follow-ups if they&apos;re missing. Follow-ups go in the same Gmail thread as “Re: ” the first email.</p>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={onClose}>Cancel</Button>
        <Button disabled={busy} onClick={() => save(false)}>Save</Button>
        <Button variant="primary" disabled={busy} onClick={() => save(true)}>Save & approve</Button>
      </div>
    </Modal>
  );
}
