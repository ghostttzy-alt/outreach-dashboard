import Papa from "papaparse";

/** Columns written by the export and recognised automatically by the import. */
export const LEAD_CSV_FIELDS = [
  "businessName", "niche", "city", "contactName", "email", "phone", "website", "websiteStatus",
  "mainProblem", "score", "stage", "dateContacted", "mockupUrl", "notes",
] as const;

export const LEAD_CSV_LABELS: Record<string, string> = {
  businessName: "Business name", niche: "Niche", city: "City", contactName: "Contact name", email: "Email",
  phone: "Phone", website: "Website", websiteStatus: "Website status", mainProblem: "Main problem", score: "Score",
  stage: "Stage", dateContacted: "Date contacted", mockupUrl: "Mockup URL", notes: "Notes",
};

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

const ALIASES: Record<string, string[]> = {
  businessName: ["business", "businessname", "company", "companyname", "name"],
  contactName: ["contact", "contactname", "owner", "firstname", "fullname"],
  email: ["email", "emailaddress", "mail"],
  phone: ["phone", "phonenumber", "tel", "telephone"],
  website: ["website", "url", "site", "domain"],
  mainProblem: ["mainproblem", "problem", "issue"],
  websiteStatus: ["websitestatus", "sitestatus", "status"],
  niche: ["niche", "category", "industry", "type"],
  city: ["city", "location", "town"],
  score: ["score", "rating"],
  stage: ["stage", "pipeline"],
  dateContacted: ["datecontacted", "contacted", "contacteddate"],
  mockupUrl: ["mockupurl", "mockup"],
  notes: ["notes", "note", "comments"],
};

/** Guess which CSV header maps to which lead field. Returns { field: header }. */
export function guessMapping(headers: string[]) {
  const mapping: Record<string, string> = {};
  for (const field of LEAD_CSV_FIELDS) {
    const candidates = ALIASES[field] ?? [normalize(field)];
    const header = headers.find((h) => candidates.includes(normalize(h)) || normalize(h) === normalize(LEAD_CSV_LABELS[field]));
    if (header && !Object.values(mapping).includes(header)) mapping[field] = header;
  }
  return mapping;
}

export function parseCsv(text: string) {
  const result = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), { header: true, skipEmptyLines: "greedy" });
  return { headers: result.meta.fields ?? [], rows: result.data };
}

export function toCsv(rows: Record<string, unknown>[], fields: readonly string[]) {
  return Papa.unparse({ fields: [...fields], data: rows.map((r) => fields.map((f) => r[f] ?? "")) });
}
