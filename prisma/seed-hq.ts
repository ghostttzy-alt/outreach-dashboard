import { createPrisma } from "./client";

const prisma = createPrisma();

const VENTURES = [
  {
    slug: "web-design",
    name: "Web Design + Care Plans",
    description: "Cold email web design to local businesses, upsell monthly care plans.",
    status: "Setting up",
    nextStep: "Get first care plan client — use care-plan.md upsell paragraph in your next yes email",
    tasks: {
      me: [
        { title: "Connect Gmail in Settings so emails can send", priority: 10 },
        { title: "Open an Etsy shop and upload the 3 listings in hq-files/etsy/", priority: 9 },
      ],
      claude: [
        { title: "Find and add 20 new local business leads tonight", priority: 8, done: false },
        { title: "Write first emails for all queued leads", priority: 7, done: false },
        { title: "Care plan page built at /care", priority: 6, done: true },
        { title: "Admin add-on section added to /care page", priority: 5, done: true },
      ],
    },
  },
  {
    slug: "lead-lists",
    name: "Lead Lists for Agencies",
    description: "Sell 100-lead verified lists to small marketing agencies for $150.",
    status: "Setting up",
    nextStep: "Find agency contacts and send intro emails through dashboard",
    tasks: {
      me: [
        { title: "Review agency emails in Approval queue and approve them", priority: 8 },
      ],
      claude: [
        { title: "Find 15–25 marketing agencies in NC/Southeast and add as leads", priority: 9, done: false },
        { title: "Write intro emails for each agency", priority: 8, done: false },
        { title: "Lead list CSV export built at /api/hq/leads-export", priority: 5, done: true },
      ],
    },
  },
  {
    slug: "admin-addon",
    name: "Admin Add-On",
    description: "Monthly admin service for care plan clients: reviews, GBP posts, updates.",
    status: "Setting up",
    nextStep: "Pitch admin add-on to first care plan client when they sign up",
    tasks: {
      me: [
        { title: "Once you have a care plan client, offer the admin add-on", priority: 6 },
      ],
      claude: [
        { title: "Service menu written and added to /care page", priority: 5, done: true },
        { title: "Weekly checklist written at hq-files/admin-weekly-checklist.md", priority: 4, done: true },
      ],
    },
  },
  {
    slug: "etsy",
    name: "Etsy Digital Products",
    description: "Printable planners and templates for students and small businesses.",
    status: "Setting up",
    nextStep: "Open an Etsy shop (costs $0.20 per listing) and upload the 3 PDFs in hq-files/etsy/",
    tasks: {
      me: [
        { title: "Go to etsy.com and open a shop (takes ~10 min)", priority: 9 },
        { title: "Upload 3 products from hq-files/etsy/ using listing details in product-research.md", priority: 8 },
        { title: "Each listing costs $0.20 — total $0.60 to list all 3", priority: 7 },
      ],
      claude: [
        { title: "College budget planner PDF created (college-budget-planner.pdf)", priority: 6, done: true },
        { title: "Small business invoice kit PDF created (small-business-invoice-kit.pdf)", priority: 6, done: true },
        { title: "Notion student dashboard template PDF created (notion-student-dashboard.pdf)", priority: 6, done: true },
        { title: "Listing titles, tags, descriptions written in product-research.md", priority: 5, done: true },
      ],
    },
  },
  {
    slug: "youtube",
    name: "Faceless YouTube Channel",
    description: "College hacks for broke students Shorts — building toward 1K subs and 10M Shorts views.",
    status: "Setting up",
    nextStep: "Upload Shorts from hq-files/youtube/ready/ and schedule 3/day in YouTube Studio",
    tasks: {
      me: [
        { title: "Upload videos from hq-files/youtube/ready/ to YouTube Studio", priority: 7 },
        { title: "Schedule videos at 8am, 1pm, 7pm Eastern (use YouTube Scheduling)", priority: 7 },
        { title: "Add link to /care page in video descriptions for first clients", priority: 5 },
      ],
      claude: [
        { title: "14 video scripts written in hq-files/faceless/scripts.md", priority: 6, done: true },
        { title: "2-week posting calendar written in scripts.md", priority: 5, done: true },
        { title: "Make up to 6 Short videos with ffmpeg tonight", priority: 8, done: false },
      ],
    },
  },
];

async function main() {
  console.log("Seeding HQ ventures…");

  for (const v of VENTURES) {
    const existing = await prisma.venture.findUnique({ where: { slug: v.slug } });
    if (existing) {
      console.log(`  Venture "${v.slug}" already exists, skipping.`);
      continue;
    }

    const venture = await prisma.venture.create({
      data: {
        slug: v.slug,
        name: v.name,
        description: v.description,
        status: v.status,
        nextStep: v.nextStep,
      },
    });

    for (const task of v.tasks.me) {
      await prisma.ventureTask.create({
        data: { ventureId: venture.id, owner: "me", title: task.title, priority: task.priority, done: false },
      });
    }
    for (const task of v.tasks.claude) {
      await prisma.ventureTask.create({
        data: { ventureId: venture.id, owner: "claude", title: task.title, priority: task.priority, done: task.done ?? false },
      });
    }

    console.log(`  Created venture: ${v.name}`);
  }

  // Night 1 log entry
  const webDesign = await prisma.venture.findUnique({ where: { slug: "web-design" } });
  if (webDesign) {
    const existingLog = await prisma.hqLog.findFirst({ where: { note: { startsWith: "Night 1:" } } });
    if (!existingLog) {
      await prisma.hqLog.create({
        data: {
          ventureId: webDesign.id,
          project: "HQ",
          note: "Night 1: Built HQ dashboard, 5 project pages, /care page, 3 Etsy PDFs, 14 faceless video scripts, care-plan upsell copy, admin weekly checklist. All hq-files committed.",
        },
      });
    }
  }

  console.log("HQ seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
