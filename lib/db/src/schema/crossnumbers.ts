import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

// One row per (user, date) representing the player's Crossnumbers attempt.
export const crossnumbersAttemptsTable = pgTable(
  "crossnumbers_attempts",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    date: date("date").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    solved: boolean("solved").notNull().default(false),
    solveTimeMs: integer("solve_time_ms"),
    errorCount: integer("error_count").notNull().default(0),
    playerGrid: jsonb("player_grid"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("crossnumbers_attempts_user_date_unique").on(
      table.userId,
      table.date,
    ),
    index("crossnumbers_attempts_user_idx").on(table.userId),
    index("crossnumbers_attempts_date_idx").on(table.date),
  ],
);

export const crossnumbersPlayerStateTable = pgTable(
  "crossnumbers_player_state",
  {
    userId: varchar("user_id").primaryKey(),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    streakStartDate: date("streak_start_date"),
    lastSolvedDate: date("last_solved_date"),
    totalSolved: integer("total_solved").notNull().default(0),
    bestSolveTimeMs: integer("best_solve_time_ms"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
);

export const crossnumbersRemindersTable = pgTable("crossnumbers_reminders", {
  userId: varchar("user_id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  hourLocal: smallint("hour_local").notNull().default(9),
  minuteLocal: smallint("minute_local").notNull().default(0),
  timezone: varchar("timezone", { length: 64 })
    .notNull()
    .default("UTC"),
  channel: varchar("channel", { length: 16 }).notNull().default("browser"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type CrossnumbersAttempt =
  typeof crossnumbersAttemptsTable.$inferSelect;
export type CrossnumbersPlayerState =
  typeof crossnumbersPlayerStateTable.$inferSelect;
export type CrossnumbersReminder =
  typeof crossnumbersRemindersTable.$inferSelect;
