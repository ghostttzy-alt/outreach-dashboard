import { createPrisma } from "./client";
import { DEFAULT_TEMPLATES } from "./defaults";

const prisma = createPrisma();
const force = process.argv.includes("--force");

const now = new Date();
/** A date `days` ago at the given hour. */
function ago(days: number, hour = 10, minute = 0) {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  // Keep "today" timestamps in the past so they count as sent today.
  if (d > now) return new Date(now.getTime() - 5 * 60_000);
  return d;
}

type EmailSeed = {
  dir?: "outbound" | "inbound";
  type: "first" | "followup1" | "followup2" | "reply" | "mockup";
  daysAgo: number | null;
  status: string;
  subject?: string;
  body?: string;
};

type LeadSeed = {
  businessName: string;
  niche: string;
  city: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  websiteStatus: string;
  mainProblem: string;
  score: number;
  stage: string;
  notes?: string;
  mockupUrl?: string;
  createdDaysAgo: number;
  emails: EmailSeed[];
  sites?: { type: string; status: string; previewUrl?: string; liveUrl?: string; daysAgo: number }[];
  client?: { setupPrice: number; monthlyFee: number; daysAgo: number; status: string };
};

const LEADS: LeadSeed[] = [
  {
    businessName: "Rivera Family Plumbing", niche: "Plumber", city: "Austin, TX", contactName: "Carlos Rivera",
    email: "carlos@riveraplumbingatx.com", phone: "(512) 555-0142", website: "", websiteStatus: "None",
    mainProblem: "no website, only a Facebook page", score: 5, stage: "Won", createdDaysAgo: 29,
    mockupUrl: "https://mockups.example.com/rivera-plumbing", notes: "Wants online booking added next quarter.",
    emails: [
      { type: "first", daysAgo: 28, status: "replied" },
      { dir: "inbound", type: "reply", daysAgo: 27, status: "replied", subject: "Re: Quick idea", body: "Sure, send it over. We get most jobs by phone." },
      { type: "mockup", daysAgo: 25, status: "replied" },
      { dir: "inbound", type: "reply", daysAgo: 24, status: "replied", subject: "Re: Your free homepage mockup", body: "Love it. What does it cost?" },
    ],
    sites: [
      { type: "mockup", status: "Mockup", previewUrl: "https://mockups.example.com/rivera-plumbing", daysAgo: 25 },
      { type: "client", status: "Live", previewUrl: "https://staging.example.com/rivera", liveUrl: "https://riveraplumbingatx.com", daysAgo: 18 },
    ],
    client: { setupPrice: 750, monthlyFee: 60, daysAgo: 20, status: "active" },
  },
  {
    businessName: "Bloom & Stem Florist", niche: "Florist", city: "Austin, TX", contactName: "Priya Shah",
    email: "hello@bloomandstem.co", phone: "(512) 555-0187", website: "bloomandstem.co", websiteStatus: "Not Mobile",
    mainProblem: "site isn't usable on phones and the order form is cut off", score: 4, stage: "Mockup Sent", createdDaysAgo: 14,
    mockupUrl: "https://mockups.example.com/bloom-and-stem",
    emails: [
      { type: "first", daysAgo: 12, status: "replied" },
      { dir: "inbound", type: "reply", daysAgo: 10, status: "replied", subject: "Re: Quick idea", body: "Yes please, Valentine's is our busy season." },
      { type: "mockup", daysAgo: 8, status: "opened" },
    ],
    sites: [{ type: "mockup", status: "Mockup", previewUrl: "https://mockups.example.com/bloom-and-stem", daysAgo: 8 }],
  },
  {
    businessName: "Oak Street Barbers", niche: "Barber", city: "Austin, TX", contactName: "Marcus Lee",
    email: "marcus@oakstreetbarbers.com", phone: "(512) 555-0119", website: "oakstreetbarbers.com", websiteStatus: "Outdated",
    mainProblem: "site looks like 2009 and has no online booking", score: 4, stage: "Interested", createdDaysAgo: 10,
    notes: "Uses Square for booking. Wants a dark, modern look.",
    emails: [
      { type: "first", daysAgo: 7, status: "replied" },
      { dir: "inbound", type: "reply", daysAgo: 5, status: "replied", subject: "Re: Quick idea", body: "Interested. Can it link to my Square booking?" },
      { dir: "outbound", type: "reply", daysAgo: 5, status: "sent", subject: "Re: Quick idea", body: "Absolutely, I'll put a mockup together this week." },
    ],
  },
  {
    businessName: "Lone Star Auto Repair", niche: "Auto repair", city: "San Antonio, TX", contactName: "Dale Hughes",
    email: "dale@lonestarautosa.com", phone: "(210) 555-0163", website: "lonestarautosa.com", websiteStatus: "Broken",
    mainProblem: "site shows a database error on the homepage", score: 5, stage: "Replied", createdDaysAgo: 9,
    emails: [
      { type: "first", daysAgo: 4, status: "replied" },
      { dir: "inbound", type: "reply", daysAgo: 0, status: "replied", subject: "Re: Quick idea", body: "Didn't know the site was down. How much would a new one run?" },
    ],
  },
  {
    businessName: "Sunrise Bakery", niche: "Bakery", city: "San Antonio, TX", contactName: "Elena Gomez",
    email: "elena@sunrisebakerysa.com", phone: "(210) 555-0128", website: "", websiteStatus: "None",
    mainProblem: "no website, customers can't see hours or menu", score: 4, stage: "Contacted", createdDaysAgo: 6,
    emails: [{ type: "first", daysAgo: 4, status: "opened" }],
  },
  {
    businessName: "Peak Fitness Studio", niche: "Gym", city: "Denver, CO", contactName: "Jordan Blake",
    email: "jordan@peakfitdenver.com", phone: "(303) 555-0174", website: "peakfitdenver.com", websiteStatus: "No HTTPS",
    mainProblem: "browsers show a 'Not secure' warning on the class signup page", score: 3, stage: "Follow-up 1", createdDaysAgo: 13,
    emails: [
      { type: "first", daysAgo: 11, status: "sent" },
      { type: "followup1", daysAgo: 6, status: "sent" },
    ],
  },
  {
    businessName: "Golden Dragon Kitchen", niche: "Restaurant", city: "Denver, CO", contactName: "Wei Chen",
    email: "info@goldendragondenver.com", phone: "(303) 555-0131", website: "goldendragondenver.com", websiteStatus: "Outdated",
    mainProblem: "menu is a blurry scanned PDF", score: 3, stage: "Contacted", createdDaysAgo: 3,
    emails: [{ type: "first", daysAgo: 0, status: "sent" }],
  },
  {
    businessName: "Mile High Roofing", niche: "Roofing", city: "Denver, CO", contactName: "Tom Becker",
    email: "tom@milehighroofing.net", phone: "(303) 555-0156", website: "milehighroofing.net", websiteStatus: "Not Mobile",
    mainProblem: "phone number isn't tappable and the page zooms out on mobile", score: 5, stage: "Won", createdDaysAgo: 26,
    mockupUrl: "https://mockups.example.com/mile-high-roofing",
    emails: [
      { type: "first", daysAgo: 24, status: "sent" },
      { type: "followup1", daysAgo: 21, status: "replied" },
      { dir: "inbound", type: "reply", daysAgo: 20, status: "replied", subject: "Re: Quick idea", body: "Go for it." },
      { type: "mockup", daysAgo: 17, status: "replied" },
      { dir: "inbound", type: "reply", daysAgo: 15, status: "replied", subject: "Re: mockup", body: "Let's do it. Send the invoice." },
    ],
    sites: [
      { type: "mockup", status: "Mockup", previewUrl: "https://mockups.example.com/mile-high-roofing", daysAgo: 17 },
      { type: "client", status: "In Progress", previewUrl: "https://staging.example.com/mile-high-roofing", daysAgo: 12 },
    ],
    client: { setupPrice: 900, monthlyFee: 75, daysAgo: 14, status: "active" },
  },
  {
    businessName: "Paws & Claws Grooming", niche: "Pet grooming", city: "Austin, TX", contactName: "Sara Kim",
    email: "sara@pawsclawsatx.com", phone: "(512) 555-0193", website: "", websiteStatus: "None",
    mainProblem: "no website, bookings only by phone", score: 4, stage: "Queued", createdDaysAgo: 1,
    emails: [{ type: "first", daysAgo: null, status: "draft" }],
  },
  {
    businessName: "Clearview Window Cleaning", niche: "Cleaning", city: "San Antonio, TX", contactName: "Mike O'Neil",
    email: "mike@clearviewsa.com", phone: "(210) 555-0105", website: "clearviewsa.com", websiteStatus: "Broken",
    mainProblem: "contact form returns an error", score: 3, stage: "Queued", createdDaysAgo: 1,
    emails: [{ type: "first", daysAgo: null, status: "draft" }],
  },
  {
    businessName: "Harbor Dental Care", niche: "Dentist", city: "Denver, CO", contactName: "Anita Patel",
    email: "frontdesk@harbordentaldenver.com", phone: "(303) 555-0182", website: "harbordentaldenver.com", websiteStatus: "Outdated",
    mainProblem: "no online booking and stock photos everywhere", score: 3, stage: "Lost", createdDaysAgo: 27,
    notes: "Signed with an agency their cousin runs.",
    emails: [
      { type: "first", daysAgo: 25, status: "replied" },
      { dir: "inbound", type: "reply", daysAgo: 23, status: "replied", subject: "Re: Quick idea", body: "Thanks, but we've already hired someone." },
    ],
  },
  {
    businessName: "Tony's Pizzeria", niche: "Restaurant", city: "Austin, TX", contactName: "Tony Russo",
    email: "tony@tonyspizzaatx.com", phone: "(512) 555-0110", website: "tonyspizzaatx.com", websiteStatus: "No HTTPS",
    mainProblem: "online ordering page isn't secure", score: 2, stage: "Do Not Contact", createdDaysAgo: 22,
    notes: "Asked not to be contacted again.",
    emails: [
      { type: "first", daysAgo: 20, status: "sent" },
      { dir: "inbound", type: "reply", daysAgo: 19, status: "unsubscribed", subject: "Re: Quick idea", body: "Not interested, please remove me." },
    ],
  },
  {
    businessName: "Greenleaf Landscaping", niche: "Landscaping", city: "San Antonio, TX", contactName: "Luis Ortega",
    email: "luis@greenleafsa.com", phone: "(210) 555-0147", website: "", websiteStatus: "None",
    mainProblem: "no website, competitors rank above them on Google Maps", score: 4, stage: "Follow-up 2", createdDaysAgo: 16,
    emails: [
      { type: "first", daysAgo: 14, status: "opened" },
      { type: "followup1", daysAgo: 9, status: "opened" },
      { type: "followup2", daysAgo: 0, status: "sent" },
    ],
  },
  {
    businessName: "Bella Nails Spa", niche: "Nail salon", city: "Denver, CO", contactName: "Mai Tran",
    email: "mai@bellanailsdenver.com", phone: "(303) 555-0168", website: "bellanailsdenver.com", websiteStatus: "Not Mobile",
    mainProblem: "prices are in a tiny image that can't be read on phones", score: 2, stage: "Cold", createdDaysAgo: 28,
    emails: [
      { type: "first", daysAgo: 26, status: "bounced" },
      { type: "first", daysAgo: 25, status: "sent", subject: "Quick idea for Bella Nails Spa's website (resent to new address)" },
      { type: "followup1", daysAgo: 22, status: "sent" },
      { type: "followup2", daysAgo: 16, status: "sent" },
    ],
  },
  {
    businessName: "Summit Electric", niche: "Electrician", city: "Austin, TX", contactName: "Greg Walsh",
    email: "greg@summitelectricatx.com", phone: "(512) 555-0135", website: "summitelectricatx.com", websiteStatus: "Outdated",
    mainProblem: "site has no reviews, service area, or license info", score: 4, stage: "Won", createdDaysAgo: 30,
    mockupUrl: "https://mockups.example.com/summit-electric",
    emails: [
      { type: "first", daysAgo: 29, status: "replied" },
      { dir: "inbound", type: "reply", daysAgo: 28, status: "replied", subject: "Re: Quick idea", body: "Sure, let's see it." },
      { type: "mockup", daysAgo: 26, status: "replied" },
      { dir: "inbound", type: "reply", daysAgo: 25, status: "replied", subject: "Re: mockup", body: "Looks great, I'm in." },
    ],
    sites: [
      { type: "mockup", status: "Mockup", previewUrl: "https://mockups.example.com/summit-electric", daysAgo: 26 },
      { type: "client", status: "Live", previewUrl: "https://staging.example.com/summit", liveUrl: "https://summitelectricatx.com", daysAgo: 19 },
    ],
    client: { setupPrice: 600, monthlyFee: 50, daysAgo: 24, status: "paused" },
  },
];

const COVERAGE = [
  { city: "Austin, TX", niche: "Plumber", daysAgo: 30, leadsFound: 6 },
  { city: "Austin, TX", niche: "Electrician", daysAgo: 30, leadsFound: 4 },
  { city: "Austin, TX", niche: "Restaurant", daysAgo: 23, leadsFound: 9 },
  { city: "Austin, TX", niche: "Florist", daysAgo: 15, leadsFound: 3 },
  { city: "Austin, TX", niche: "Barber", daysAgo: 11, leadsFound: 5 },
  { city: "Austin, TX", niche: "Pet grooming", daysAgo: 1, leadsFound: 2 },
  { city: "San Antonio, TX", niche: "Auto repair", daysAgo: 10, leadsFound: 7 },
  { city: "San Antonio, TX", niche: "Bakery", daysAgo: 7, leadsFound: 4 },
  { city: "San Antonio, TX", niche: "Landscaping", daysAgo: 17, leadsFound: 5 },
  { city: "San Antonio, TX", niche: "Cleaning", daysAgo: 1, leadsFound: 3 },
  { city: "Denver, CO", niche: "Roofing", daysAgo: 27, leadsFound: 4 },
  { city: "Denver, CO", niche: "Dentist", daysAgo: 28, leadsFound: 6 },
  { city: "Denver, CO", niche: "Nail salon", daysAgo: 29, leadsFound: 5 },
  { city: "Denver, CO", niche: "Gym", daysAgo: 14, leadsFound: 3 },
  { city: "Denver, CO", niche: "Restaurant", daysAgo: 4, leadsFound: 8 },
];

const LABEL: Record<string, string> = {
  first: "First touch", followup1: "Follow-up 1", followup2: "Follow-up 2", reply: "Reply", mockup: "Mockup",
};

function render(text: string, lead: LeadSeed) {
  return text
    .replace(/\{business_name\}/g, lead.businessName)
    .replace(/\{first_name\}/g, lead.contactName.split(" ")[0])
    .replace(/\{problem\}/g, lead.mainProblem)
    .replace(/\{city\}/g, lead.city)
    .replace(/\{niche\}/g, lead.niche.toLowerCase())
    .replace(/\{mockup_url\}/g, lead.mockupUrl ?? "")
    .replace(/\{my_name\}/g, "Jamie Doe")
    .replace(/\{my_business\}/g, "Northline Web Design")
    .replace(/\{mailing_address\}/g, "123 Main St, Austin, TX 78701");
}

/** Sample data is for local development only; never load it into the hosted database. */
function isLocalDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  return /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url) || /^postgres(ql)?:\/\/[^@]*\/\//.test(url) || url.includes("host=/");
}

async function main() {
  if ((process.env.NODE_ENV === "production" || !isLocalDatabase()) && !process.argv.includes("--allow-remote")) {
    console.log("Refusing to load sample data: DATABASE_URL is not a local database. Sample data is for local development only.");
    return;
  }
  const existing = await prisma.lead.count();
  if (existing > 0 && !force) {
    console.log(`Database already has ${existing} leads. Run "npm run db:clear" first, or "npm run db:seed -- --force" to add samples anyway.`);
    return;
  }

  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      yourName: "Jamie Doe",
      businessName: "Northline Web Design",
      mailingAddress: "123 Main St, Austin, TX 78701",
      sendingEmail: "jamie@northlineweb.com",
      setupPrice: 750,
      monthlyFee: 60,
      dailyLimit: 50,
      rampStartDate: ago(16),
    },
  });

  for (const t of DEFAULT_TEMPLATES) {
    await prisma.template.upsert({ where: { key: t.key }, update: {}, create: t });
  }

  for (const l of LEADS) {
    const sentEmails = l.emails.filter((e) => e.daysAgo !== null && (e.dir ?? "outbound") === "outbound");
    const firstSent = sentEmails.length ? Math.max(...sentEmails.map((e) => e.daysAgo as number)) : null;
    const lead = await prisma.lead.create({
      data: {
        businessName: l.businessName, niche: l.niche, city: l.city, contactName: l.contactName, email: l.email,
        phone: l.phone, website: l.website, websiteStatus: l.websiteStatus, mainProblem: l.mainProblem, score: l.score,
        stage: l.stage, notes: l.notes ?? "", mockupUrl: l.mockupUrl ?? "",
        dateContacted: firstSent !== null ? ago(firstSent, 9) : null,
        createdAt: ago(l.createdDaysAgo, 8),
      },
    });
    await prisma.activity.create({
      data: { leadId: lead.id, type: "lead_created", description: `Added ${l.businessName}`, createdAt: ago(l.createdDaysAgo, 8) },
    });

    for (const [i, e] of l.emails.entries()) {
      const dir = e.dir ?? "outbound";
      const tpl = DEFAULT_TEMPLATES.find((t) => t.key === e.type);
      const sentAt = e.daysAgo === null ? null : ago(e.daysAgo, dir === "inbound" ? 15 : 9, i * 7);
      await prisma.email.create({
        data: {
          leadId: lead.id, direction: dir, type: e.type, status: e.status, sentAt,
          subject: e.subject ?? (tpl ? render(tpl.subject, l) : "Re: your website"),
          body: e.body ?? (tpl ? render(tpl.body, l) : ""),
          createdAt: sentAt ?? ago(0, 7),
        },
      });
      if (sentAt) {
        const description =
          dir === "inbound"
            ? e.status === "unsubscribed" ? `${l.businessName} unsubscribed` : `Reply from ${l.businessName}`
            : e.status === "bounced" ? `${LABEL[e.type]} to ${l.businessName} bounced` : `${LABEL[e.type]} sent to ${l.businessName}`;
        const type = dir === "inbound" ? (e.status === "unsubscribed" ? "unsubscribe" : "email_received") : e.status === "bounced" ? "email_bounced" : "email_sent";
        await prisma.activity.create({ data: { leadId: lead.id, type, description, createdAt: sentAt } });
      }
    }

    if (l.stage !== "Queued") {
      const last = l.emails.filter((e) => e.daysAgo !== null).map((e) => e.daysAgo as number);
      const when = last.length ? ago(Math.min(...last), 16) : ago(0, 7);
      await prisma.activity.create({
        data: { leadId: lead.id, type: "stage_change", description: `${l.businessName} moved to ${l.stage}`, createdAt: when },
      });
    }

    for (const s of l.sites ?? []) {
      await prisma.site.create({
        data: { leadId: lead.id, type: s.type, status: s.status, previewUrl: s.previewUrl ?? "", liveUrl: s.liveUrl ?? "", createdAt: ago(s.daysAgo, 12) },
      });
    }
    if (l.client) {
      await prisma.client.create({
        data: { leadId: lead.id, setupPrice: l.client.setupPrice, monthlyFee: l.client.monthlyFee, startDate: ago(l.client.daysAgo), status: l.client.status },
      });
      await prisma.activity.create({
        data: { leadId: lead.id, type: "client_won", description: `${l.businessName} became a client`, createdAt: ago(l.client.daysAgo, 17) },
      });
    }
  }

  for (const c of COVERAGE) {
    await prisma.coverage.create({ data: { city: c.city, niche: c.niche, leadsFound: c.leadsFound, searchedAt: ago(c.daysAgo, 8) } });
  }

  console.log(`Seeded ${LEADS.length} leads, ${COVERAGE.length} coverage rows and ${DEFAULT_TEMPLATES.length} templates.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
