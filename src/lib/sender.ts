import type { Email, Lead, Settings } from "@prisma/client";
import { prisma } from "./prisma";
import { SEND_PRIORITY, SENT_STATUSES } from "./constants";
import { GmailAuthError, sendMail } from "./gmail";
import { getSettings, getState } from "./settings";
import { applySentEffects, isDoNotContact, logActivity } from "./services";
import { rampInfo, startOfDayInTz, zonedParts } from "./utils";

// Gradual sending. A Netlify scheduled function calls POST /api/cron/send every 2 minutes; each call sends
// at most ONE approved email, then waits a random 2–6 minutes before the next one is allowed. Every call
// re-checks: pause switch, Gmail connection, sending hours, daily limit/ramp and Do Not Contact.

const MIN_GAP_MS = 2 * 60_000;
const MAX_GAP_MS = 6 * 60_000;
const MAX_ATTEMPTS = 3;

export async function sentTodayCount(settings: Settings, now = new Date()) {
  return prisma.email.count({
    where: { direction: "outbound", status: { in: [...SENT_STATUSES, "sending"] }, sentAt: { gte: startOfDayInTz(now, settings.timezone) } },
  });
}

export function inSendWindow(settings: Settings, now = new Date()) {
  const p = zonedParts(now, settings.timezone);
  if (!settings.sendWeekends && (p.weekday === "Sat" || p.weekday === "Sun")) return false;
  return p.hour >= settings.sendStartHour && p.hour < settings.sendEndHour;
}

/** Everything that decides whether sending can happen right now, for the tick and for the dashboard. */
export async function sendStatus(now = new Date()) {
  const [settings, state] = await Promise.all([getSettings(), getState()]);
  const ramp = rampInfo(settings, now);
  const sentToday = await sentTodayCount(settings, now);
  const gmailConnected = !!state.gmailTokens && !state.gmailError;
  const blockers: string[] = [];
  if (settings.paused) blockers.push("paused");
  if (!gmailConnected) blockers.push("gmail");
  if (!inSendWindow(settings, now)) blockers.push("outside_hours");
  if (sentToday >= ramp.limit) blockers.push("daily_limit");
  return { settings, state, ramp, sentToday, remainingToday: Math.max(0, ramp.limit - sentToday), gmailConnected, blockers };
}

type TickResult = { status: string; emailId?: string; detail?: string; nextSendAt?: Date | null };

export async function sendTick(now = new Date()): Promise<TickResult> {
  const s = await sendStatus(now);
  await prisma.systemState.update({ where: { id: 1 }, data: { lastSendTickAt: now } });
  await recoverStuck(now);
  if (s.blockers.length) return { status: s.blockers[0] };
  if (s.state.nextSendAt && s.state.nextSendAt > now) return { status: "waiting", nextSendAt: s.state.nextSendAt };

  // Only one tick may send at a time.
  const lock = await prisma.systemState.updateMany({
    where: { id: 1, OR: [{ sendLockUntil: null }, { sendLockUntil: { lt: now } }] },
    data: { sendLockUntil: new Date(now.getTime() + 60_000) },
  });
  if (!lock.count) return { status: "busy" };

  try {
    const candidates = await prisma.email.findMany({
      where: { direction: "outbound", status: "approved" },
      orderBy: { approvedAt: "asc" },
      take: 50,
      include: { lead: true },
    });
    candidates.sort((a, b) => (SEND_PRIORITY[a.type] ?? 9) - (SEND_PRIORITY[b.type] ?? 9));
    for (const email of candidates) {
      // A follow-up approved early waits until it's due.
      const isFollowUp = email.type === "followup1" || email.type === "followup2";
      if (isFollowUp && email.lead.nextFollowUpType === email.type && email.lead.nextFollowUpAt && email.lead.nextFollowUpAt > now) continue;
      // Claim it so a parallel tick can't send it too.
      const claimed = await prisma.email.updateMany({ where: { id: email.id, status: "approved" }, data: { status: "sending", sendingAt: now, attempts: { increment: 1 } } });
      if (!claimed.count) continue;
      const blocked = await blockReason(email, email.lead);
      if (blocked) {
        await prisma.email.update({ where: { id: email.id }, data: { status: "cancelled", error: blocked } });
        await logActivity(email.leadId, "email_cancelled", `Didn't send ${email.type} to ${email.lead.businessName}: ${blocked}`);
        continue; // try the next one in the same tick; nothing was sent
      }
      return await deliver(email, email.lead, s.settings, s.state.gmailEmail, now);
    }
    return { status: "queue_empty" };
  } finally {
    await prisma.systemState.update({ where: { id: 1 }, data: { sendLockUntil: null } });
  }
}

/** Last-moment checks at the send layer. Returns why the email must not go out, or null. */
async function blockReason(email: Email, lead: Lead) {
  if (!lead.email) return "lead has no email address";
  if (lead.stage === "Do Not Contact" || (await isDoNotContact(lead.email))) return "address is on the Do Not Contact list";
  if (email.type === "first") {
    const already = await prisma.email.count({ where: { leadId: lead.id, direction: "outbound", type: "first", status: { in: SENT_STATUSES } } });
    if (already) return "a first email was already sent to this lead";
  }
  if (email.type === "followup1" || email.type === "followup2") {
    if (lead.nextFollowUpType !== email.type) return "follow-ups for this lead have stopped (they replied, bounced or moved stage)";
    if (lead.lastReplyAt) return "the lead replied";
  }
  if (["Lost", "Cold"].includes(lead.stage) && email.type !== "reply" && email.type !== "mockup") return `lead is ${lead.stage}`;
  return null;
}

/** Messages for the same lead go into the lead's existing Gmail thread. */
async function threadInfo(lead: Lead) {
  if (!lead.gmailThreadId) return null;
  const msgs = await prisma.email.findMany({
    where: { leadId: lead.id, gmailThreadId: lead.gmailThreadId, sentAt: { not: null } },
    orderBy: { sentAt: "asc" },
  });
  const first = msgs.find((m) => m.direction === "outbound");
  const ids = msgs.map((m) => m.rfcMessageId).filter(Boolean);
  return {
    threadId: lead.gmailThreadId,
    subject: first ? `Re: ${first.subject.replace(/^(re:\s*)+/i, "")}` : "",
    inReplyTo: ids.at(-1),
    references: ids.slice(-10).join(" ") || undefined,
  };
}

/** Cold emails must carry the mailing address and an opt-out line. Added only when the draft lacks them. */
export function withFooter(body: string, settings: Settings, type: string) {
  if (!["first", "followup1", "followup2"].includes(type)) return body;
  let out = body.trimEnd();
  const firstLine = settings.mailingAddress.split("\n")[0]?.trim();
  if (firstLine && !out.includes(firstLine)) {
    out += `\n\n${[settings.businessName, settings.mailingAddress.trim()].filter(Boolean).join("\n")}`;
  }
  if (!/unsubscribe|no thanks|opt out/i.test(out)) out += `\n\nIf you'd rather not hear from me, reply "unsubscribe" and I won't email again.`;
  return out;
}

async function deliver(email: Email, lead: Lead, settings: Settings, gmailEmail: string, now: Date): Promise<TickResult> {
  const thread = email.type === "first" ? null : await threadInfo(lead);
  const subject = thread?.subject || email.subject;
  const body = withFooter(email.body, settings, email.type);
  try {
    const sent = await sendMail({
      from: gmailEmail,
      fromName: settings.yourName || undefined,
      to: lead.email,
      subject,
      body,
      threadId: thread?.threadId,
      inReplyTo: thread?.inReplyTo,
      references: thread?.references,
    });
    const updated = await prisma.email.update({
      where: { id: email.id },
      data: {
        status: "sent", sentAt: now, subject, body, error: "",
        fromAddress: gmailEmail, toAddress: lead.email,
        gmailMessageId: sent.id, gmailThreadId: sent.threadId, rfcMessageId: sent.rfcMessageId,
      },
    });
    await applySentEffects(updated);
    const gap = MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
    const nextSendAt = new Date(now.getTime() + gap);
    await prisma.systemState.update({ where: { id: 1 }, data: { nextSendAt } });
    return { status: "sent", emailId: email.id, nextSendAt };
  } catch (err) {
    const message = (err as Error).message;
    if (err instanceof GmailAuthError) {
      // Not the email's fault: put it back and wait for Gmail to be reconnected.
      await prisma.email.update({ where: { id: email.id }, data: { status: "approved", attempts: { decrement: 1 }, error: message } });
      return { status: "gmail", detail: message };
    }
    const failed = email.attempts + 1 >= MAX_ATTEMPTS;
    await prisma.email.update({ where: { id: email.id }, data: { status: failed ? "failed" : "approved", error: message } });
    if (failed) await logActivity(lead.id, "email_failed", `Sending to ${lead.businessName} failed: ${message}`);
    await prisma.systemState.update({ where: { id: 1 }, data: { nextSendAt: new Date(now.getTime() + MIN_GAP_MS) } });
    return { status: failed ? "failed" : "retry", emailId: email.id, detail: message };
  }
}

/** An email stuck in "sending" (the function was cut off mid-send) is marked failed so it's never sent twice. */
async function recoverStuck(now: Date) {
  await prisma.email.updateMany({
    where: { status: "sending", sendingAt: { lt: new Date(now.getTime() - 10 * 60_000) } },
    data: { status: "failed", error: "Sending was interrupted. Check Gmail's Sent folder before re-approving." },
  });
}
