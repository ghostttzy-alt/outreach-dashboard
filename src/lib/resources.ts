import { crud } from "./crud";
import { ACTIVITY_FIELDS, CLIENT_FIELDS, COVERAGE_FIELDS, SITE_FIELDS, TEMPLATE_FIELDS } from "./validate";

const leadSummary = { lead: { select: { id: true, businessName: true, stage: true, website: true } } };

export const sites = crud({
  model: "site", fields: SITE_FIELDS, required: ["leadId"], filters: ["leadId", "type", "status"],
  orderBy: { createdAt: "desc" }, include: leadSummary,
});
export const clients = crud({
  model: "client", fields: CLIENT_FIELDS, required: ["leadId"], filters: ["leadId", "status"],
  orderBy: { startDate: "desc" }, include: leadSummary,
});
export const coverage = crud({
  model: "coverage", fields: COVERAGE_FIELDS, required: ["city", "niche"], filters: ["city", "niche"],
  orderBy: { searchedAt: "desc" },
});
export const activities = crud({
  model: "activity", fields: ACTIVITY_FIELDS, required: ["type", "description"], filters: ["leadId", "type"],
  orderBy: { createdAt: "desc" },
});
export const templates = crud({
  model: "template", fields: TEMPLATE_FIELDS, required: ["key", "name", "subject", "body"], filters: ["key"],
  orderBy: { key: "asc" },
});
