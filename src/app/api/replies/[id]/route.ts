import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJson, route, type IdCtx } from "@/lib/api";
import { ApiError } from "@/lib/validate";

// PATCH /api/replies/:id { "needsYou": false, "note"?: "..." }  flag or unflag a reply for a human
export const PATCH = route(async (req, { params }: IdCtx) => {
  const { id } = await params;
  const b = await readJson(req);
  if (typeof b.needsYou !== "boolean") throw new ApiError(400, "needsYou must be true or false");
  const email = await prisma.email.findUnique({ where: { id } });
  if (!email || email.direction !== "inbound") throw new ApiError(404, "Reply not found");
  const data = await prisma.email.update({
    where: { id },
    data: { needsYou: b.needsYou, ...(typeof b.note === "string" ? { needsYouNote: b.note } : {}) },
  });
  return NextResponse.json({ data });
});
