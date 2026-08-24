import { sql } from "drizzle-orm";
import { getDb, schema } from "./db";

/**
 * Durable per-user daily AI call quota. Counts in Postgres so it holds
 * across serverless instances; without a database it's a no-op (the
 * per-IP rate limiter still applies).
 */
const DAILY_CAP = Number(process.env.AI_DAILY_CALL_CAP) || 300;

export async function checkAiQuota(userId: string): Promise<{ allowed: boolean; used: number; cap: number }> {
  const db = getDb();
  if (!db) return { allowed: true, used: 0, cap: DAILY_CAP };
  const day = new Date().toISOString().slice(0, 10);
  const rows = await db
    .insert(schema.aiUsageTable)
    .values({ userId, day, calls: 1 })
    .onConflictDoUpdate({
      target: [schema.aiUsageTable.userId, schema.aiUsageTable.day],
      set: { calls: sql`${schema.aiUsageTable.calls} + 1` },
    })
    .returning({ calls: schema.aiUsageTable.calls });
  const used = rows[0]?.calls ?? 1;
  return { allowed: used <= DAILY_CAP, used, cap: DAILY_CAP };
}

/** Makes sure a users row exists before quota rows reference it. */
export async function ensureUserRow(user: { id: string; email: string }): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .insert(schema.usersTable)
    .values({ id: user.id, email: user.email })
    .onConflictDoNothing();
}
