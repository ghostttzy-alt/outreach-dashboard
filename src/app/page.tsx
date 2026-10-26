import Link from "next/link";
import { Clock, Inbox, Mail, MessageSquare, Palette, Send, Sparkles, Trophy, Users, DollarSign, ArrowRight } from "lucide-react";
import { Card, CardHeader, StageBadge } from "@/components/ui";
import { ActivityChart } from "@/components/overview/ActivityChart";
import { Funnel } from "@/components/overview/Funnel";
import { getNeedsAttention, getOverview } from "@/lib/metrics";
import { cn, formatMoney, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

function Kpi({ label, value, sub, icon: Icon, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon: React.ElementType; tone?: "warn" }) {
  return (
    <Card className="p-4 transition-colors hover:border-border-strong">
      <div className="flex items-center justify-between text-xs text-muted">
        {label}
        <Icon className="size-4" />
      </div>
      <div className={cn("mt-2 text-2xl font-semibold tracking-tight tabular-nums", tone === "warn" && "text-red-500")}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </Card>
  );
}

const ACTIVITY_ICON: Record<string, React.ElementType> = {
  email_sent: Send,
  email_received: Inbox,
  email_bounced: Mail,
  stage_change: ArrowRight,
  client_won: Trophy,
  lead_created: Users,
  unsubscribe: Mail,
  note: MessageSquare,
  import: Users,
};

export default async function OverviewPage() {
  const [o, attention] = await Promise.all([getOverview(), getNeedsAttention()]);
  const { send } = o;
  const attentionCount = attention.awaitingReply.length + attention.followUpsDue.length + attention.interestedNoMockup.length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · Ramp week {send.ramp.week}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Total leads" value={o.totalLeads} icon={Users} sub={`${o.byStage["Queued"] ?? 0} queued`} />
        <Kpi
          label="Sent today"
          value={<>{send.sentToday}<span className="text-base text-muted"> / {send.ramp.limit}</span></>}
          icon={Send}
          tone={send.overLimit ? "warn" : undefined}
          sub={send.overLimit ? "Over today's limit" : `${send.remainingToday} left today`}
        />
        <Kpi label="Reply rate" value={`${o.replyRate}%`} icon={MessageSquare} sub={`${o.repliedLeads} of ${o.contactedLeads} contacted`} />
        <Kpi label="Interested" value={o.interested} icon={Sparkles} sub="Leads in Interested" />
        <Kpi label="Mockups sent" value={o.mockupsSent} icon={Palette} />
        <Kpi label="Clients won" value={o.clientsWon} icon={Trophy} />
        <Kpi
          label="Revenue"
          value={formatMoney(o.oneTime)}
          icon={DollarSign}
          sub={<><span className="font-medium text-fg">{formatMoney(o.mrr)}</span>/mo recurring</>}
        />
        <Kpi
          label="Bounce rate"
          value={`${send.bounceRate}%`}
          icon={Mail}
          tone={send.bounceRate > 5 ? "warn" : undefined}
          sub={`${send.bounced} bounced · ${send.unsubscribed} unsubscribed`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Emails & replies" description="Last 30 days" />
          <div className="p-4 sm:p-5">
            <ActivityChart data={o.daily} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Pipeline funnel" description="Leads that reached each stage" />
          <div className="p-4 sm:p-5">
            <Funnel data={o.funnel} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Needs attention"
            description={attentionCount ? `${attentionCount} items` : "You're all caught up"}
            action={<Link href="/outreach" className="text-xs text-muted hover:text-fg">Outreach →</Link>}
          />
          <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
            <AttentionList
              title="Replies waiting"
              icon={Inbox}
              empty="No replies waiting"
              items={attention.awaitingReply.map((a) => ({ id: a.lead.id, name: a.lead.businessName, meta: `Replied ${timeAgo(a.receivedAt)}` }))}
            />
            <AttentionList
              title="Follow-ups due"
              icon={Clock}
              empty="Nothing due today"
              items={attention.followUpsDue.map((f) => ({
                id: f.lead.id,
                name: f.lead.businessName,
                meta: `${f.next === "followup1" ? "Follow-up 1" : "Follow-up 2"}${f.overdueDays > 0 ? ` · ${f.overdueDays}d overdue` : " · due today"}`,
              }))}
            />
            <AttentionList
              title="Interested, no mockup"
              icon={Palette}
              empty="Every interested lead has a mockup"
              items={attention.interestedNoMockup.map((l) => ({ id: l.id, name: l.businessName, meta: `${l.niche} · ${l.city}` }))}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent activity" />
          <ul className="divide-y divide-border">
            {o.activity.map((a) => {
              const Icon = ACTIVITY_ICON[a.type] ?? ArrowRight;
              return (
                <li key={a.id} className="flex gap-3 px-4 py-2.5 sm:px-5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-panel-2">
                    <Icon className="size-3 text-muted" />
                  </span>
                  <div className="min-w-0 text-sm">
                    {a.lead ? (
                      <Link href={`/leads/${a.lead.id}`} className="line-clamp-2 hover:underline">{a.description}</Link>
                    ) : (
                      <p className="line-clamp-2">{a.description}</p>
                    )}
                    <p className="text-xs text-muted">{timeAgo(a.createdAt)}</p>
                  </div>
                </li>
              );
            })}
            {!o.activity.length && <li className="px-5 py-8 text-center text-sm text-muted">No activity yet</li>}
          </ul>
        </Card>
      </div>

      {o.byStage["Do Not Contact"] ? (
        <p className="mt-4 flex items-center gap-2 text-xs text-muted">
          <StageBadge stage="Do Not Contact" /> {o.byStage["Do Not Contact"]} lead(s) are locked out of outreach.
        </p>
      ) : null}
    </>
  );
}

function AttentionList({ title, icon: Icon, items, empty }: { title: string; icon: React.ElementType; items: { id: string; name: string; meta: string }[]; empty: string }) {
  return (
    <div className="p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted">
        <Icon className="size-3.5" /> {title}
        <span className={cn("ml-auto rounded-full px-1.5 tabular-nums", items.length ? "bg-accent text-accent-fg" : "bg-panel-2")}>{items.length}</span>
      </div>
      {items.length ? (
        <ul className="space-y-1">
          {items.slice(0, 6).map((i) => (
            <li key={i.id}>
              <Link href={`/leads/${i.id}`} className="-mx-2 block rounded-lg px-2 py-1.5 transition-colors hover:bg-panel-2">
                <span className="block truncate text-sm font-medium">{i.name}</span>
                <span className="block truncate text-xs text-muted">{i.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{empty}</p>
      )}
    </div>
  );
}
