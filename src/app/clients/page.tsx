import { prisma } from "@/lib/prisma";
import { ClientsView } from "@/components/clients/ClientsView";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { startDate: "desc" },
    include: {
      lead: {
        select: { id: true, businessName: true, niche: true, city: true, website: true, sites: { where: { type: "client" }, select: { liveUrl: true, status: true } } },
      },
    },
  });
  return <ClientsView clients={JSON.parse(JSON.stringify(clients))} />;
}
