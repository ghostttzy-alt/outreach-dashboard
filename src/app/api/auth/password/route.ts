import { NextResponse } from "next/server";
import { readJson, route } from "@/lib/api";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getState } from "@/lib/services";
import { ApiError } from "@/lib/validate";

// POST /api/auth/password { "current": "...", "next": "..." }  (signed-in browser only)
export const POST = route(async (req) => {
  if (req.headers.get("x-api-key")) throw new ApiError(403, "Change the password from the dashboard");
  const { current, next } = await readJson(req);
  if (typeof next !== "string" || next.length < 10) throw new ApiError(400, "New password must be at least 10 characters");
  const state = await getState();
  const valid = state.passwordHash
    ? await verifyPassword(String(current ?? ""), state.passwordHash)
    : String(current ?? "") === (process.env.DASHBOARD_PASSWORD ?? "");
  if (!valid) throw new ApiError(400, "Current password is wrong");
  await prisma.systemState.update({ where: { id: 1 }, data: { passwordHash: await hashPassword(next) } });
  return NextResponse.json({ ok: true });
});
