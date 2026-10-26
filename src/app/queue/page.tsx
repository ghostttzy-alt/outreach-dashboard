import { prisma } from "@/lib/prisma";
import { sendStatus } from "@/lib/sender";
import { withFooter } from "@/lib/sender";
import { QueueView } from "@/components/queue/QueueView";
import { addDays } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const [status, emails] = await Promise.all([
    sendStatus(),
    prisma.email.findMany({
      where: {
        direction: "outbound",
        OR: [{ status: { in: ["draft", "approved", "sending"] } }, { status: "failed", createdAt: { gte: addDays(new Date(), -14) } }],
      },
      orderBy: { createdAt: "asc" },
      include: { lead: { select: { id: true, businessName: true, email: true, stage: true, niche: true, city: true } } },
    }),
  ]);
  const { settings, state, ramp, sentToday, blockers } = status;
  // Show exactly what will go out, including the footer added at send time.
  const items = emails.map((e) => ({ ...e, finalBody: withFooter(e.body, settings, e.type) }));
  const data = {
    items,
    send: { ramp, sentToday, blockers, paused: settings.paused, pausedReason: settings.pausedReason, nextSendAt: state.nextSendAt, gmailEmail: state.gmailEmail, timezone: settings.timezone, sendStartHour: settings.sendStartHour, sendEndHour: settings.sendEndHour },
  };
  return <QueueView data={JSON.parse(JSON.stringify(data))} />;
}
