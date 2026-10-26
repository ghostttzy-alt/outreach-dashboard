import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { LeadsView } from "@/components/leads/LeadsView";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const [niches, cities] = await Promise.all([
    prisma.lead.findMany({ distinct: ["niche"], select: { niche: true }, where: { niche: { not: "" } }, orderBy: { niche: "asc" } }),
    prisma.lead.findMany({ distinct: ["city"], select: { city: true }, where: { city: { not: "" } }, orderBy: { city: "asc" } }),
  ]);
  return (
    <Suspense>
      <LeadsView niches={niches.map((n) => n.niche)} cities={cities.map((c) => c.city)} />
    </Suspense>
  );
}
