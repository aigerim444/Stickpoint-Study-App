import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@workspace/db/schema";

/**
 * Lazy, optional database handle. Sync/accounts/analytics need Postgres;
 * the AI endpoints don't. When DATABASE_URL is unset the server still runs
 * and DB-backed routes answer 503, so a fresh deploy without a database
 * keeps the study features alive.
 */

export type Db = NodePgDatabase<typeof schema>;

let _db: Db | null = null;

export function getDb(): Db | null {
  if (!process.env.DATABASE_URL) return null;
  if (!_db) {
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    });
    _db = drizzle(pool, { schema });
  }
  return _db;
}

export { schema };
