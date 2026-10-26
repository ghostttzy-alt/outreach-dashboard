import { prisma } from "./prisma";
import { CLOSED_STAGES, FUNNEL_STAGES, STAGE_RANK } from "./constants";
import { getSettings } from "./services";
import { addDays, daysBetween, pct, rampInfo, startOfToday } from "./utils";

const SENT_STATUSES = ["sent", "opened", "replied", "bounced"];

export async function getSendStats() {
  const settings = await getSettings();
  const today = startOfToday();
  const [sentToday, outbound, bounced, unsubscribed] = await Promise.all([
    prisma.email.count({ where: { direction: "outbound", status: { in: SENT_STATUSES }, sentAt: { gte: today } } }),
    prisma.email.count({ where: { direction: "outbound", status: { in: SENT_STATUSES } } }),
    prisma.email.count({ where: { direction: "outbound", status: "bounced" } }),
    prisma.email.count({ where: { status: "unsubscribed" } }),
  ]);
  const ramp = rampInfo(settings.rampStartDate, settings.dailyLimit);
  return {
    settings,
    ramp,
    sentToday,
    remainingToday: Math.max(0, ramp.limit - sentToday),
    overLimit: sentToday > ramp.limit,
    outbound,
    bounced,
    bounceRate: pct(bounced, outbound),
    unsubscribed,
  };
}

/**
 * Follow-ups due: leads in Contacted / Follow-up 1 whose last outbound email is older than the
 * follow-up interval and who haven't replied since.
 */
export async function getFollowUpsDue() {
  const settings = await getSettings();
  const leads = await prisma.lead.findMany({
    where: { stage: { in: ["Contacted", "Follow-up 1"] } },
    include: { emails: { where: { sentAt: { not: null } }, orderBy: { sentAt: "desc" }, take: 1 } },
  });
  const now = new Date();
  return leads
    .map((lead) => {
      const last = lead.emails[0];
      if (!last || last.direction === "inbound" || !last.sentAt) return null;
      const next = lead.stage === "Contacted" ? "followup1" : "followup2";
      const wait = next === "followup1" ? settings.followup1Days : settings.followup2Days;
      const dueDate = addDays(startOfToday(last.sentAt), wait);
      const overdueDays = daysBetween(dueDate, now);
      if (overdueDays < 0) return null;
      const { emails: _e, ...rest } = lead;
      return { lead: rest, next: next as "followup1" | "followup2", lastSentAt: last.sentAt, dueDate, overdueDays };
    })
    .filter((x) => x !== null)
    .sort((a, b) => b.overdueDays - a.overdueDays);
}

export async function getNeedsAttention() {
  const leads = await prisma.lead.findMany({
    where: { stage: { notIn: CLOSED_STAGES } },
    include: {
      emails: { where: { sentAt: { not: null } }, orderBy: { sentAt: "desc" }, take: 1 },
      sites: { select: { id: true } },
    },
  });
  const awaitingReply = leads
    .filter((l) => l.emails[0]?.direction === "inbound")
    .map((l) => ({ lead: l, receivedAt: l.emails[0].sentAt!, subject: l.emails[0].subject }))
    .sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime());
  const interestedNoMockup = leads.filter((l) => l.stage === "Interested" && !l.mockupUrl && l.sites.length === 0);
  const followUpsDue = await getFollowUpsDue();
  return { awaitingReply, interestedNoMockup, followUpsDue };
}

export async function getOverview() {
  const since = addDays(startOfToday(), -29);
  const [send, totalLeads, stageGroups, emails30, clients, mockupsSent, contactedLeads, repliedLeads, activity] =
    await Promise.all([
      getSendStats(),
      prisma.lead.count(),
      prisma.lead.groupBy({ by: ["stage"], _count: true }),
      prisma.email.findMany({
        where: { sentAt: { gte: since }, status: { not: "draft" } },
        select: { sentAt: true, direction: true },
      }),
      prisma.client.findMany(),
      prisma.lead.count({ where: { OR: [{ stage: "Mockup Sent" }, { emails: { some: { type: "mockup", direction: "outbound", status: { not: "draft" } } } }] } }),
      prisma.lead.count({ where: { emails: { some: { direction: "outbound", status: { in: SENT_STATUSES } } } } }),
      prisma.lead.count({ where: { emails: { some: { direction: "inbound" } } } }),
      prisma.activity.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { lead: { select: { id: true, businessName: true } } },
      }),
    ]);

  const byStage: Record<string, number> = Object.fromEntries(stageGroups.map((g) => [g.stage, g._count]));

  // Daily series for the last 30 days.
  const days = Array.from({ length: 30 }, (_, i) => addDays(since, i));
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const counts = new Map(days.map((d) => [key(d), { sent: 0, replies: 0 }]));
  for (const e of emails30) {
    const c = counts.get(key(e.sentAt!));
    if (!c) continue;
    if (e.direction === "outbound") c.sent++;
    else c.replies++;
  }
  const daily = days.map((d) => ({
    date: d.toISOString(),
    label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    ...counts.get(key(d))!,
  }));

  // Funnel: how many leads have reached at least each stage (Lost/Cold/DNC count as "Contacted").
  const reached = (stage: string) =>
    Object.entries(byStage).reduce((sum, [s, n]) => {
      const rank = STAGE_RANK[s] ?? (s === "Queued" ? 0 : 1);
      return rank >= STAGE_RANK[stage] ? sum + n : sum;
    }, 0);
  const funnel = FUNNEL_STAGES.map((stage) => ({ stage, count: stage === "Queued" ? totalLeads : reached(stage) }));

  const oneTime = clients.filter((c) => c.status !== "cancelled").reduce((s, c) => s + c.setupPrice, 0);
  const mrr = clients.filter((c) => c.status === "active").reduce((s, c) => s + c.monthlyFee, 0);

  return {
    send,
    totalLeads,
    byStage,
    replyRate: pct(repliedLeads, contactedLeads),
    repliedLeads,
    contactedLeads,
    interested: byStage["Interested"] ?? 0,
    mockupsSent,
    clientsWon: clients.length,
    oneTime,
    mrr,
    daily,
    funnel,
    activity,
  };
}
