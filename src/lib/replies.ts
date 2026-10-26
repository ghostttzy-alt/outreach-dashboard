import { prisma } from "./prisma";
import { BOUNCE_PAUSE_PCT, REPLY_CATEGORIES, SENT_STATUSES } from "./constants";
import { markColdLeads, resumeFollowUps } from "./followups";
import { GmailAuthError, getMessage, header, listMessageIds, messageText, type GmailMessage } from "./gmail";
import { getSettings, getState } from "./settings";
import { advanceStage, cancelPendingEmails, logActivity, markDoNotContact, normalizeEmail, stopFollowUps, updateLead } from "./services";
import { pct } from "./utils";
import { ApiError } from "./validate";

// Reply checking (no AI): find replies and bounces on our Gmail threads, save them as "Unclassified",
// catch bounces and obvious opt-outs by keyword, and stop follow-ups. Real classification comes from the
// daily Claude session through POST /api/replies/:id/classify, which runs classifyReply below.

// ---------- Text helpers ----------

/** Remove quoted history ("On ... wrote:", "> ..." lines, Outlook headers) so only the new text is left. */
export function stripQuoted(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1] ?? "";
    if (/^\s*On\b.*\bwrote:\s*$/i.test(line) || (/^\s*On\b/i.test(line) && /^\s*.*wrote:\s*$/i.test(next) && line.length < 200)) break;
    if (/^\s*-{2,}\s*(Original|Forwarded) Message\s*-{2,}/i.test(line)) break;
    if (/^\s*_{8,}\s*$/.test(line)) break;
    if (/^\s*From:\s.+/i.test(line) && /^\s*(Sent|Date|To):\s/i.test(next)) break;
    if (/^\s*>/.test(line)) continue;
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const OPT_OUT: { re: RegExp; category: "Unsubscribe" | "Not interested" }[] = [
  { re: /\bunsubscribe\b/i, category: "Unsubscribe" },
  { re: /\bremove me\b/i, category: "Unsubscribe" },
  { re: /\bstop (e-?mailing|emailing|contacting|sending|messaging|writing)\b/i, category: "Unsubscribe" },
  { re: /\bplease stop\b/i, category: "Unsubscribe" },
  { re: /\bnot interested\b/i, category: "Not interested" },
  { re: /\bno,? thanks?\b/i, category: "Not interested" },
  { re: /\bno,? thank you\b/i, category: "Not interested" },
];

/** Keyword opt-out check on the new text of a reply. A bare "stop" only counts in a short message. */
export function detectOptOut(newText: string): "Unsubscribe" | "Not interested" | null {
  for (const { re, category } of OPT_OUT) if (re.test(newText)) return category;
  const words = newText.split(/\s+/).filter(Boolean);
  if (words.length <= 8 && /\bstop\b/i.test(newText)) return "Unsubscribe";
  return null;
}

const BOUNCE_FROM = /mailer-daemon|postmaster|mail delivery (sub)?system/i;
const BOUNCE_SUBJECT = /delivery status notification|undeliver|delivery (has )?failed|failure notice|returned mail|mail delivery failed|could not be delivered|address not found/i;

export function isBounce(from: string, subject: string) {
  return BOUNCE_FROM.test(from) || (BOUNCE_SUBJECT.test(subject) && /daemon|postmaster|mail/i.test(from));
}

function isAutoReply(msg: GmailMessage, subject: string) {
  const auto = header(msg, "Auto-Submitted").toLowerCase();
  if (auto && auto !== "no") return true;
  if (header(msg, "X-Autoreply") || header(msg, "X-Autorespond")) return true;
  return /^(automatic reply|auto[- ]?reply|out of (the )?office)/i.test(subject);
}

// ---------- Bounce rate ----------

/** Share of emails sent in the last 7 days that bounced. */
export async function bounceStats(now = new Date()) {
  const since = new Date(now.getTime() - 7 * 86_400_000);
  const [sent, bounced] = await Promise.all([
    prisma.email.count({ where: { direction: "outbound", status: { in: SENT_STATUSES }, sentAt: { gte: since } } }),
    prisma.email.count({ where: { direction: "outbound", status: "bounced", sentAt: { gte: since } } }),
  ]);
  return { sent7d: sent, bounced7d: bounced, bounceRate7d: pct(bounced, sent) };
}

/** Pause all outreach when the 7-day bounce rate goes above 5%. Runs whenever a new bounce comes in. */
async function checkBounceRate() {
  const stats = await bounceStats();
  if (stats.bounceRate7d <= BOUNCE_PAUSE_PCT) return false;
  const settings = await getSettings();
  if (settings.paused) return true;
  const reason = `Bounce rate is ${stats.bounceRate7d}% over the last 7 days (${stats.bounced7d} of ${stats.sent7d}). Sending paused automatically.`;
  await prisma.settings.update({ where: { id: 1 }, data: { paused: true, pausedReason: reason, pausedAt: new Date() } });
  await logActivity(null, "auto_pause", reason);
  return true;
}

export async function handleBounce(leadId: string, outboundEmailId: string | null, detail: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;
  const target = outboundEmailId
    ? await prisma.email.findUnique({ where: { id: outboundEmailId } })
    : await prisma.email.findFirst({ where: { leadId, direction: "outbound", sentAt: { not: null } }, orderBy: { sentAt: "desc" } });
  if (target && target.direction === "outbound" && target.status !== "bounced") {
    await prisma.email.update({ where: { id: target.id }, data: { status: "bounced" } });
  }
  await logActivity(lead.id, "email_bounced", `Email to ${lead.businessName} bounced${detail ? ` (${detail})` : ""}`);
  await stopFollowUps(lead.id, "Bounced");
  await cancelPendingEmails(lead.id, "Bounced");
  if (!["Lost", "Do Not Contact", "Won"].includes(lead.stage)) await updateLead(lead.id, { stage: "Lost" }, "email bounced");
  await checkBounceRate();
}

/** The latest real reply (auto-replies and bounces don't count). */
async function recomputeLastReply(leadId: string) {
  const last = await prisma.email.findFirst({
    where: { leadId, direction: "inbound", category: { notIn: ["Auto-reply", "Bounce"] } },
    orderBy: { sentAt: "desc" },
  });
  await prisma.lead.update({ where: { id: leadId }, data: { lastReplyAt: last?.sentAt ?? null } });
}

// ---------- Saving and classifying replies ----------

type ReplyInput = {
  leadId: string;
  subject: string;
  body: string;
  receivedAt: Date;
  fromAddress?: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
  rfcMessageId?: string;
  category?: string;
  autoReply?: boolean;
  by: "gmail" | "dashboard" | "api";
};

/** Save an inbound reply. Any reply stops the follow-up sequence; obvious opt-outs go straight to Do Not Contact. */
export async function recordReply(r: ReplyInput) {
  const lead = await prisma.lead.findUnique({ where: { id: r.leadId } });
  if (!lead) throw new ApiError(400, "Lead not found");
  const email = await prisma.email.create({
    data: {
      leadId: r.leadId, direction: "inbound", type: "reply", status: "received",
      subject: r.subject, body: r.body, sentAt: r.receivedAt, category: "Unclassified",
      fromAddress: r.fromAddress ?? lead.email, toAddress: "", createdBy: r.by,
      gmailMessageId: r.gmailMessageId ?? null, gmailThreadId: r.gmailThreadId ?? "", rfcMessageId: r.rfcMessageId ?? "",
    },
  });
  await logActivity(lead.id, "email_received", `Reply from ${lead.businessName}: ${r.subject || "(no subject)"}`);
  await prisma.lead.update({ where: { id: lead.id }, data: { lastReplyAt: r.receivedAt } });
  await prisma.email.updateMany({ where: { leadId: lead.id, direction: "outbound", status: { in: ["sent", "opened"] } }, data: { status: "replied" } });
  await stopFollowUps(lead.id, "Lead replied");

  const optOut = detectOptOut(stripQuoted(r.body));
  if (r.category && r.category !== "Unclassified") return classifyReply(email.id, r.category, { by: r.by === "gmail" ? "auto" : r.by });
  if (optOut) return classifyReply(email.id, optOut, { by: "keyword" });
  if (r.autoReply) return classifyReply(email.id, "Auto-reply", { by: "auto" });
  return email;
}

type ClassifyOptions = { by?: string; needsYou?: boolean; note?: string };

/**
 * Apply a category to a reply and run its rule:
 *  Unsubscribe / Not interested → Do Not Contact, all pending email cancelled
 *  Auto-reply → follow-ups pick up again in 5 days
 *  Interested → stage Interested · Question → stage Replied · Not now → stage Cold
 *  Bounce → lead Lost, counts toward the bounce rate
 */
export async function classifyReply(emailId: string, category: string, opts: ClassifyOptions = {}) {
  if (!(REPLY_CATEGORIES as readonly string[]).includes(category)) {
    throw new ApiError(400, `category must be one of: ${REPLY_CATEGORIES.join(", ")}`);
  }
  const email = await prisma.email.findUnique({ where: { id: emailId }, include: { lead: true } });
  if (!email) throw new ApiError(404, "Reply not found");
  if (email.direction !== "inbound") throw new ApiError(400, "Only inbound emails (replies) can be classified");

  const updated = await prisma.email.update({
    where: { id: emailId },
    data: {
      category,
      classifiedAt: new Date(),
      classifiedBy: opts.by ?? "api",
      ...(opts.needsYou !== undefined ? { needsYou: opts.needsYou } : {}),
      ...(opts.note !== undefined ? { needsYouNote: opts.note } : {}),
    },
  });
  const lead = email.lead;
  if (category !== email.category) await logActivity(lead.id, "reply_classified", `Reply from ${lead.businessName} classified as ${category}`);

  switch (category) {
    case "Unsubscribe":
    case "Not interested":
      await markDoNotContact(lead.id, category === "Unsubscribe" ? "Asked to unsubscribe" : "Not interested");
      break;
    case "Auto-reply":
      await recomputeLastReply(lead.id);
      await resumeFollowUps(lead.id, 5);
      break;
    case "Interested":
      await advanceStage(lead, "Interested", { fromClosed: true, reason: "replied interested" });
      break;
    case "Question":
      await advanceStage(lead, "Replied", { fromClosed: true, reason: "asked a question" });
      break;
    case "Not now":
      if (!["Won", "Do Not Contact"].includes(lead.stage)) await updateLead(lead.id, { stage: "Cold" }, "said not now");
      break;
    case "Bounce":
      await recomputeLastReply(lead.id);
      await handleBounce(lead.id, null, "classified as bounce");
      break;
  }
  return updated;
}

// ---------- Checking Gmail ----------

const MAX_PER_RUN = 25;

/**
 * Look for new messages on our threads (and bounce notices) since the last check.
 * Processes at most MAX_PER_RUN messages or ~7 seconds per call; the next run picks up the rest.
 */
export async function checkReplies(now = new Date()) {
  const started = Date.now();
  const state = await getState();
  const result = { checked: 0, replies: 0, bounces: 0, optOuts: 0, cold: 0, remaining: false, error: "" };
  try {
    result.cold = await markColdLeads(now);
    if (!state.gmailTokens || state.gmailError) {
      result.error = state.gmailTokens ? state.gmailError : "Gmail not connected";
      return result;
    }

    const sinceDays = state.lastReplyCheckAt
      ? Math.min(30, Math.max(2, Math.ceil((now.getTime() - state.lastReplyCheckAt.getTime()) / 86_400_000) + 1))
      : 14;
    const [threadMsgs, bounceMsgs] = await Promise.all([
      listMessageIds(`-from:me newer_than:${sinceDays}d`),
      listMessageIds(`from:(mailer-daemon OR postmaster) newer_than:${sinceDays}d`, 100),
    ]);

    // Only messages on threads we started, plus bounce notices, and only ones we haven't saved yet.
    const threadIds = [...new Set(threadMsgs.map((m) => m.threadId))];
    const ours = new Map(
      (await prisma.email.findMany({
        where: { direction: "outbound", gmailThreadId: { in: threadIds } },
        select: { id: true, leadId: true, gmailThreadId: true, sentAt: true },
        orderBy: { sentAt: "asc" },
      })).map((e) => [e.gmailThreadId, e]),
    );
    const candidates = new Map<string, { id: string; threadId: string }>();
    for (const m of [...threadMsgs.filter((m) => ours.has(m.threadId)), ...bounceMsgs]) candidates.set(m.id, m);
    const seen = new Set(
      (await prisma.email.findMany({ where: { gmailMessageId: { in: [...candidates.keys()] } }, select: { gmailMessageId: true } }))
        .map((e) => e.gmailMessageId),
    );
    const seenBounces = new Set(
      (await prisma.activity.findMany({ where: { type: "bounce_notice", description: { in: [...candidates.keys()].map((id) => `gmail:${id}`) } }, select: { description: true } }))
        .map((a) => a.description.slice(6)),
    );
    const todo = [...candidates.values()].filter((m) => !seen.has(m.id) && !seenBounces.has(m.id));

    for (const m of todo) {
      if (result.checked >= MAX_PER_RUN || Date.now() - started > 7000) {
        result.remaining = true;
        break;
      }
      result.checked++;
      const msg = await getMessage(m.id);
      const from = header(msg, "From");
      const subject = header(msg, "Subject");
      const receivedAt = msg.internalDate ? new Date(Number(msg.internalDate)) : now;
      const body = messageText(msg);
      const thread = ours.get(m.threadId);

      if (isBounce(from, subject)) {
        const leadId = thread?.leadId ?? (await leadForBounce(msg, body));
        // Remember the notice so it isn't processed again, even when no lead matched.
        await prisma.activity.create({ data: { leadId: leadId ?? null, type: "bounce_notice", description: `gmail:${m.id}` } });
        if (!leadId) continue;
        const outbound = thread
          ? await prisma.email.findFirst({ where: { leadId, direction: "outbound", gmailThreadId: m.threadId, sentAt: { not: null } }, orderBy: { sentAt: "desc" } })
          : null;
        await handleBounce(leadId, outbound?.id ?? null, subject);
        result.bounces++;
        continue;
      }
      if (!thread) continue;

      const reply = await recordReply({
        leadId: thread.leadId,
        subject,
        body,
        receivedAt,
        fromAddress: extractAddress(from),
        gmailMessageId: m.id,
        gmailThreadId: m.threadId,
        rfcMessageId: header(msg, "Message-ID"),
        autoReply: isAutoReply(msg, subject),
        by: "gmail",
      });
      result.replies++;
      if (reply.category === "Unsubscribe" || reply.category === "Not interested") result.optOuts++;
    }

    if (!result.remaining) await prisma.systemState.update({ where: { id: 1 }, data: { lastReplyCheckAt: now, replyCheckError: "" } });
  } catch (err) {
    result.error = (err as Error).message;
    await prisma.systemState.update({ where: { id: 1 }, data: { replyCheckError: result.error } });
    if (!(err instanceof GmailAuthError)) console.error("checkReplies", err);
  }
  return result;
}

function extractAddress(from: string) {
  const m = from.match(/<([^>]+)>/);
  return normalizeEmail(m ? m[1] : from);
}

/** For bounce notices outside our threads: find the lead from X-Failed-Recipients or addresses in the text. */
async function leadForBounce(msg: GmailMessage, body: string) {
  const failed = header(msg, "X-Failed-Recipients");
  const addresses = [...new Set(`${failed} ${body}`.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)?.map(normalizeEmail) ?? [])];
  if (!addresses.length) return null;
  const lead = await prisma.lead.findFirst({
    where: { email: { in: addresses }, emails: { some: { direction: "outbound", sentAt: { not: null } } } },
    select: { id: true },
  });
  return lead?.id ?? null;
}
