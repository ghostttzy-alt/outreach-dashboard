import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getSettings } from "./settings";
import { createLead, isDoNotContact, normalizeEmail } from "./services";
import { LEAD_FIELDS, pickFields } from "./validate";

// Duplicate, Do Not Contact and chain checks for new leads.

const SUFFIXES = /\b(llc|l\.l\.c|inc|incorporated|co|company|corp|corporation|ltd|limited|pllc|pc|the)\b/g;

function keyPart(s: string) {
  return s.toLowerCase().replace(/&/g, " and ").replace(SUFFIXES, " ").replace(/[^a-z0-9]+/g, "");
}

/** "Joe's Plumbing, LLC" + "Austin, TX" → "joesplumbing|austintx" */
export function dedupeKey(name: string, city: string) {
  return `${keyPart(name)}|${keyPart(city)}`;
}

export function websiteHost(url: string) {
  const s = url.trim().toLowerCase();
  if (!s) return "";
  try {
    return new URL(/^https?:\/\//.test(s) ? s : `https://${s}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Free mail hosts and social sites are shared by many businesses, so they never count as a duplicate website.
const SHARED_HOSTS = /(^|\.)(facebook|instagram|yelp|google|linkedin|twitter|x|tiktok|wix|squarespace|godaddysites|weebly|business\.site|nextdoor|angi|homeadvisor|thumbtack)\.[a-z.]+$/;

export type DuplicateCheck = {
  duplicate: boolean;
  doNotContact: boolean;
  blockedChain: string | null;
  matches: { id: string; businessName: string; city: string; email: string; stage: string; matchedOn: string[] }[];
};

export async function checkLead(input: { email?: string; name?: string; city?: string; website?: string }): Promise<DuplicateCheck> {
  const email = normalizeEmail(input.email ?? "");
  const name = (input.name ?? "").trim();
  const key = name ? dedupeKey(name, input.city ?? "") : "";
  const host = websiteHost(input.website ?? "");
  const or: Prisma.LeadWhereInput[] = [];
  if (email) or.push({ email });
  if (key && key !== "|") or.push({ dedupeKey: key });
  if (host && !SHARED_HOSTS.test(host)) or.push({ website: { contains: host, mode: "insensitive" } });

  const found = or.length ? await prisma.lead.findMany({ where: { OR: or }, take: 10 }) : [];
  const matches = found.map((l) => ({
    id: l.id, businessName: l.businessName, city: l.city, email: l.email, stage: l.stage,
    matchedOn: [
      email && l.email === email ? "email" : "",
      key && l.dedupeKey === key ? "name+city" : "",
      host && websiteHost(l.website) === host ? "website" : "",
    ].filter(Boolean),
  })).filter((m) => m.matchedOn.length);

  const settings = await getSettings();
  const lower = name.toLowerCase();
  const blockedChain = name ? settings.chainBlocklist.find((term) => term && lower.includes(term.toLowerCase())) ?? null : null;

  return { duplicate: matches.length > 0, doNotContact: email ? await isDoNotContact(email) : false, blockedChain, matches };
}

export type LeadResult =
  | { ok: true; id: string; businessName: string }
  | { ok: false; businessName: string; reason: "invalid" | "duplicate" | "do_not_contact" | "chain"; error: string; matches?: DuplicateCheck["matches"] };

/** Validate and create one lead, rejecting duplicates, Do Not Contact addresses and blocklisted chains. */
export async function addLead(raw: unknown, createdBy: string): Promise<LeadResult> {
  let data: Record<string, unknown>;
  try {
    const body = raw && typeof raw === "object" ? { ...(raw as Record<string, unknown>) } : raw;
    if (body && typeof body === "object" && "problem" in body && !("mainProblem" in body)) (body as Record<string, unknown>).mainProblem = (body as Record<string, unknown>).problem;
    data = pickFields(body, LEAD_FIELDS, ["businessName"]);
  } catch (err) {
    return { ok: false, businessName: String((raw as Record<string, unknown>)?.businessName ?? ""), reason: "invalid", error: (err as Error).message };
  }
  const businessName = data.businessName as string;
  const email = normalizeEmail((data.email as string) ?? "");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, businessName, reason: "invalid", error: `"${email}" is not a valid email address` };

  const check = await checkLead({ email, name: businessName, city: data.city as string, website: data.website as string });
  if (check.doNotContact) return { ok: false, businessName, reason: "do_not_contact", error: `${email} is on the Do Not Contact list` };
  if (check.blockedChain) return { ok: false, businessName, reason: "chain", error: `"${businessName}" matches the chain/franchise blocklist ("${check.blockedChain}")` };
  if (check.duplicate) return { ok: false, businessName, reason: "duplicate", error: `Already in your leads (${check.matches[0].matchedOn.join(", ")})`, matches: check.matches };

  const lead = await createLead({
    ...(data as Prisma.LeadUncheckedCreateInput),
    email,
    dedupeKey: dedupeKey(businessName, (data.city as string) ?? ""),
    createdBy: (data.createdBy as string) || createdBy,
  });
  return { ok: true, id: lead.id, businessName: lead.businessName };
}
