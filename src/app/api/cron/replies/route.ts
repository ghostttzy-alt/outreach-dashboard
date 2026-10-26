import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { checkReplies } from "@/lib/replies";

export const dynamic = "force-dynamic";

// Called every 30 minutes by netlify/functions/check-replies.mts (and by "Check now" on the dashboard).
export const POST = route(async () => NextResponse.json({ data: await checkReplies() }));
