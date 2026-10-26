import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { sendTick } from "@/lib/sender";

export const dynamic = "force-dynamic";

// Called every 2 minutes by netlify/functions/send-tick.mts. Sends at most one approved email.
export const POST = route(async () => NextResponse.json({ data: await sendTick() }));
