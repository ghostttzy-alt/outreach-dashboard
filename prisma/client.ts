import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

/**
 * Local development uses the SQLite file in DATABASE_URL.
 * When TURSO_DATABASE_URL is set (e.g. on Netlify), the same schema runs on Turso's hosted libSQL.
 */
export function createPrisma() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return new PrismaClient();
  return new PrismaClient({ adapter: new PrismaLibSQL({ url, authToken: process.env.TURSO_AUTH_TOKEN }) });
}
