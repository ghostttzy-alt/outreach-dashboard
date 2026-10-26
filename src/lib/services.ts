import type { Lead, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { EMAIL_TYPE_LABELS, PENDING_STATUSES, SEQUENCE_STAGES, STAGE_RANK } from "./constants";
import { scheduleAfterSend } from "./followups";
import { getSettings, getState } from "./settings";
import { ApiError } from "./validate";

export { getSettings, getState };

export async function logActivity(leadId: string | null, type: string, description: string) {
  return prisma.activity.create({ data: { leadId, type, description } });
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** True when the address is on the Do Not Contact list or belongs to a lead marked Do Not Contact. */
export async function isDoNotContact(email: string) {
  const e = normalizeEmail(email);
  if (!e) return false;
  const [listed, lead] = await Promise.all([
    prisma.doNotContact.findUnique({ where: { email: e } }),
    prisma.lead.findFirst({ where: { email: e, stage: "Do Not Contact" }, select: { id: true } }),
  ]);
  return !!(listed || lead);
}

export async function addDoNotContact(email: string, reason: string) {
  const e = normalizeEmail(email);
  if (!e) return;
  await prisma.doNotContact.upsert({ where: { email: e }, update: {}, create: { email: e, reason } });
  // Every pending email to this address, for any lead, is cancelled.
  await prisma.email.updateMany({
    where: { direction: "outbound", status: { in: ["draft", "approved"] }, lead: { email: e } },
    data: { status: "cancelled", error: "Do Not Contact" },
  });
}

/** Cancel emails that haven't been sent yet. `types` limits it to e.g. follow-ups. */
export async function cancelPendingEmails(leadId: string, reason: string, types?: string[]) {
  const { count } = await prisma.email.updateMany({
    where: { leadId, direction: "outbound", status: { in: ["draft", "approved"] }, ...(types ? { type: { in: types } } : {}) },
    data: { status: "cancelled", error: reason },
  });
  return count;
}

/** Stop the follow-up sequence: nothing more is due and pending follow-ups are cancelled. */
export async function stopFollowUps(leadId: string, reason: string) {
  await prisma.lead.update({ where: { id: leadId }, data: { nextFollowUpType: "", nextFollowUpAt: null } });
  return cancelPendingEmails(leadId, reason, ["followup1", "followup2"]);
}

export async function createLead(data: Prisma.LeadUncheckedCreateInput) {
  const lead = await prisma.lead.create({ data: { ...data, email: normalizeEmail(data.email ?? "") } });
  await logActivity(lead.id, "lead_created", `Added ${lead.businessName}${lead.createdBy ? ` (by ${lead.createdBy})` : ""}`);
  return lead;
}

/** Update a lead, logging stage changes and applying the stage rules (Won → client, Do Not Contact → lock). */
export async function updateLead(id: string, data: Prisma.LeadUncheckedUpdateInput, reason = "") {
  const before = await prisma.lead.findUnique({ where: { id } });
  if (!before) throw new ApiError(404, "Lead not found");

  const patch = { ...data };
  if (typeof patch.email === "string") patch.email = normalizeEmail(patch.email);
  if (typeof patch.businessName === "string" || typeof patch.city === "string") {
    const { dedupeKey } = await import("./leads");
    patch.dedupeKey = dedupeKey(String(patch.businessName ?? before.businessName), String(patch.city ?? before.city));
  }
  if (typeof patch.stage === "string" && patch.stage !== before.stage) {
    if (patch.stage !== "Queued" && !before.dateContacted && patch.dateContacted === undefined && patch.stage !== "Do Not Contact") {
      patch.dateContacted = new Date();
    }
  }
  const lead = await prisma.lead.update({ where: { id }, data: patch });

  if (lead.stage !== before.stage) {
    await logActivity(id, "stage_change", `${lead.businessName}: ${before.stage} → ${lead.stage}${reason ? ` (${reason})` : ""}`);
    if (lead.stage === "Won") await ensureClient(lead);
    if (lead.stage === "Do Not Contact") {
      await addDoNotContact(lead.email, reason || "Marked Do Not Contact");
      await cancelPendingEmails(lead.id, "Do Not Contact");
    }
    if (!SEQUENCE_STAGES.includes(lead.stage)) await stopFollowUps(lead.id, `Lead moved to ${lead.stage}`);
  }
  if (lead.mockupUrl && lead.mockupUrl !== before.mockupUrl) await ensureMockupSite(lead);
  return lead;
}

export async function markDoNotContact(leadId: string, reason: string) {
  return updateLead(leadId, { stage: "Do Not Contact" }, reason);
}

/** Keep the Sites & mockups page in sync when a mockup link is added to a lead. */
async function ensureMockupSite(lead: Lead) {
  const existing = await prisma.site.findFirst({ where: { leadId: lead.id, type: "mockup", previewUrl: lead.mockupUrl } });
  if (existing) return existing;
  await logActivity(lead.id, "mockup_added", `Mockup added for ${lead.businessName}`);
  return prisma.site.create({ data: { leadId: lead.id, type: "mockup", status: "Mockup", previewUrl: lead.mockupUrl } });
}

async function ensureClient(lead: Lead) {
  const existing = await prisma.client.findUnique({ where: { leadId: lead.id } });
  if (existing) return existing;
  const settings = await getSettings();
  const client = await prisma.client.create({
    data: { leadId: lead.id, setupPrice: settings.setupPrice, monthlyFee: settings.monthlyFee },
  });
  await logActivity(lead.id, "client_won", `${lead.businessName} became a client`);
  return client;
}

/**
 * Move a lead forward to `stage`. Never moves backwards and never touches Do Not Contact.
 * With `fromClosed`, a Lost or Cold lead can be revived (e.g. a Cold lead who later replies "interested").
 */
export async function advanceStage(lead: Lead, stage: string, { fromClosed = false, reason = "" } = {}) {
  if (lead.stage === "Do Not Contact") return lead;
  const current = STAGE_RANK[lead.stage];
  if (current === undefined && !fromClosed) return lead;
  if (current !== undefined && STAGE_RANK[stage] <= current) return lead;
  return updateLead(lead.id, { stage }, reason);
}

const STAGE_FOR_OUTBOUND: Record<string, string> = {
  first: "Contacted",
  followup1: "Follow-up 1",
  followup2: "Follow-up 2",
  mockup: "Mockup Sent",
};

/** Side effects of an outbound email that just went out: timeline, stage, follow-up schedule. */
export async function applySentEffects(email: { leadId: string; type: string; sentAt: Date | null; gmailThreadId?: string }) {
  const lead = await prisma.lead.findUnique({ where: { id: email.leadId } });
  if (!lead) return;
  const label = EMAIL_TYPE_LABELS[email.type] ?? email.type;
  await logActivity(lead.id, "email_sent", `${label} sent to ${lead.businessName}`);
  const patch: Prisma.LeadUncheckedUpdateInput = {};
  if (!lead.dateContacted) patch.dateContacted = email.sentAt ?? new Date();
  if (email.gmailThreadId && !lead.gmailThreadId) patch.gmailThreadId = email.gmailThreadId;
  if (Object.keys(patch).length) await prisma.lead.update({ where: { id: lead.id }, data: patch });
  const target = STAGE_FOR_OUTBOUND[email.type];
  const updated = target ? await advanceStage(lead, target) : lead;
  await scheduleAfterSend(updated, email.type, email.sentAt ?? new Date());
}

async function assertContactable(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new ApiError(400, "Lead not found");
  if (lead.stage === "Do Not Contact" || (lead.email && (await isDoNotContact(lead.email)))) {
    throw new ApiError(403, `${lead.businessName} is on the Do Not Contact list; outbound email is blocked`);
  }
  return lead;
}

/**
 * Create an email from the dashboard or the generic /api/emails route.
 * Outbound drafts land in the Approval Queue; an outbound email with a sent status is logged as sent
 * (for mail sent outside the app). Inbound emails are saved as replies.
 */
export async function createEmail(data: Prisma.EmailUncheckedCreateInput) {
  const direction = data.direction ?? "outbound";
  if (direction === "inbound") {
    const { recordReply } = await import("./replies");
    return recordReply({
      leadId: data.leadId,
      subject: data.subject ?? "",
      body: data.body ?? "",
      receivedAt: data.sentAt ? new Date(data.sentAt) : new Date(),
      category: data.category || undefined,
      by: "dashboard",
    });
  }
  const lead = await assertContactable(data.leadId);
  const status = data.status ?? "draft";
  if (status === "sending") throw new ApiError(400, "status can't be sending");
  const sent = !PENDING_STATUSES.includes(status) && !["cancelled", "failed"].includes(status);
  const sentAt = sent ? (data.sentAt ? new Date(data.sentAt) : new Date()) : null;
  const email = await prisma.email.create({
    data: {
      ...data, direction, status, sentAt, toAddress: lead.email,
      approvedAt: status === "approved" ? new Date() : null,
      createdBy: data.createdBy || "dashboard",
    },
  });
  if (sent) await applySentEffects(email);
  return email;
}

export async function updateEmail(id: string, data: Prisma.EmailUncheckedUpdateInput) {
  const before = await prisma.email.findUnique({ where: { id } });
  if (!before) throw new ApiError(404, "Email not found");
  const patch = { ...data };
  const nextStatus = typeof patch.status === "string" ? patch.status : before.status;
  if (before.direction === "outbound" && ["sending", "sent"].includes(before.status) && (patch.subject !== undefined || patch.body !== undefined)) {
    if (patch.subject !== before.subject || patch.body !== before.body) throw new ApiError(409, "This email was already sent and can't be edited");
  }
  const loggingSend = PENDING_STATUSES.includes(before.status) && !PENDING_STATUSES.includes(nextStatus) && !["cancelled", "failed"].includes(nextStatus);
  if (before.direction === "outbound" && (loggingSend || nextStatus === "approved")) await assertContactable(before.leadId);
  if (loggingSend && patch.sentAt === undefined) patch.sentAt = new Date();
  if (nextStatus === "approved" && before.status !== "approved") patch.approvedAt = new Date();
  const email = await prisma.email.update({ where: { id }, data: patch });

  if (before.direction === "outbound" && loggingSend) await applySentEffects(email);
  if (email.status !== before.status && email.status === "bounced") {
    const { handleBounce } = await import("./replies");
    await handleBounce(email.leadId, email.id, "Marked bounced");
  }
  if (email.status !== before.status && email.status === "unsubscribed") {
    await markDoNotContact(email.leadId, "Unsubscribed");
  }
  return email;
}
