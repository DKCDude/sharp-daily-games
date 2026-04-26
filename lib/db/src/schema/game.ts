import { sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

// One row per calendar day with the official "word of the day" and a quote.
export const dailyWordsTable = pgTable("daily_words", {
  date: date("date").primaryKey(),
  word: varchar("word", { length: 64 }).notNull(),
  quote: text("quote"),
  quoteAuthor: varchar("quote_author", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Per-user gameplay state. One row per user. Tracks streaks and the start date
// of the current streak so we can rebuild the recall sequence.
export const playerStateTable = pgTable("player_state", {
  userId: varchar("user_id").primaryKey(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  // The first calendar date in the current streak. Null when streak == 0.
  streakStartDate: date("streak_start_date"),
  lastPlayedDate: date("last_played_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// One row per (user, date) representing the player's attempt that day.
// reveal_started_at is set when the player begins viewing the word.
// completed_at is set when they submit. result is "correct" or "incorrect".
export const dailyAttemptsTable = pgTable(
  "daily_attempts",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    date: date("date").notNull(),
    revealStartedAt: timestamp("reveal_started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    result: varchar("result", { length: 16 }),
    submittedSequence: text("submitted_sequence"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("daily_attempts_user_date_unique").on(table.userId, table.date),
    index("daily_attempts_user_idx").on(table.userId),
  ],
);

export type DailyWord = typeof dailyWordsTable.$inferSelect;
export type PlayerState = typeof playerStateTable.$inferSelect;
export type DailyAttempt = typeof dailyAttemptsTable.$inferSelect;
