import { firstName } from "./utils";

type LeadLike = {
  businessName: string;
  contactName: string;
  mainProblem: string;
  city: string;
  niche: string;
  website: string;
  mockupUrl: string;
};
type SettingsLike = { yourName: string; businessName: string; mailingAddress: string };

/** Fill {variables} in a template. Unknown variables are left as-is so they are easy to spot. */
export function renderTemplate(text: string, lead: LeadLike, settings?: SettingsLike | null) {
  const vars: Record<string, string> = {
    business_name: lead.businessName,
    first_name: firstName(lead.contactName),
    problem: lead.mainProblem || "your website could be working harder for you",
    city: lead.city,
    niche: lead.niche,
    website: lead.website,
    mockup_url: lead.mockupUrl,
    my_name: settings?.yourName ?? "",
    my_business: settings?.businessName ?? "",
    mailing_address: settings?.mailingAddress ?? "",
  };
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? vars[key] : match));
}
