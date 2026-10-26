import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";

// Creates the tables in an empty Turso database from prisma/schema.prisma.
// Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run turso:setup
async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) first.");
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const existing = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='Lead'");
  if (existing.rows.length) {
    console.log("Tables already exist; nothing to do.");
    return;
  }
  const sql = execSync("npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script", {
    encoding: "utf8",
  });
  await db.executeMultiple(sql);
  console.log("Created tables on Turso.");
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
