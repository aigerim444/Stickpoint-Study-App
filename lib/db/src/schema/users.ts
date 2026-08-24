import { pgTable, text, integer, timestamp, uuid, jsonb, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Identity + account lifecycle. `id` mirrors the Supabase Auth user id, so
 * a verified access token maps straight onto our rows. Data minimization:
 * we hold first name and age band only — no birthdate, no surname.
 */
export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey(), // = Supabase auth user id
  email: text("email").notNull(),
  name: text("name").notNull().default(""),
  age: integer("age"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Snapshot sync (v1): the client's persisted app state as one JSONB blob,
 * last-write-wins by updatedAt. One student, one account, effectively one
 * device at a time — a full CRDT/normalized sync isn't warranted yet, and
 * this already delivers "switch phones and keep everything".
 */
export const appStatesTable = pgTable("app_states", {
  userId: uuid("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  state: jsonb("state").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * One row per completed study session — powers the three thesis metrics
 * (first-session completion, day-7 return) and later the "is this method
 * working?" check-in loop.
 */
export const sessionEventsTable = pgTable(
  "session_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    method: text("method").notNull(),
    occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  },
  (t) => [index("session_events_user_idx").on(t.userId, t.occurredAt)],
);

/**
 * Lightweight product analytics (quiz_completed, material_added, …).
 * userId is nullable: onboarding events happen before sign-in.
 */
export const analyticsEventsTable = pgTable(
  "analytics_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    props: jsonb("props"),
    occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  },
  (t) => [index("analytics_events_name_idx").on(t.name, t.occurredAt)],
);

/** Per-user daily AI call counter — the durable backing for usage quotas. */
export const aiUsageTable = pgTable(
  "ai_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    day: text("day").notNull(), // YYYY-MM-DD (UTC)
    calls: integer("calls").notNull().default(0),
  },
  (t) => [uniqueIndex("ai_usage_user_day_idx").on(t.userId, t.day)],
);

export const insertUserSchema = createInsertSchema(usersTable);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type AppStateRow = typeof appStatesTable.$inferSelect;
