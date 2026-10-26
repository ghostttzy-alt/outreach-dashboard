import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJson, route } from "@/lib/api";
import { getSettings } from "@/lib/services";
import { rampInfo } from "@/lib/utils";
import { SETTINGS_FIELDS, pickFields } from "@/lib/validate";

export const GET = route(async () => {
  const settings = await getSettings();
  return NextResponse.json({ data: { ...settings, ramp: rampInfo(settings.rampStartDate, settings.dailyLimit) } });
});

export const PATCH = route(async (req) => {
  await getSettings();
  const data = await prisma.settings.update({ where: { id: 1 }, data: pickFields(await readJson(req), SETTINGS_FIELDS) });
  return NextResponse.json({ data });
});
