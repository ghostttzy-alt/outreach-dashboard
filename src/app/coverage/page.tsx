import { prisma } from "@/lib/prisma";
import { CoverageView } from "@/components/coverage/CoverageView";

export const dynamic = "force-dynamic";

export default async function CoveragePage() {
  const rows = await prisma.coverage.findMany({ orderBy: { searchedAt: "desc" } });
  return <CoverageView rows={JSON.parse(JSON.stringify(rows))} />;
}
