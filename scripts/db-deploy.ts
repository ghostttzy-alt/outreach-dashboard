import { execSync } from "node:child_process";

// Applies prisma/migrations to the database in DATABASE_URL. Runs on every Netlify build and
// does nothing when the database is already up to date.
// Migrations need a direct (non-pooled) connection, so a Neon "-pooler" host is swapped for the direct one.
function directUrl(url: string) {
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL;
  return url.replace("-pooler.", ".");
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it in Netlify: Site configuration → Environment variables.");
  process.exit(1);
}
if (!/^postgres(ql)?:\/\//.test(url)) {
  console.error("DATABASE_URL must be a Postgres connection string starting with postgresql://");
  process.exit(1);
}
execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: directUrl(url) } });
// Seed HQ ventures (idempotent — skips if already seeded)
execSync("npx tsx prisma/seed-hq.ts", { stdio: "inherit" });
