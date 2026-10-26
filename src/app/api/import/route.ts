import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { route } from "@/lib/api";
import { LEAD_CSV_FIELDS, guessMapping, parseCsv } from "@/lib/csv";
import { STAGES, WEBSITE_STATUSES } from "@/lib/constants";
import { logActivity } from "@/lib/services";
import { ApiError } from "@/lib/validate";

/**
 * POST /api/import
 *  - multipart/form-data: file=<csv>, optional mapping=<JSON {leadField: csvHeader}>
 *  - application/json:   { "csv": "<csv text>", "mapping"?: {...} }  or  { "rows": [{ businessName, ... }] }
 *  - text/csv:           raw CSV body
 * Add ?dryRun=1 to get headers, guessed mapping and a preview without saving.
 * Rows whose email already exists are skipped as duplicates.
 */
export const POST = route(async (req) => {
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const type = req.headers.get("content-type") ?? "";

  let headers: string[] = [];
  let rows: Record<string, string>[] = [];
  let mapping: Record<string, string> | null = null;

  if (type.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "Upload a CSV as the 'file' field");
    ({ headers, rows } = parseCsv(await file.text()));
    const m = form.get("mapping");
    if (typeof m === "string" && m) mapping = JSON.parse(m);
  } else if (type.includes("application/json")) {
    const body = await req.json();
    if (Array.isArray(body.rows)) {
      rows = body.rows;
      headers = Object.keys(rows[0] ?? {});
      mapping = Object.fromEntries(LEAD_CSV_FIELDS.filter((f) => headers.includes(f)).map((f) => [f, f]));
    } else if (typeof body.csv === "string") {
      ({ headers, rows } = parseCsv(body.csv));
    } else throw new ApiError(400, 'JSON body needs "csv" (string) or "rows" (array)');
    if (body.mapping) mapping = body.mapping;
  } else {
    ({ headers, rows } = parseCsv(await req.text()));
  }

  mapping ??= guessMapping(headers);
  if (dryRun) return NextResponse.json({ headers, mapping, preview: rows.slice(0, 5), total: rows.length });
  if (!mapping.businessName) throw new ApiError(400, "Map a column to businessName");

  const existing = new Set(
    (await prisma.lead.findMany({ select: { email: true }, where: { email: { not: "" } } })).map((l) => l.email.toLowerCase()),
  );

  const toCreate: Prisma.LeadCreateManyInput[] = [];
  const errors: { row: number; error: string }[] = [];
  let duplicates = 0;

  rows.forEach((row, i) => {
    const get = (field: string) => (mapping![field] ? String(row[mapping![field]] ?? "").trim() : "");
    const businessName = get("businessName");
    if (!businessName) return errors.push({ row: i + 2, error: "Missing business name" });
    const email = get("email");
    if (email && existing.has(email.toLowerCase())) return duplicates++;
    if (email) existing.add(email.toLowerCase());

    const ws = WEBSITE_STATUSES.find((s) => s.toLowerCase() === get("websiteStatus").toLowerCase());
    const stage = STAGES.find((s) => s.toLowerCase() === get("stage").toLowerCase());
    const score = Math.min(5, Math.max(1, Math.round(Number(get("score")) || 3)));
    const dc = get("dateContacted") ? new Date(get("dateContacted")) : null;
    const website = get("website");

    toCreate.push({
      businessName, email, website, score,
      niche: get("niche"), city: get("city"), contactName: get("contactName"), phone: get("phone"),
      mainProblem: get("mainProblem"), mockupUrl: get("mockupUrl"), notes: get("notes"),
      websiteStatus: ws ?? (website ? "OK" : "None"),
      stage: stage ?? "Queued",
      dateContacted: dc && !Number.isNaN(dc.getTime()) ? dc : null,
    });
  });

  if (toCreate.length) {
    await prisma.lead.createMany({ data: toCreate });
    await logActivity(null, "import", `Imported ${toCreate.length} leads from CSV`);
  }
  return NextResponse.json({ imported: toCreate.length, duplicates, errors });
});
