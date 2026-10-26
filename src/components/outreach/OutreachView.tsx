"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Clock, Mail, PenLine, ShieldAlert } from "lucide-react";
import { EMAIL_TYPE_LABELS, RAMP } from "@/lib/constants";
import type { EmailDTO, LeadDTO, SettingsDTO, TemplateDTO } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { Button, Card, CardHeader, PageHeader, Score, WebsiteBadge } from "@/components/ui";
import { useConfirm } from "@/components/confirm";
import { EmailComposer } from "@/components/EmailComposer";
import { TemplatesLibrary } from "./TemplatesLibrary";

type Data = {
  send: {
    ramp: { week: number; rampLimit: number; limit: number };
    sentToday: number;
    remainingToday: number;
    overLimit: boolean;
    outbound: number;
    bounced: number;
    bounceRate: number;
    unsubscribed: number;
  };
  settings: SettingsDTO;
  drafts: (EmailDTO & { lead: LeadDTO })[];
  blockedDrafts: number;
  queuedNoDraft: LeadDTO[];
  followUps: { lead: LeadDTO; next: "followup1" | "followup2"; lastSentAt: string; dueDate: string; overdueDays: number }[];
  templates: TemplateDTO[];
};

type QueueItem = { key: string; lead: LeadDTO; label: string; detail: string; draft?: EmailDTO; type: string };

export function OutreachView({ data }: { data: Data }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { send, settings } = data;
  const [composer, setComposer] = useState<{ lead: LeadDTO; draft?: EmailDTO; type: string } | null>(null);

  const queue: QueueItem[] = [
    ...data.drafts.map((d) => ({
      key: d.id, lead: d.lead, draft: d, type: d.type,
      label: `${EMAIL_TYPE_LABELS[d.type]} · draft ready`, detail: d.subject,
    })),
    ...data.followUps.map((f) => ({
      key: `fu-${f.lead.id}`, lead: f.lead, type: f.next,
      label: `${EMAIL_TYPE_LABELS[f.next]} due`,
      detail: f.overdueDays > 0 ? `${f.overdueDays} day(s) overdue · last sent ${formatDate(f.lastSentAt)}` : `Due today · last sent ${formatDate(f.lastSentAt)}`,
    })),
    ...data.queuedNoDraft.map((l) => ({
      key: `q-${l.id}`, lead: l, type: "first",
      label: "First touch · needs writing", detail: l.mainProblem,
    })),
  ];

  const usedPct = Math.min(100, (send.sentToday / Math.max(1, send.ramp.limit)) * 100);
  const nearLimit = !send.overLimit && send.remainingToday <= Math.ceil(send.ramp.limit * 0.1);
  const bounceBad = send.bounceRate > 5;

  const open = async (item: QueueItem) => {
    if (send.remainingToday <= 0) {
      const ok = await confirm({
        title: "Daily limit reached",
        message: `You've sent ${send.sentToday} of ${send.ramp.limit} today (ramp week ${send.ramp.week}). Sending more can hurt deliverability. Continue anyway?`,
        confirmLabel: "Continue",
      });
      if (!ok) return;
    }
    setComposer({ lead: item.lead, draft: item.draft, type: item.type });
  };

  return (
    <>
      <PageHeader title="Outreach" description="Today's sending queue, limits and templates" />

      {send.overLimit && (
        <Banner tone="red" icon={AlertTriangle} title={`Over today's limit: ${send.sentToday} sent, limit is ${send.ramp.limit}`}>
          Stop sending for today to protect your domain&apos;s reputation.
        </Banner>
      )}
      {bounceBad && (
        <Banner tone="red" icon={ShieldAlert} title={`Bounce rate is ${send.bounceRate}% (above 5%)`}>
          Verify email addresses before sending more. High bounce rates get sending domains flagged.
        </Banner>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 sm:p-5 md:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted">Sent today</p>
              <p className={cn("mt-1 text-3xl font-semibold tabular-nums", send.overLimit && "text-red-500")}>
                {send.sentToday}
                <span className="text-lg text-muted"> / {send.ramp.limit}</span>
              </p>
            </div>
            <div className="text-right text-xs text-muted">
              <p>Ramp week {send.ramp.week}</p>
              <p>Started {formatDate(settings.rampStartDate)}</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel-2" role="progressbar" aria-valuenow={send.sentToday} aria-valuemax={send.ramp.limit}>
            <div
              className={cn("h-full rounded-full transition-all", send.overLimit ? "bg-red-500" : nearLimit ? "bg-amber-500" : "bg-accent")}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            {send.overLimit ? `${send.sentToday - send.ramp.limit} over the limit` : `${send.remainingToday} left today`}
            {settings.dailyLimit < send.ramp.rampLimit && ` · capped at ${settings.dailyLimit} by your settings`}
          </p>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {RAMP.map((n, i) => {
              const current = Math.min(send.ramp.week, RAMP.length) === i + 1;
              return (
                <div key={i} className={cn("rounded-lg border px-2 py-2 text-center", current ? "border-accent bg-accent/10" : "border-border")}>
                  <p className="text-[11px] text-muted">Week {i + 1}{i === RAMP.length - 1 ? "+" : ""}</p>
                  <p className="text-sm font-semibold tabular-nums">{n}/day</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <p className="text-xs text-muted">Deliverability</p>
          <div className="mt-3 space-y-4">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm">Bounce rate</span>
                <span className={cn("text-xl font-semibold tabular-nums", bounceBad ? "text-red-500" : "")}>{send.bounceRate}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel-2">
                <div className={cn("h-full rounded-full", bounceBad ? "bg-red-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, send.bounceRate * 10)}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">{send.bounced} of {send.outbound} sent · keep under 5%</p>
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm">Unsubscribes</span>
              <span className="text-xl font-semibold tabular-nums">{send.unsubscribed}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Today's queue"
          description={`${queue.length} item${queue.length === 1 ? "" : "s"} · ${Math.min(queue.length, send.remainingToday)} fit within today's limit`}
        />
        {queue.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Queue is empty. Add leads or import a CSV to fill it.</p>
        ) : (
          <ul className="divide-y divide-border">
            {queue.map((item, i) => {
              const overflow = i >= send.remainingToday;
              const Icon = item.draft ? Mail : item.type === "first" ? PenLine : Clock;
              return (
                <li key={item.key} className={cn("flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5", overflow && "opacity-60")}>
                  <span className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-panel-2 sm:flex">
                    <Icon className="size-4 text-muted" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/leads/${item.lead.id}`} className="font-medium hover:underline">{item.lead.businessName}</Link>
                      <WebsiteBadge status={item.lead.websiteStatus} />
                      <Score value={item.lead.score} />
                      {overflow && <span className="text-xs text-amber-600 dark:text-amber-400">over today&apos;s limit</span>}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted">
                      <span className="text-fg">{item.label}</span>
                      {item.detail && <> · {item.detail}</>}
                    </p>
                  </div>
                  <Button size="sm" variant={item.draft ? "primary" : "secondary"} onClick={() => open(item)} disabled={!item.lead.email} title={item.lead.email ? "" : "No email address on file"}>
                    {item.draft ? "Review & send" : "Write email"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {data.blockedDrafts > 0 && (
          <p className="border-t border-border px-5 py-2.5 text-xs text-muted">
            {data.blockedDrafts} draft(s) hidden because the lead is marked Do Not Contact.
          </p>
        )}
      </Card>

      <TemplatesLibrary templates={data.templates} settings={settings} />

      {composer && (
        <EmailComposer
          open
          onClose={() => setComposer(null)}
          onSaved={() => router.refresh()}
          lead={composer.lead}
          draft={composer.draft}
          initialType={composer.type}
          templates={data.templates}
          settings={settings}
        />
      )}
    </>
  );
}

function Banner({ tone, icon: Icon, title, children }: { tone: "red"; icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className={cn("mb-4 flex items-start gap-3 rounded-xl border p-4 text-sm", tone === "red" && "border-red-500/40 bg-red-500/10")}>
      <Icon className="mt-0.5 size-4 shrink-0 text-red-500" />
      <div>
        <p className="font-semibold text-red-600 dark:text-red-400">{title}</p>
        <p className="text-muted">{children}</p>
      </div>
    </div>
  );
}
