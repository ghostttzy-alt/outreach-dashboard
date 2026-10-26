import type { Lead } from "@prisma/client";
import { prisma } from "./prisma";
import { CLOSED_STAGES, PENDING_STATUSES } from "./constants";
import { getSettings } from "./settings";
import { startOfDayInTz } from "./utils";

// Follow-up timing (no AI): the server only tracks *when* a follow-up is due. The daily Claude session sees
// due follow-ups in /api/brief and writes them; they go through the Approval Queue like any other email.
//   first email sent      → follow-up 1 due `followup1Days` later (default 4)
//   follow-up 1 sent      → follow-up 2 due `followup2Days` later (default 5)
//   follow-up 2 sent      → marked Cold `coldAfterDays` later (default 5) if there's still no reply
// Any reply stops the sequence. A reply classified "Auto-reply" restarts it 5 days later.

const NEXT_AFTER: Record<string, { type: string; daysKey: "followup1Days" | "followup2Days" | "coldAfterDays" }> = {
  first: { type: "followup1", daysKey: "followup1Days" },
  followup1: { type: "followup2", daysKey: "followup2Days" },
  followup2: { type: "cold", daysKey: "coldAfterDays" },
};

/** Due dates fall at the start of the local day, so a follow-up is due on day N regardless of send time. */
async function dueDate(from: Date, days: number) {
  const settings = await getSettings();
  return startOfDayInTz(from, settings.timezone, days);
}

export async function scheduleAfterSend(lead: Lead, type: string, sentAt: Date) {
  const next = NEXT_AFTER[type];
  if (!next) return;
  if (lead.lastReplyAt) return; // they already replied; the sequence is over
  if (CLOSED_STAGES.includes(lead.stage)) return;
  const settings = await getSettings();
  await prisma.lead.update({
    where: { id: lead.id },
    data: { nextFollowUpType: next.type, nextFollowUpAt: await dueDate(sentAt, settings[next.daysKey]) },
  });
}

/** After an auto-reply (out of office etc.), pick the sequence back up `days` from now. */
export async function resumeFollowUps(leadId: string, days = 5) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { emails: { where: { direction: "outbound", sentAt: { not: null } } } } });
  if (!lead || CLOSED_STAGES.includes(lead.stage)) return null;
  const sent = new Set(lead.emails.map((e) => e.type));
  const type = sent.has("followup2") ? "cold" : sent.has("followup1") ? "followup2" : sent.has("first") ? "followup1" : "";
  if (!type) return null;
  const at = await dueDate(new Date(), days);
  await prisma.lead.update({ where: { id: leadId }, data: { nextFollowUpType: type, nextFollowUpAt: at } });
  return { type, at };
}

/** Leads whose next follow-up is due and that don't already have one waiting in the queue. */
export async function getFollowUpsDue(now = new Date()) {
  const leads = await prisma.lead.findMany({
    where: {
      nextFollowUpType: { in: ["followup1", "followup2"] },
      nextFollowUpAt: { lte: now },
      stage: { notIn: CLOSED_STAGES },
      email: { not: "" },
    },
    include: { emails: { where: { direction: "outbound" }, orderBy: { createdAt: "asc" } } },
    orderBy: { nextFollowUpAt: "asc" },
  });
  return leads
    .filter((l) => !l.emails.some((e) => e.type === l.nextFollowUpType && PENDING_STATUSES.includes(e.status)))
    .map(({ emails, ...lead }) => {
      const sent = emails.filter((e) => e.sentAt);
      return {
        lead,
        next: lead.nextFollowUpType as "followup1" | "followup2",
        dueDate: lead.nextFollowUpAt!,
        overdueDays: Math.max(0, Math.floor((now.getTime() - lead.nextFollowUpAt!.getTime()) / 86_400_000)),
        lastSentAt: sent.at(-1)?.sentAt ?? null,
        previousEmails: sent.map((e) => ({ id: e.id, type: e.type, subject: e.subject, body: e.body, sentAt: e.sentAt })),
      };
    });
}

/** Mark leads Cold once the last follow-up has gone unanswered long enough. Returns how many changed. */
export async function markColdLeads(now = new Date()) {
  const { updateLead } = await import("./services");
  const leads = await prisma.lead.findMany({ where: { nextFollowUpType: "cold", nextFollowUpAt: { lte: now } } });
  for (const lead of leads) {
    if (!CLOSED_STAGES.includes(lead.stage) && !lead.lastReplyAt) await updateLead(lead.id, { stage: "Cold" }, "no reply after follow-up 2");
    await prisma.lead.update({ where: { id: lead.id }, data: { nextFollowUpType: "", nextFollowUpAt: null } });
  }
  return leads.length;
}
