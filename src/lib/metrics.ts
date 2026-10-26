import { prisma } from "./prisma";
import { FUNNEL_STAGES, SENT_STATUSES, STAGE_RANK } from "./constants";
import { getFollowUpsDue } from "./followups";
import { bounceStats } from "./replies";
import { sendStatus } from "./sender";
import { getInterestedNeedingMockups, getUnansweredReplies } from "./brief";
import { addDays, pct, startOfToday } from "./utils";

export { getFollowUpsDue };

export async function getSendStats() {
  const [s, bounce, outbound, bounced, unsubscribed] = await Promise.all([
    sendStatus(),
    bounceStats(),
    prisma.email.count({ where: { direction: "outbound", status: { in: SENT_STATUSES } } }),
    prisma.email.count({ where: { direction: "outbound", status: "bounced" } }),
    prisma.lead.count({ where: { stage: "Do Not Contact" } }),
  ]);
  return {
    settings: s.settings,
    ramp: s.ramp,
    sentToday: s.sentToday,
    remainingToday: s.remainingToday,
    overLimit: s.sentToday > s.ramp.limit,
    gmailConnected: s.gmailConnected,
    gmailEmail: s.state.gmailEmail,
    gmailError: s.state.gmailError,
    nextSendAt: s.state.nextSendAt,
    blockers: s.blockers,
    outbound,
    bounced,
    /** Bounce rate over the last 7 days; this is what auto-pauses sending above 5%. */
    bounceRate: bounce.bounceRate7d,
    sent7d: bounce.sent7d,
    bounced7d: bounce.bounced7d,
    unsubscribed,
  };
}

export async function getNeedsAttention() {
  const [unanswered, followUpsDue, interestedNoMockup] = await Promise.all([
    getUnansweredReplies(),
    getFollowUpsDue(),
    getInterestedNeedingMockups(),
  ]);
  const awaitingReply = unanswered.map((r) => ({ lead: r.lead, receivedAt: r.sentAt!, subject: r.subject, category: r.category }));
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
        where: { sentAt: { gte: since }, status: { notIn: ["draft", "approved", "sending", "cancelled", "failed"] } },
        select: { sentAt: true, direction: true },
      }),
      prisma.client.findMany(),
      prisma.lead.count({ where: { OR: [{ stage: "Mockup Sent" }, { emails: { some: { type: "mockup", direction: "outbound", status: { not: "draft" } } } }] } }),
      prisma.lead.count({ where: { emails: { some: { direction: "outbound", status: { in: SENT_STATUSES } } } } }),
      prisma.lead.count({ where: { emails: { some: { direction: "inbound", category: { notIn: ["Bounce", "Auto-reply"] } } } } }),
      prisma.activity.findMany({
        where: { type: { not: "bounce_notice" } },
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

/**
 * Replies that need a human: anything the daily session flagged, questions still waiting for an answer,
 * and replies nobody has classified for over a day.
 */
export async function getNeedsYou() {
  const unanswered = await getUnansweredReplies();
  const dayAgo = addDays(new Date(), -1);
  const flagged = await prisma.email.findMany({
    where: { direction: "inbound", needsYou: true },
    include: { lead: true },
    orderBy: { sentAt: "desc" },
    take: 50,
  });
  const items = new Map<string, { id: string; lead: { id: string; businessName: string }; reason: string; category: string; receivedAt: Date; subject: string; flagged: boolean }>();
  for (const r of flagged) items.set(r.id, { id: r.id, lead: r.lead, reason: r.needsYouNote || "Flagged by the daily session", category: r.category, receivedAt: r.sentAt!, subject: r.subject, flagged: true });
  for (const r of unanswered) {
    if (items.has(r.id)) continue;
    if (r.category === "Question") items.set(r.id, { id: r.id, lead: r.lead, reason: "Asked a question", category: r.category, receivedAt: r.sentAt!, subject: r.subject, flagged: false });
    else if (r.category === "Unclassified" && r.sentAt! < dayAgo) items.set(r.id, { id: r.id, lead: r.lead, reason: "Not classified for over a day", category: r.category, receivedAt: r.sentAt!, subject: r.subject, flagged: false });
  }
  return [...items.values()].sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
}
