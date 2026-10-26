import type { Lead, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { EMAIL_TYPE_LABELS, STAGE_RANK } from "./constants";
import { ApiError } from "./validate";

export async function getSettings() {
  return prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

export async function logActivity(leadId: string | null, type: string, description: string) {
  return prisma.activity.create({ data: { leadId, type, description } });
}

export async function createLead(data: Prisma.LeadUncheckedCreateInput) {
  const lead = await prisma.lead.create({ data });
  await logActivity(lead.id, "lead_created", `Added ${lead.businessName}`);
  return lead;
}

/** Update a lead, logging stage changes and creating a client record when a lead is won. */
export async function updateLead(id: string, data: Prisma.LeadUncheckedUpdateInput) {
  const before = await prisma.lead.findUnique({ where: { id } });
  if (!before) throw new ApiError(404, "Lead not found");

  const patch = { ...data };
  if (typeof patch.stage === "string" && patch.stage !== before.stage) {
    if (patch.stage !== "Queued" && !before.dateContacted && patch.dateContacted === undefined && patch.stage !== "Do Not Contact") {
      patch.dateContacted = new Date();
    }
  }
  const lead = await prisma.lead.update({ where: { id }, data: patch });

  if (lead.stage !== before.stage) {
    await logActivity(id, "stage_change", `${lead.businessName}: ${before.stage} → ${lead.stage}`);
    if (lead.stage === "Won") await ensureClient(lead);
  }
  if (lead.mockupUrl && lead.mockupUrl !== before.mockupUrl) await ensureMockupSite(lead);
  return lead;
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

/** Move a lead forward to `stage`, but never backwards and never out of a closed stage. */
async function advanceStage(lead: Lead, stage: string) {
  const current = STAGE_RANK[lead.stage];
  if (current === undefined) return lead; // Lost / Cold / Do Not Contact stay put
  if (STAGE_RANK[stage] <= current) return lead;
  return updateLead(lead.id, { stage });
}

const STAGE_FOR_OUTBOUND: Record<string, string> = {
  first: "Contacted",
  followup1: "Follow-up 1",
  followup2: "Follow-up 2",
  mockup: "Mockup Sent",
};

/** Apply the pipeline side effects of an email that was just sent, received, bounced or unsubscribed. */
async function applyEmailEffects(email: { leadId: string; direction: string; type: string; status: string; subject: string }) {
  const lead = await prisma.lead.findUnique({ where: { id: email.leadId } });
  if (!lead) return;
  const label = EMAIL_TYPE_LABELS[email.type] ?? email.type;

  if (email.status === "unsubscribed") {
    await logActivity(lead.id, "unsubscribe", `${lead.businessName} unsubscribed`);
    await updateLead(lead.id, { stage: "Do Not Contact" });
    return;
  }
  if (email.status === "bounced") {
    await logActivity(lead.id, "email_bounced", `${label} to ${lead.businessName} bounced`);
    return;
  }
  if (email.direction === "inbound") {
    await logActivity(lead.id, "email_received", `Reply from ${lead.businessName}: ${email.subject || "(no subject)"}`);
    // Mark the outbound emails they were replying to.
    await prisma.email.updateMany({
      where: { leadId: lead.id, direction: "outbound", status: { in: ["sent", "opened"] } },
      data: { status: "replied" },
    });
    await advanceStage(lead, "Replied");
    return;
  }
  if (email.status === "draft") return;
  await logActivity(lead.id, "email_sent", `${label} sent to ${lead.businessName}`);
  if (!lead.dateContacted) await prisma.lead.update({ where: { id: lead.id }, data: { dateContacted: new Date() } });
  const target = STAGE_FOR_OUTBOUND[email.type];
  if (target) await advanceStage(lead, target);
}

async function assertContactable(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new ApiError(400, "Lead not found");
  if (lead.stage === "Do Not Contact") {
    throw new ApiError(403, `${lead.businessName} is marked Do Not Contact; outbound email is blocked`);
  }
}

export async function createEmail(data: Prisma.EmailUncheckedCreateInput) {
  const direction = data.direction ?? "outbound";
  if (direction === "outbound") await assertContactable(data.leadId);
  const status = data.status ?? (direction === "inbound" ? "replied" : "draft");
  const sentAt = data.sentAt !== undefined ? data.sentAt : status === "draft" ? null : new Date();
  const email = await prisma.email.create({ data: { ...data, direction, status, sentAt } });
  await applyEmailEffects(email);
  return email;
}

export async function updateEmail(id: string, data: Prisma.EmailUncheckedUpdateInput) {
  const before = await prisma.email.findUnique({ where: { id } });
  if (!before) throw new ApiError(404, "Email not found");
  const patch = { ...data };
  const sending = before.status === "draft" && typeof patch.status === "string" && patch.status !== "draft";
  if (sending && before.direction === "outbound") {
    await assertContactable(before.leadId);
    if (patch.sentAt === undefined) patch.sentAt = new Date();
  }
  const email = await prisma.email.update({ where: { id }, data: patch });
  if (email.status !== before.status && (sending || ["bounced", "unsubscribed"].includes(email.status))) {
    await applyEmailEffects(email);
  }
  return email;
}
