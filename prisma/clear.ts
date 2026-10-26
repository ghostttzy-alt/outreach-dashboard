import { PrismaClient } from "@prisma/client";

// Removes every lead and everything attached to it (emails, sites, clients, activity),
// plus coverage history. Settings and email templates are kept.
const prisma = new PrismaClient();

async function main() {
  if (!process.argv.includes("--yes")) {
    const leads = await prisma.lead.count();
    console.log(`This will permanently delete ${leads} leads plus all emails, sites, clients, activity and coverage.`);
    console.log(`Settings and templates are kept. Re-run with --yes to confirm:  npm run db:clear -- --yes`);
    return;
  }
  const [activities, leads, coverage] = await prisma.$transaction([
    prisma.activity.deleteMany(),
    prisma.lead.deleteMany(), // cascades to emails, sites and clients
    prisma.coverage.deleteMany(),
  ]);
  console.log(`Deleted ${leads.count} leads, ${activities.count} activity entries and ${coverage.count} coverage rows.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
