import { prisma } from "@/lib/prisma";
import { SitesView } from "@/components/sites/SitesView";

export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const [sites, leads] = await Promise.all([
    prisma.site.findMany({
      orderBy: { createdAt: "desc" },
      include: { lead: { select: { id: true, businessName: true, niche: true, city: true } } },
    }),
    prisma.lead.findMany({ select: { id: true, businessName: true }, orderBy: { businessName: "asc" } }),
  ]);
  return <SitesView sites={JSON.parse(JSON.stringify(sites))} leads={leads} />;
}
