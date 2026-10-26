import type { Prisma } from "@prisma/client";

export const LEAD_SORT_FIELDS = [
  "businessName", "niche", "city", "email", "website", "websiteStatus", "mainProblem",
  "score", "stage", "dateContacted", "updatedAt", "createdAt",
] as const;

/** Build a Prisma where/orderBy from URL search params shared by the leads API, export and pages. */
export function leadQueryFromParams(sp: URLSearchParams) {
  const where: Prisma.LeadWhereInput = {};
  const q = sp.get("q")?.trim();
  if (q) {
    where.OR = ["businessName", "niche", "city", "email", "contactName", "website", "mainProblem"].map((f) => ({
      [f]: { contains: q },
    }));
  }
  const list = (key: string) => sp.getAll(key).flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
  const stages = list("stage");
  if (stages.length) where.stage = { in: stages };
  const niches = list("niche");
  if (niches.length) where.niche = { in: niches };
  const cities = list("city");
  if (cities.length) where.city = { in: cities };
  const statuses = list("websiteStatus");
  if (statuses.length) where.websiteStatus = { in: statuses };
  const minScore = Number(sp.get("minScore"));
  const maxScore = Number(sp.get("maxScore"));
  if (minScore || maxScore) where.score = { gte: minScore || 1, lte: maxScore || 5 };

  const sortParam = sp.get("sort") ?? "updatedAt";
  const sort = (LEAD_SORT_FIELDS as readonly string[]).includes(sortParam) ? sortParam : "updatedAt";
  const order: Prisma.SortOrder = sp.get("order") === "asc" ? "asc" : "desc";
  const orderBy: Prisma.LeadOrderByWithRelationInput[] = [{ [sort]: order }, { id: "asc" }];

  const pageSize = Math.min(Math.max(Number(sp.get("pageSize")) || 25, 1), 500);
  const page = Math.max(Number(sp.get("page")) || 1, 1);
  return { where, orderBy, page, pageSize };
}
