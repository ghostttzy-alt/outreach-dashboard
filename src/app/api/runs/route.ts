import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJson, route } from "@/lib/api";
import { logActivity } from "@/lib/services";
import { ApiError } from "@/lib/validate";

// GET /api/runs?limit=30
export const GET = route(async (req) => {
  const take = Math.min(Number(new URL(req.url).searchParams.get("limit")) || 30, 200);
  return NextResponse.json({ data: await prisma.run.findMany({ orderBy: { startedAt: "desc" }, take }) });
});

// POST /api/runs { startedAt?, status?: ok|partial|failed, counts: {...}, notes?, errors?: [...] }
export const POST = route(async (req) => {
  const b = await readJson(req);
  const status = b.status ?? (Array.isArray(b.errors) && b.errors.length ? "partial" : "ok");
  if (!["ok", "partial", "failed"].includes(status)) throw new ApiError(400, "status must be ok, partial or failed");
  if (b.counts !== undefined && (typeof b.counts !== "object" || Array.isArray(b.counts))) throw new ApiError(400, "counts must be an object, e.g. { \"leadsAdded\": 12 }");
  const errors = b.errors === undefined ? [] : Array.isArray(b.errors) ? b.errors : [b.errors];
  const startedAt = b.startedAt ? new Date(b.startedAt) : new Date();
  if (Number.isNaN(startedAt.getTime())) throw new ApiError(400, "startedAt must be a valid date");
  const run = await prisma.run.create({
    data: { startedAt, status, counts: b.counts ?? {}, notes: String(b.notes ?? ""), errors },
  });
  await logActivity(null, "run", `Daily session finished (${status})${errors.length ? `, ${errors.length} error(s)` : ""}`);
  return NextResponse.json({ data: run }, { status: 201 });
});
