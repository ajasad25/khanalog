/**
 * Create the Postgres tables (idempotent).
 *
 *   npm run db:push
 *
 * Reads DATABASE_URL from .env.local (or the environment on Vercel).
 */
import { config } from "dotenv";
import { neonSql } from "../lib/db";
import { PostgresStore } from "../lib/store";

config({ path: ".env.local", quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  await new PostgresStore(neonSql(url)).migrate();
  console.log("Schema applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
