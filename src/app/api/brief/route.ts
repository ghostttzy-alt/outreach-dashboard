import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { buildBrief } from "@/lib/brief";

export const dynamic = "force-dynamic";

// GET /api/brief: everything the daily Claude session needs in one call. See README.
export const GET = route(async () => NextResponse.json({ data: await buildBrief() }));
