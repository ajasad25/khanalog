import { neon } from "@neondatabase/serverless";

/**
 * Minimal query interface so the store can run on Neon in production and on
 * PGlite (in-process Postgres) in tests.
 */
export type Row = Record<string, unknown>;
export type Sql = (text: string, params?: unknown[]) => Promise<Row[]>;

export function neonSql(databaseUrl: string): Sql {
  const client = neon(databaseUrl);
  return async (text, params = []) => (await client.query(text, params)) as Row[];
}
