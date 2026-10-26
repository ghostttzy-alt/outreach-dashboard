import { NextResponse } from "next/server";
import { route } from "@/lib/api";
import { getNeedsAttention, getOverview } from "@/lib/metrics";

// GET /api/stats -> KPIs, 30-day series, funnel and the "needs attention" lists.
export const GET = route(async () => {
  const [overview, attention] = await Promise.all([getOverview(), getNeedsAttention()]);
  const { send, ...rest } = overview;
  return NextResponse.json({
    data: {
      ...rest,
      sending: { ...send, settings: undefined },
      needsAttention: {
        awaitingReply: attention.awaitingReply.map((a) => ({ leadId: a.lead.id, businessName: a.lead.businessName, receivedAt: a.receivedAt })),
        followUpsDue: attention.followUpsDue.map((f) => ({ leadId: f.lead.id, businessName: f.lead.businessName, next: f.next, dueDate: f.dueDate })),
        interestedNoMockup: attention.interestedNoMockup.map((l) => ({ leadId: l.id, businessName: l.businessName })),
      },
    },
  });
});
