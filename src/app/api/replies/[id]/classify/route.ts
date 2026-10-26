import { NextResponse } from "next/server";
import { actor, readJson, route, type IdCtx } from "@/lib/api";
import { classifyReply } from "@/lib/replies";

// POST /api/replies/:id/classify { "category": "Interested", "needsYou"?: true, "note"?: "..." }
export const POST = route(async (req, { params }: IdCtx) => {
  const { id } = await params;
  const body = await readJson(req);
  const reply = await classifyReply(id, String(body.category ?? ""), {
    by: actor(req) === "daily-session" ? "api" : "dashboard",
    needsYou: typeof body.needsYou === "boolean" ? body.needsYou : undefined,
    note: typeof body.note === "string" ? body.note : undefined,
  });
  return NextResponse.json({ data: reply });
});
