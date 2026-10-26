import { prisma } from "@/lib/prisma";
import { getFollowUpsDue, getSendStats } from "@/lib/metrics";
import { OutreachView } from "@/components/outreach/OutreachView";

export const dynamic = "force-dynamic";

export default async function OutreachPage() {
  const [send, followUps, drafts, queuedNoDraft, templates] = await Promise.all([
    getSendStats(),
    getFollowUpsDue(),
    prisma.email.findMany({
      where: { direction: "outbound", status: { in: ["draft", "approved"] } },
      include: { lead: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.lead.findMany({
      where: { stage: "Queued", email: { not: "" }, emails: { none: { direction: "outbound", status: { notIn: ["cancelled", "failed"] } } } },
      orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    }),
    prisma.template.findMany({ orderBy: { key: "asc" } }),
  ]);

  const data = {
    send: { ...send, settings: undefined },
    settings: send.settings,
    // Do Not Contact leads never enter the queue.
    drafts: drafts.filter((d) => d.lead.stage !== "Do Not Contact"),
    blockedDrafts: drafts.filter((d) => d.lead.stage === "Do Not Contact").length,
    queuedNoDraft,
    followUps,
    templates,
  };
  return <OutreachView data={JSON.parse(JSON.stringify(data))} />;
}
