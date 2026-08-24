import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "../lib/db";
import { optionalAuth, requireAuth } from "../middlewares/auth";
import { rateLimit } from "../middlewares/rateLimit";

/**
 * Accounts, snapshot sync, data export/deletion, and product analytics.
 * The server is the source of truth once a student signs in; the client
 * keeps working offline and reconciles by last-write-wins.
 */

const router: IRouter = Router();

function requireDb(res: Response) {
  const db = getDb();
  if (!db) {
    res.status(503).json({ error: "Sync is not configured on this server" });
    return null;
  }
  return db;
}

/** Keep the users row in step with the verified identity. */
async function upsertUser(
  db: NonNullable<ReturnType<typeof getDb>>,
  user: { id: string; email: string },
  profile?: { name?: unknown; age?: unknown },
) {
  const name = typeof profile?.name === "string" ? profile.name.slice(0, 120) : undefined;
  const age =
    typeof profile?.age === "number" && Number.isFinite(profile.age)
      ? Math.round(profile.age)
      : undefined;
  await db
    .insert(schema.usersTable)
    .values({ id: user.id, email: user.email, name: name ?? "", age })
    .onConflictDoUpdate({
      target: schema.usersTable.id,
      set: {
        email: user.email,
        ...(name !== undefined ? { name } : {}),
        ...(age !== undefined ? { age } : {}),
        updatedAt: new Date(),
      },
    });
}

// ---------- Snapshot sync ----------

router.get("/sync", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const db = requireDb(res);
  if (!db) return;
  const rows = await db
    .select()
    .from(schema.appStatesTable)
    .where(eq(schema.appStatesTable.userId, req.user!.id));
  if (!rows.length) {
    res.status(404).json({ error: "No synced state yet" });
    return;
  }
  res.json({ state: rows[0].state, updatedAt: rows[0].updatedAt.getTime() });
});

const putSyncBody = z.object({
  // The client's persisted app-state snapshot. Structure is owned by the
  // client; the server only stores and returns it. Size-capped.
  state: z.record(z.string(), z.unknown()),
  clientUpdatedAt: z.number().int().positive(),
});

router.put("/sync", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const db = requireDb(res);
  if (!db) return;
  const parsed = putSyncBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "state object and clientUpdatedAt are required" });
    return;
  }
  if (JSON.stringify(parsed.data.state).length > 2_000_000) {
    res.status(413).json({ error: "State snapshot is too large" });
    return;
  }

  const existing = await db
    .select({ updatedAt: schema.appStatesTable.updatedAt })
    .from(schema.appStatesTable)
    .where(eq(schema.appStatesTable.userId, req.user!.id));

  // Last-write-wins: if the server copy is newer than what this client
  // last saw, hand the server copy back instead of clobbering it.
  if (existing.length && existing[0].updatedAt.getTime() > parsed.data.clientUpdatedAt) {
    const rows = await db
      .select()
      .from(schema.appStatesTable)
      .where(eq(schema.appStatesTable.userId, req.user!.id));
    res.status(409).json({
      error: "Server has newer state",
      state: rows[0].state,
      updatedAt: rows[0].updatedAt.getTime(),
    });
    return;
  }

  const state = parsed.data.state as { name?: unknown; age?: unknown };
  await upsertUser(db, req.user!, state);
  const now = new Date();
  await db
    .insert(schema.appStatesTable)
    .values({ userId: req.user!.id, state: parsed.data.state, updatedAt: now })
    .onConflictDoUpdate({
      target: schema.appStatesTable.userId,
      set: { state: parsed.data.state, updatedAt: now },
    });
  res.json({ ok: true, updatedAt: now.getTime() });
});

// ---------- Session + product analytics ----------

const eventBody = z.object({
  name: z.string().min(1).max(64),
  method: z.string().max(64).optional(),
  props: z.record(z.string(), z.unknown()).optional(),
});

router.post(
  "/events",
  rateLimit({ windowMs: 60_000, max: 60 }),
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    const db = getDb();
    const parsed = eventBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "event name is required" });
      return;
    }
    // No DB → accept and drop, so clients never need to special-case this.
    if (!db) {
      res.json({ ok: true, stored: false });
      return;
    }
    if (req.user) await upsertUser(db, req.user);
    if (parsed.data.name === "session_completed" && req.user && parsed.data.method) {
      await db.insert(schema.sessionEventsTable).values({
        userId: req.user.id,
        method: parsed.data.method,
      });
    }
    await db.insert(schema.analyticsEventsTable).values({
      userId: req.user?.id ?? null,
      name: parsed.data.name,
      props: parsed.data.props ?? null,
    });
    res.json({ ok: true, stored: true });
  },
);

// ---------- Data export & account deletion ----------

router.get("/account/export", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const db = requireDb(res);
  if (!db) return;
  const userId = req.user!.id;
  const [users, states, sessions] = await Promise.all([
    db.select().from(schema.usersTable).where(eq(schema.usersTable.id, userId)),
    db.select().from(schema.appStatesTable).where(eq(schema.appStatesTable.userId, userId)),
    db.select().from(schema.sessionEventsTable).where(eq(schema.sessionEventsTable.userId, userId)),
  ]);
  res.setHeader("Content-Disposition", 'attachment; filename="stickpoint-data.json"');
  res.json({
    exportedAt: new Date().toISOString(),
    account: users[0] ?? { id: userId, email: req.user!.email },
    appState: states[0]?.state ?? null,
    studySessions: sessions,
  });
});

router.post("/account/delete", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const db = requireDb(res);
  if (!db) return;
  const userId = req.user!.id;

  // Cascades wipe app_states, session_events, ai_usage; analytics rows
  // are anonymized via ON DELETE SET NULL.
  await db.delete(schema.usersTable).where(eq(schema.usersTable.id, userId));

  // Delete the auth identity too, when the server holds an admin key.
  let authDeleted = false;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
      authDeleted = r.ok;
    } catch {
      authDeleted = false;
    }
  }
  req.log.info({ userId, authDeleted }, "account deleted");
  res.json({ ok: true, authDeleted });
});

export default router;
