import { prisma } from "@/lib/prisma";
import { route } from "@/lib/api";
import { LEAD_CSV_FIELDS, toCsv } from "@/lib/csv";
import { leadQueryFromParams } from "@/lib/leadQuery";

// GET /api/export            -> all leads
// GET /api/export?ids=a,b,c  -> only those leads (used by bulk export)
// Also accepts the same filters as GET /api/leads.
export const GET = route(async (req) => {
  const sp = new URL(req.url).searchParams;
  const { where, orderBy } = leadQueryFromParams(sp);
  const ids = sp.get("ids")?.split(",").filter(Boolean);
  if (ids?.length) where.id = { in: ids };
  const leads = await prisma.lead.findMany({ where, orderBy });
  const fields = ["id", ...LEAD_CSV_FIELDS, "createdAt", "updatedAt"];
  const rows = leads.map((l) => ({
    ...l,
    dateContacted: l.dateContacted?.toISOString() ?? "",
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  }));
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows, fields), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${stamp}.csv"`,
    },
  });
});
