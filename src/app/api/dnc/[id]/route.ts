import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { route, type IdCtx } from "@/lib/api";
import { ApiError } from "@/lib/validate";

// DELETE /api/dnc/:id  (dashboard only: the daily session can add to the list but never remove from it)
export const DELETE = route(async (req, { params }: IdCtx) => {
  if (req.headers.get("x-api-key")) throw new ApiError(403, "Entries can only be removed from the dashboard");
  const { id } = await params;
  await prisma.doNotContact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
