import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJson, route, type IdCtx } from "@/lib/api";
import { updateEmail } from "@/lib/services";
import { ApiError } from "@/lib/validate";

// PATCH /api/drafts/:id { subject?, body?, status?: "draft" | "approved" | "cancelled" }
export const PATCH = route(async (req, { params }: IdCtx) => {
  const { id } = await params;
  const email = await prisma.email.findUnique({ where: { id } });
  if (!email || email.direction !== "outbound") throw new ApiError(404, "Draft not found");
  if (!["draft", "approved", "failed", "cancelled"].includes(email.status)) throw new ApiError(409, `This email is ${email.status} and can't be changed`);
  const body = await readJson(req);
  const patch: Record<string, unknown> = {};
  if (typeof body.subject === "string") patch.subject = body.subject.trim();
  if (typeof body.body === "string") patch.body = body.body.trim();
  if (body.status !== undefined) {
    if (!["draft", "approved", "cancelled"].includes(body.status)) throw new ApiError(400, "status must be draft, approved or cancelled");
    patch.status = body.status;
    if (body.status !== "cancelled") patch.error = "";
    if (body.status === "draft") patch.attempts = 0;
  }
  return NextResponse.json({ data: await updateEmail(id, patch) });
});

// DELETE /api/drafts/:id  removes a draft that hasn't been sent.
export const DELETE = route(async (_req, { params }: IdCtx) => {
  const { id } = await params;
  const email = await prisma.email.findUnique({ where: { id } });
  if (!email || email.direction !== "outbound") throw new ApiError(404, "Draft not found");
  if (!["draft", "approved", "failed", "cancelled"].includes(email.status)) throw new ApiError(409, "Sent emails can't be deleted here");
  await prisma.email.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
