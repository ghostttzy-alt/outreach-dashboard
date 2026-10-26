import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { checkLead } from "@/lib/leads";
import { ApiError } from "@/lib/validate";

// GET /api/leads/check?email=&name=&city=&website=
export const GET = route(async (req) => {
  const sp = new URL(req.url).searchParams;
  const input = { email: sp.get("email") ?? "", name: sp.get("name") ?? "", city: sp.get("city") ?? "", website: sp.get("website") ?? "" };
  if (!input.email && !input.name && !input.website) throw new ApiError(400, "Pass at least one of email, name (with city) or website");
  const result = await checkLead(input);
  return NextResponse.json({ data: { ...result, ok: !result.duplicate && !result.doNotContact && !result.blockedChain } });
});
