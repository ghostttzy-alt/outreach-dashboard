import type { Lead } from "@prisma/client";
import { prisma } from "./prisma";
import { BOUNCE_PAUSE_PCT } from "./constants";
import { getFollowUpsDue } from "./followups";
import { bounceStats, stripQuoted } from "./replies";
import { sendStatus } from "./sender";
import { addDays } from "./utils";

export function leadInfo(l: Lead) {
  return {
    id: l.id, businessName: l.businessName, contactName: l.contactName, email: l.email, phone: l.phone,
    niche: l.niche, city: l.city, website: l.website, websiteStatus: l.websiteStatus, mainProblem: l.mainProblem,
    score: l.score, stage: l.stage, notes: l.notes, mockupUrl: l.mockupUrl, source: l.source, sourceUrl: l.sourceUrl,
  };
}

const NO_ANSWER_NEEDED = ["Unsubscribe", "Not interested", "Bounce", "Auto-reply"];

/** Replies that still need an answer: no email to the lead has been written since they arrived. */
export async function getUnansweredReplies() {
  const replies = await prisma.email.findMany({
    where: {
      direction: "inbound",
      category: { notIn: NO_ANSWER_NEEDED },
      sentAt: { gte: addDays(new Date(), -60) },
      lead: { stage: { not: "Do Not Contact" } },
    },
    orderBy: { sentAt: "asc" },
    include: { lead: { include: { emails: { orderBy: [{ sentAt: "asc" }, { createdAt: "asc" }] } } } },
    take: 200,
  });
  return replies.filter((r) =>
    !r.lead.emails.some((e) => e.direction === "outbound" && e.createdAt > r.sentAt! && !["cancelled", "failed"].includes(e.status))
    // only the newest unanswered reply per lead
    && !r.lead.emails.some((e) => e.direction === "inbound" && e.sentAt! > r.sentAt! && !NO_ANSWER_NEEDED.includes(e.category)),
  );
}

export async function getInterestedNeedingMockups() {
  return prisma.lead.findMany({
    where: { stage: "Interested", mockupUrl: "", mockups: { none: {} } },
    include: { emails: { where: { direction: "inbound" }, orderBy: { sentAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "asc" },
  });
}

/** Queued leads with an email address and no outbound email at all yet (e.g. the user just filled the email in). */
export function getLeadsReadyForFirstEmail(take = 50) {
  return prisma.lead.findMany({ where: { stage: "Queued", email: { not: "" }, emails: { none: { direction: "outbound" } } }, orderBy: { createdAt: "asc" }, take });
}

/** Queued leads saved without an email address: the user looks one up (Facebook page, website) and fills it in. */
export function getLeadsNeedingEmail(take = 50) {
  return prisma.lead.findMany({ where: { stage: "Queued", email: "" }, orderBy: { createdAt: "asc" }, take });
}

/** Everything the daily Claude session needs, in one call. */
export async function buildBrief() {
  const now = new Date();
  const [send, bounce, unanswered, followUps, interested, coverage, queueCounts, stageGroups, lastRun, readyForFirst, needingEmail] = await Promise.all([
    sendStatus(now),
    bounceStats(now),
    getUnansweredReplies(),
    getFollowUpsDue(now),
    getInterestedNeedingMockups(),
    prisma.coverage.findMany({ where: { searchedAt: { gte: addDays(now, -30) } }, orderBy: { searchedAt: "desc" } }),
    prisma.email.groupBy({ by: ["status"], where: { direction: "outbound", status: { in: ["draft", "approved", "sending"] } }, _count: true }),
    prisma.lead.groupBy({ by: ["stage"], _count: true }),
    prisma.run.findFirst({ orderBy: { startedAt: "desc" } }),
    getLeadsReadyForFirstEmail(),
    getLeadsNeedingEmail(),
  ]);
  const { settings, state, ramp } = send;
  const q = Object.fromEntries(queueCounts.map((g) => [g.status, g._count]));
  const awaitingApproval = q.draft ?? 0;
  const approvedWaiting = (q.approved ?? 0) + (q.sending ?? 0);

  const combos = new Map<string, { city: string; niche: string; lastSearchedAt: Date; timesSearched: number; leadsFound: number }>();
  for (const c of coverage) {
    const key = `${c.city.toLowerCase()}|${c.niche.toLowerCase()}`;
    const e = combos.get(key);
    if (e) {
      e.timesSearched++;
      e.leadsFound += c.leadsFound;
    } else combos.set(key, { city: c.city, niche: c.niche, lastSearchedAt: c.searchedAt, timesSearched: 1, leadsFound: c.leadsFound });
  }

  return {
    generatedAt: now,
    settings: {
      yourName: settings.yourName,
      businessName: settings.businessName,
      mailingAddress: settings.mailingAddress,
      sendingEmail: settings.sendingEmail || state.gmailEmail,
      setupPrice: settings.setupPrice,
      monthlyFee: settings.monthlyFee,
      dailyLimit: settings.dailyLimit,
      rampSchedule: settings.rampSchedule,
      rampStartDate: settings.rampStartDate,
      timezone: settings.timezone,
      sendWindow: { startHour: settings.sendStartHour, endHour: settings.sendEndHour, weekends: settings.sendWeekends },
      targetCities: settings.targetCities,
      targetNiches: settings.targetNiches,
      chainBlocklist: settings.chainBlocklist,
      followup1Days: settings.followup1Days,
      followup2Days: settings.followup2Days,
      coldAfterDays: settings.coldAfterDays,
      paused: settings.paused,
      pausedReason: settings.pausedReason,
    },
    sending: {
      paused: settings.paused,
      gmailConnected: send.gmailConnected,
      gmailEmail: state.gmailEmail,
      rampWeek: ramp.week,
      todayLimit: ramp.limit,
      sentToday: send.sentToday,
      approvedWaiting,
      awaitingApproval,
      /** How many new emails (first emails + follow-ups) are worth writing today. */
      remainingSlots: Math.max(0, ramp.limit - send.sentToday - approvedWaiting - awaitingApproval),
      blockers: send.blockers,
    },
    deliverability: { ...bounce, pauseThresholdPct: BOUNCE_PAUSE_PCT },
    unansweredReplies: unanswered.map((r) => ({
      replyId: r.id,
      category: r.category,
      receivedAt: r.sentAt,
      subject: r.subject,
      text: stripQuoted(r.body),
      fullText: r.body,
      needsYou: r.needsYou,
      lead: leadInfo(r.lead),
      thread: r.lead.emails
        .filter((e) => e.sentAt && !["cancelled", "failed"].includes(e.status))
        .map((e) => ({ id: e.id, direction: e.direction, type: e.type, category: e.category || undefined, subject: e.subject, body: e.direction === "inbound" ? stripQuoted(e.body) : e.body, sentAt: e.sentAt })),
    })),
    followUpsDue: followUps.map((f) => ({
      leadId: f.lead.id,
      type: f.next,
      dueDate: f.dueDate,
      overdueDays: f.overdueDays,
      lead: leadInfo(f.lead),
      previousEmails: f.previousEmails,
    })),
    interestedNeedingMockups: interested.map((l) => ({
      leadId: l.id,
      lead: leadInfo(l),
      lastReply: l.emails[0] ? { id: l.emails[0].id, receivedAt: l.emails[0].sentAt, text: stripQuoted(l.emails[0].body) } : null,
    })),
    leadsReadyForFirstEmail: readyForFirst.map(leadInfo),
    leadsNeedingEmail: needingEmail.map(leadInfo),
    recentCoverage: [...combos.values()],
    leadsByStage: Object.fromEntries(stageGroups.map((g) => [g.stage, g._count])),
    lastRun: lastRun ? { startedAt: lastRun.startedAt, status: lastRun.status, counts: lastRun.counts } : null,
  };
}
