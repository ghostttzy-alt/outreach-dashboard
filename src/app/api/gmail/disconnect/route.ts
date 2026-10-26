import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { disconnectGmail } from "@/lib/gmail";
import { logActivity } from "@/lib/services";

export const POST = route(async () => {
  await disconnectGmail();
  await logActivity(null, "gmail_disconnected", "Gmail disconnected");
  return NextResponse.json({ ok: true });
});
