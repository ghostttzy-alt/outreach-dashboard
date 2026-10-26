import { prisma } from "./prisma";
import { EMAIL_TYPES, PENDING_STATUSES, SENT_STATUSES } from "./constants";
import { isDoNotContact } from "./services";

export type DraftResult =
  | { ok: true; id: string; leadId: string; type: string }
  | { ok: false; leadId: string; type: string; error: string };

/** Add one email to the Approval Queue. Nothing is sent until it's approved on the dashboard. */
export async function addDraft(raw: unknown, createdBy: string): Promise<DraftResult> {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const leadId = String(d.leadId ?? "").trim();
  const type = String(d.type ?? "").trim();
  const subject = String(d.subject ?? "").trim();
  const body = String(d.body ?? "").trim();
  const fail = (error: string): DraftResult => ({ ok: false, leadId, type, error });

  if (!leadId) return fail("leadId is required");
  if (!(EMAIL_TYPES as readonly string[]).includes(type)) return fail(`type must be one of: ${EMAIL_TYPES.join(", ")}`);
  if (!body) return fail("body is required");
  if (type === "first" && !subject) return fail("subject is required for a first email");

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { emails: { where: { direction: "outbound" } } } });
  if (!lead) return fail("Lead not found");
  if (!lead.email) return fail(`${lead.businessName} has no email address`);
  if (lead.stage === "Do Not Contact" || (await isDoNotContact(lead.email))) return fail(`${lead.businessName} is on the Do Not Contact list`);

  const pending = lead.emails.find((e) => e.type === type && PENDING_STATUSES.includes(e.status));
  if (pending) return fail(`A ${type} email for this lead is already in the queue (${pending.id})`);
  const sentTypes = new Set(lead.emails.filter((e) => SENT_STATUSES.includes(e.status)).map((e) => e.type));
  if (type === "first" && sentTypes.has("first")) return fail("A first email was already sent to this lead");
  if (type === "followup1" || type === "followup2") {
    if (lead.nextFollowUpType !== type) return fail(`${type} isn't the next step for this lead (next: ${lead.nextFollowUpType || "none, the sequence has stopped"})`);
  }

  const email = await prisma.email.create({
    data: { leadId, direction: "outbound", type, subject, body, status: "draft", toAddress: lead.email, createdBy },
  });
  return { ok: true, id: email.id, leadId, type };
}
