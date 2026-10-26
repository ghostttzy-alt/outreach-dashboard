import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/services";
import { LeadDetail } from "@/components/lead/LeadDetail";

export const dynamic = "force-dynamic";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, templates, settings] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      include: {
        emails: { orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }] },
        sites: { orderBy: { createdAt: "desc" } },
        client: true,
        activities: { where: { type: { not: "bounce_notice" } }, orderBy: { createdAt: "desc" }, take: 30 },
      },
    }),
    prisma.template.findMany({ orderBy: { key: "asc" } }),
    getSettings(),
  ]);
  if (!lead) notFound();
  // Serialize dates for the client component.
  return <LeadDetail lead={JSON.parse(JSON.stringify(lead))} templates={JSON.parse(JSON.stringify(templates))} settings={JSON.parse(JSON.stringify(settings))} />;
}
