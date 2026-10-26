import { NextResponse, type NextRequest } from "next/server";
import { connectGmail, publicOrigin } from "@/lib/gmail";
import { logActivity } from "@/lib/services";

export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  const sp = req.nextUrl.searchParams;
  const back = (status: string, detail = "") =>
    NextResponse.redirect(`${origin}/settings?gmail=${status}${detail ? `&detail=${encodeURIComponent(detail)}` : ""}#gmail`);

  if (sp.get("error")) return back("denied", sp.get("error")!);
  const expected = req.cookies.get("gmail_oauth_state")?.value;
  if (!expected || expected !== sp.get("state")) return back("error", "The sign-in link expired. Try Connect Gmail again.");
  try {
    const email = await connectGmail(sp.get("code") ?? "", origin);
    await logActivity(null, "gmail_connected", `Gmail connected (${email})`);
    const res = back("connected");
    res.cookies.delete("gmail_oauth_state");
    return res;
  } catch (err) {
    return back("error", (err as Error).message);
  }
}
