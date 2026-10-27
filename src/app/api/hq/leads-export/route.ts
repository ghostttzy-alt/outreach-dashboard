import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/hq/leads-export?city=Greenville&niche=Restaurant
// Returns CSV of leads not on Do Not Contact list
export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city") ?? undefined;
  const niche = req.nextUrl.searchParams.get("niche") ?? undefined;

  const dnc = await prisma.doNotContact.findMany({ select: { email: true } });
  const dncSet = new Set(dnc.map((d) => d.email.toLowerCase()));

  const leads = await prisma.lead.findMany({
    where: {
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(niche ? { niche: { contains: niche, mode: "insensitive" } } : {}),
      stage: { not: "Do Not Contact" },
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const rows = leads.filter((l) => !dncSet.has(l.email.toLowerCase()));

  const header = "Business,Niche,City,Phone,Website,Website Status,Email,Source\n";
  const csv =
    header +
    rows
      .map((l) =>
        [l.businessName, l.niche, l.city, l.phone, l.website, l.websiteStatus, l.email, l.source]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="leads-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
