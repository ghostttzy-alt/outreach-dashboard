import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJson, route } from "@/lib/api";
import { addDoNotContact, markDoNotContact, normalizeEmail } from "@/lib/services";
import { ApiError } from "@/lib/validate";

// GET /api/dnc?email=  → the whole list, or whether one address is on it
export const GET = route(async (req) => {
  const email = new URL(req.url).searchParams.get("email");
  if (email) {
    const entry = await prisma.doNotContact.findUnique({ where: { email: normalizeEmail(email) } });
    return NextResponse.json({ data: { email: normalizeEmail(email), doNotContact: !!entry, entry } });
  }
  return NextResponse.json({ data: await prisma.doNotContact.findMany({ orderBy: { createdAt: "desc" }, take: 5000 }) });
});

// POST /api/dnc { "email": "...", "reason"?: "..." }  (or "emails": [...])
export const POST = route(async (req) => {
  const b = await readJson(req);
  const emails: string[] = (Array.isArray(b.emails) ? b.emails : [b.email]).map((e: unknown) => normalizeEmail(String(e ?? ""))).filter(Boolean);
  if (!emails.length) throw new ApiError(400, "email is required");
  for (const email of emails) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, `"${email}" is not a valid email address`);
    await addDoNotContact(email, String(b.reason ?? "Added manually"));
    const leads = await prisma.lead.findMany({ where: { email, stage: { not: "Do Not Contact" } }, select: { id: true } });
    for (const l of leads) await markDoNotContact(l.id, String(b.reason ?? "Added to Do Not Contact list"));
  }
  return NextResponse.json({ ok: true, added: emails.length }, { status: 201 });
});
