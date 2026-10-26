import { prisma } from "./prisma";
import { getSettings } from "./settings";
import { updateLead } from "./services";
import { ApiError } from "./validate";

const MAX_HTML = 2_000_000; // 2 MB

function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "mockup";
}

/** Save (or replace) a lead's mockup and put its public link on the lead. */
export async function saveMockup({ leadId, html, slug, origin }: { leadId: string; html: string; slug?: unknown; origin: string }) {
  if (!leadId) throw new ApiError(400, "leadId is required");
  if (!html.trim()) throw new ApiError(400, "html is empty");
  if (html.length > MAX_HTML) throw new ApiError(413, "Mockup HTML is larger than 2 MB");
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new ApiError(404, "Lead not found");

  let finalSlug = typeof slug === "string" && slug.trim() ? slugify(slug) : "";
  const existing = await prisma.mockup.findFirst({ where: { leadId }, orderBy: { createdAt: "desc" } });
  if (!finalSlug) finalSlug = existing?.slug ?? `${slugify(lead.businessName)}-${Math.random().toString(36).slice(2, 6)}`;
  const taken = await prisma.mockup.findUnique({ where: { slug: finalSlug } });
  if (taken && taken.leadId !== leadId) throw new ApiError(409, `Slug "${finalSlug}" is already used by another lead`);

  const mockup = taken
    ? await prisma.mockup.update({ where: { id: taken.id }, data: { html } })
    : await prisma.mockup.create({ data: { leadId, slug: finalSlug, html } });
  const url = `${process.env.APP_URL || origin}/preview/${mockup.slug}`;
  await updateLead(leadId, { mockupUrl: url });
  return { id: mockup.id, leadId, slug: mockup.slug, url };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** The stored HTML plus a noindex tag and a small "Free preview by …" footer. */
export async function renderMockup(slug: string) {
  const mockup = await prisma.mockup.findUnique({ where: { slug } });
  if (!mockup) return null;
  const settings = await getSettings();
  const by = settings.businessName || settings.yourName || "your web designer";
  const meta = '<meta name="robots" content="noindex, nofollow">';
  const footer = `<div style="position:fixed;left:0;right:0;bottom:0;z-index:2147483647;padding:6px 12px;font:12px/1.4 system-ui,-apple-system,sans-serif;text-align:center;background:rgba(17,17,17,.85);color:#fff">Free preview by ${escapeHtml(by)}</div>`;
  let html = mockup.html;
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => `${m}${meta}`) : `${meta}${html}`;
  html = /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${footer}</body>`) : `${html}${footer}`;
  return html;
}
