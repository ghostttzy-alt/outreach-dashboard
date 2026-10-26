import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJson, route } from "@/lib/api";
import { getSettings, logActivity } from "@/lib/services";
import { rampInfo } from "@/lib/utils";
import { ApiError, SETTINGS_FIELDS, pickFields } from "@/lib/validate";

export const GET = route(async () => {
  const settings = await getSettings();
  return NextResponse.json({ data: { ...settings, ramp: rampInfo(settings) } });
});

export const PATCH = route(async (req) => {
  const before = await getSettings();
  const data = pickFields(await readJson(req), SETTINGS_FIELDS);
  const start = (data.sendStartHour as number | undefined) ?? before.sendStartHour;
  const end = (data.sendEndHour as number | undefined) ?? before.sendEndHour;
  if (end <= start) throw new ApiError(400, "Sending hours: the end hour must be after the start hour");
  if (data.paused === true && !before.paused) Object.assign(data, { pausedReason: "Paused manually", pausedAt: new Date() });
  if (data.paused === false && before.paused) Object.assign(data, { pausedReason: "", pausedAt: null });
  const settings = await prisma.settings.update({ where: { id: 1 }, data });
  if (settings.paused !== before.paused) await logActivity(null, settings.paused ? "paused" : "resumed", settings.paused ? "Outreach paused" : "Outreach resumed");
  return NextResponse.json({ data: settings });
});
