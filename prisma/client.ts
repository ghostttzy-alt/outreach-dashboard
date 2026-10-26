import { PrismaClient } from "@prisma/client";

/**
 * Neon's and Supabase's pooled connection strings go through PgBouncer, which needs `pgbouncer=true`
 * so Prisma doesn't use prepared statements. Add it automatically so either kind of URL works.
 */
export function runtimeDatabaseUrl(url = process.env.DATABASE_URL ?? "") {
  if (!url) return url;
  const pooled = /-pooler\.|pooler\.supabase\.com|:6543\//.test(url);
  if (!pooled || /[?&]pgbouncer=/.test(url)) return url;
  return url + (url.includes("?") ? "&" : "?") + "pgbouncer=true";
}

export function createPrisma() {
  const url = runtimeDatabaseUrl();
  return url ? new PrismaClient({ datasourceUrl: url }) : new PrismaClient();
}
