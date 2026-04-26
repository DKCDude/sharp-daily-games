import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  dailyAttemptsTable,
  dailyWordsTable,
  playerStateTable,
} from "@workspace/db";
import {
  GetGameStateResponse,
  GetStreakHistoryResponse,
  GetTodayWordResponse,
  StartRevealResponse,
  SubmitGuessBody,
  SubmitGuessResponse,
} from "@workspace/api-zod";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

const router: IRouter = Router();

const REVEAL_DURATION_MS = 4000;

function todayDateStr(): string {
  // YYYY-MM-DD in Eastern Time — resets at midnight ET, not UTC.
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

const TEST_KEY = "sharpdev";

function getEffectiveDateStr(req: { query?: Record<string, unknown> }): string {
  const testKey = req.query?.testKey;
  const testDate = req.query?.testDate;
  if (
    testKey === TEST_KEY &&
    typeof testDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(testDate)
  ) {
    return testDate;
  }
  return todayDateStr();
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string): number {
  const a = new Date(start + "T00:00:00Z").getTime();
  const b = new Date(end + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}

function normalize(word: string): string {
  return word.trim().toLowerCase();
}

async function ensureTodayWord(date: string): Promise<{
  word: string;
  quote: string | null;
  quoteAuthor: string | null;
}> {
  const existing = await db
    .select()
    .from(dailyWordsTable)
    .where(eq(dailyWordsTable.date, date))
    .limit(1);
  if (existing[0]) {
    return {
      word: existing[0].word,
      quote: existing[0].quote,
      quoteAuthor: existing[0].quoteAuthor,
    };
  }

  // Pick deterministically from an alphabetically-sorted pool, advancing one
  // step per UTC day so the daily words march in alphabetical order (cycling
  // back to "a" after the last entry). Same word for every player on a date.
  const dayIndex = daysSinceEpoch(date);
  const pool = WORD_POOL[((dayIndex % WORD_POOL.length) + WORD_POOL.length) % WORD_POOL.length];
  const inserted = await db
    .insert(dailyWordsTable)
    .values({
      date,
      word: pool.word,
      quote: pool.quote,
      quoteAuthor: pool.quoteAuthor,
    })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) {
    return {
      word: inserted[0].word,
      quote: inserted[0].quote,
      quoteAuthor: inserted[0].quoteAuthor,
    };
  }
  // Race: another request inserted; re-read.
  const again = await db
    .select()
    .from(dailyWordsTable)
    .where(eq(dailyWordsTable.date, date))
    .limit(1);
  return {
    word: again[0]!.word,
    quote: again[0]!.quote,
    quoteAuthor: again[0]!.quoteAuthor,
  };
}

function daysSinceEpoch(date: string): number {
  const d = new Date(date + "T00:00:00Z").getTime();
  return Math.floor(d / 86400000);
}

// Daily words are kept in alphabetical order so consecutive days progress
// through the alphabet (a → b → c → ...), making longer streaks easier to
// memorize. Quotes are real, attributed lines about memory, mind, and time
// from public-domain or widely-cited authors.
const WORD_POOL: Array<{
  word: string;
  quote: string;
  quoteAuthor: string;
}> = [
  { word: "amber", quote: "Memory is the diary we all carry about with us.", quoteAuthor: "Oscar Wilde" },
  { word: "blossom", quote: "We do not remember days, we remember moments.", quoteAuthor: "Cesare Pavese" },
  { word: "candle", quote: "Memory is the treasury and guardian of all things.", quoteAuthor: "Cicero" },
  { word: "dawn", quote: "Memory is the mother of all wisdom.", quoteAuthor: "Aeschylus" },
  { word: "ember", quote: "The mind is not a vessel to be filled, but a fire to be kindled.", quoteAuthor: "Plutarch" },
  { word: "feather", quote: "Memory believes before knowing remembers.", quoteAuthor: "William Faulkner" },
  { word: "garden", quote: "We are our memory, that chimera of shapeless shifting fragments.", quoteAuthor: "Jorge Luis Borges" },
  { word: "harbor", quote: "What we remember from childhood we remember forever.", quoteAuthor: "Cynthia Ozick" },
  { word: "ivory", quote: "There is no greater sorrow than to recall happiness in times of misery.", quoteAuthor: "Dante Alighieri" },
  { word: "journey", quote: "Every man's memory is his private literature.", quoteAuthor: "Aldous Huxley" },
  { word: "kindle", quote: "Memory is the seamstress, and a capricious one at that.", quoteAuthor: "Virginia Woolf" },
  { word: "lantern", quote: "The faintest ink is more powerful than the strongest memory.", quoteAuthor: "Chinese proverb" },
  { word: "meadow", quote: "Recollection is the only paradise from which we cannot be turned out.", quoteAuthor: "Jean Paul Richter" },
  { word: "nectar", quote: "Memories warm you up from the inside.", quoteAuthor: "Haruki Murakami" },
  { word: "orchard", quote: "All memory is individual, unreproducible — it dies with each person.", quoteAuthor: "Susan Sontag" },
  { word: "pebble", quote: "Some memories are realities, and are better than anything that can ever happen again.", quoteAuthor: "Willa Cather" },
  { word: "quill", quote: "Memory is a magnet. It will pull to it and hold only material it can attract.", quoteAuthor: "Jessamyn West" },
  { word: "river", quote: "Nothing is ever really lost to us as long as we remember it.", quoteAuthor: "L. M. Montgomery" },
  { word: "sparrow", quote: "We forget all too soon the things we thought we could never forget.", quoteAuthor: "Joan Didion" },
  { word: "thicket", quote: "Memory is the fourth dimension to any landscape.", quoteAuthor: "Janet Fitch" },
  { word: "umber", quote: "The true art of memory is the art of attention.", quoteAuthor: "Samuel Johnson" },
  { word: "violet", quote: "How much of the past has been lost to us simply because no one remembered to write it down?", quoteAuthor: "Mary Oliver" },
  { word: "willow", quote: "Each of us is a book waiting to be written, and that book, if written, results in a person explained.", quoteAuthor: "Thomas M. Cirignano" },
  { word: "yarrow", quote: "Memory is a way of holding on to the things you love, the things you are, the things you never want to lose.", quoteAuthor: "Kevin Arnold" },
  { word: "zephyr", quote: "The palest ink is better than the best memory.", quoteAuthor: "Chinese proverb" },
];

async function getOrCreatePlayerState(userId: string) {
  const existing = await db
    .select()
    .from(playerStateTable)
    .where(eq(playerStateTable.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db
    .insert(playerStateTable)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) return inserted[0];
  const again = await db
    .select()
    .from(playerStateTable)
    .where(eq(playerStateTable.userId, userId))
    .limit(1);
  return again[0]!;
}

async function getAttempt(userId: string, date: string) {
  const rows = await db
    .select()
    .from(dailyAttemptsTable)
    .where(
      and(
        eq(dailyAttemptsTable.userId, userId),
        eq(dailyAttemptsTable.date, date),
      ),
    )
    .limit(1);
  return rows[0];
}

/**
 * If the player missed yesterday (i.e. last_played_date is older than yesterday
 * AND there's a current streak), reset the streak before computing today's
 * sequence length. Returns the (possibly updated) state.
 */
async function reconcileMissedDays(state: typeof playerStateTable.$inferSelect, today: string) {
  if (!state.lastPlayedDate || state.currentStreak === 0) return state;
  const gap = daysBetween(state.lastPlayedDate, today);
  if (gap > 1) {
    const updated = await db
      .update(playerStateTable)
      .set({ currentStreak: 0, streakStartDate: null })
      .where(eq(playerStateTable.userId, state.userId))
      .returning();
    return updated[0]!;
  }
  return state;
}

async function buildGameState(userId: string) {
  const today = todayDateStr();
  let state = await getOrCreatePlayerState(userId);
  state = await reconcileMissedDays(state, today);
  const attempt = await getAttempt(userId, today);
  const wordRow = await ensureTodayWord(today);

  let phase: "idle" | "revealing" | "recalling" | "completed" = "idle";
  let revealEndsAt: string | null = null;
  let lastResult: "correct" | "incorrect" | null = null;
  let quote: string | null = null;
  let quoteAuthor: string | null = null;

  if (attempt?.completedAt) {
    phase = "completed";
    lastResult = (attempt.result as "correct" | "incorrect" | null) ?? null;
    if (lastResult === "correct") {
      quote = wordRow.quote;
      quoteAuthor = wordRow.quoteAuthor;
    }
  } else if (attempt?.revealStartedAt) {
    phase = "revealing";
    revealEndsAt = new Date(
      attempt.revealStartedAt.getTime() + REVEAL_DURATION_MS,
    ).toISOString();
  }

  // Sequence length = current streak length + 1 (today's word).
  const sequenceLength = state.currentStreak + 1;

  return GetGameStateResponse.parse({
    date: today,
    phase,
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    sequenceLength,
    revealDurationMs: REVEAL_DURATION_MS,
    revealEndsAt,
    lastResult,
    quote,
    quoteAuthor,
  });
}

router.get("/game/state", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const data = await buildGameState(req.user.id);
  res.json(data);
});

router.get("/game/today", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const today = getEffectiveDateStr(req);
  const wordRow = await ensureTodayWord(today);
  const attempt = await getAttempt(req.user.id, today);
  let word: string | null = null;
  let revealEndsAt: string | null = null;
  if (attempt?.revealStartedAt && !attempt.completedAt) {
    word = wordRow.word;
    revealEndsAt = new Date(
      attempt.revealStartedAt.getTime() + REVEAL_DURATION_MS,
    ).toISOString();
  }
  const data = GetTodayWordResponse.parse({
    date: today,
    word,
    revealDurationMs: REVEAL_DURATION_MS,
    revealEndsAt,
  });
  res.json(data);
});

router.post("/game/reveal", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const today = getEffectiveDateStr(req);
  await ensureTodayWord(today);
  const existing = await getAttempt(req.user.id, today);
  if (!existing) {
    await db
      .insert(dailyAttemptsTable)
      .values({
        userId: req.user.id,
        date: today,
        revealStartedAt: new Date(),
      })
      .onConflictDoNothing();
  } else if (!existing.revealStartedAt && !existing.completedAt) {
    await db
      .update(dailyAttemptsTable)
      .set({ revealStartedAt: new Date() })
      .where(eq(dailyAttemptsTable.id, existing.id));
  }
  const state = await buildGameState(req.user.id);
  res.json(StartRevealResponse.parse(state));
});

router.post("/game/submit", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = SubmitGuessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const today = getEffectiveDateStr(req);
  const userId = req.user.id;
  let state = await getOrCreatePlayerState(userId);
  state = await reconcileMissedDays(state, today);
  const attempt = await getAttempt(userId, today);
  if (attempt?.completedAt) {
    res.status(409).json({ error: "Already submitted today" });
    return;
  }

  // Build expected sequence: words from streakStartDate up through today.
  const startDate = state.streakStartDate ?? today;
  const expectedRows = await db
    .select()
    .from(dailyWordsTable)
    .where(
      and(
        gte(dailyWordsTable.date, startDate),
        lte(dailyWordsTable.date, today),
      ),
    )
    .orderBy(asc(dailyWordsTable.date));

  // Make sure today is included.
  const todayWord = await ensureTodayWord(today);
  const expected = expectedRows.some((r) => r.date === today)
    ? expectedRows.map((r) => r.word)
    : [...expectedRows.map((r) => r.word), todayWord.word];

  const submitted = parsed.data.words.map(normalize);
  const expectedNorm = expected.map(normalize);

  let firstWrongIndex: number | null = null;
  let correct = submitted.length === expectedNorm.length;
  if (correct) {
    for (let i = 0; i < expectedNorm.length; i++) {
      if (submitted[i] !== expectedNorm[i]) {
        correct = false;
        firstWrongIndex = i;
        break;
      }
    }
  } else {
    for (let i = 0; i < Math.min(submitted.length, expectedNorm.length); i++) {
      if (submitted[i] !== expectedNorm[i]) {
        firstWrongIndex = i;
        break;
      }
    }
    if (firstWrongIndex === null) {
      firstWrongIndex = Math.min(submitted.length, expectedNorm.length);
    }
  }

  await db
    .insert(dailyAttemptsTable)
    .values({
      userId,
      date: today,
      revealStartedAt: attempt?.revealStartedAt ?? new Date(),
      completedAt: new Date(),
      result: correct ? "correct" : "incorrect",
      submittedSequence: JSON.stringify(parsed.data.words),
    })
    .onConflictDoUpdate({
      target: [dailyAttemptsTable.userId, dailyAttemptsTable.date],
      set: {
        completedAt: new Date(),
        result: correct ? "correct" : "incorrect",
        submittedSequence: JSON.stringify(parsed.data.words),
      },
    });

  let newCurrent: number;
  let newLongest: number;
  let newStart: string | null;
  if (correct) {
    newCurrent = state.currentStreak + 1;
    newLongest = Math.max(state.longestStreak, newCurrent);
    newStart = state.streakStartDate ?? today;
  } else {
    newCurrent = 0;
    newLongest = state.longestStreak;
    newStart = null;
  }
  await db
    .update(playerStateTable)
    .set({
      currentStreak: newCurrent,
      longestStreak: newLongest,
      streakStartDate: newStart,
      lastPlayedDate: today,
    })
    .where(eq(playerStateTable.userId, userId));

  res.json(
    SubmitGuessResponse.parse({
      correct,
      currentStreak: newCurrent,
      longestStreak: newLongest,
      correctSequence: expected,
      firstWrongIndex,
      quote: correct ? todayWord.quote : null,
      quoteAuthor: correct ? todayWord.quoteAuthor : null,
    }),
  );
});

router.get("/game/history", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  const today = todayDateStr();
  let state = await getOrCreatePlayerState(userId);
  state = await reconcileMissedDays(state, today);

  let words: { date: string; word: string; index: number }[] = [];
  if (state.streakStartDate && state.currentStreak > 0) {
    const rows = await db
      .select()
      .from(dailyWordsTable)
      .where(
        and(
          gte(dailyWordsTable.date, state.streakStartDate),
          lte(dailyWordsTable.date, state.lastPlayedDate ?? today),
        ),
      )
      .orderBy(asc(dailyWordsTable.date));
    words = rows.map((r, i) => ({
      date: r.date,
      word: r.word,
      index: i,
    }));
  }

  res.json(
    GetStreakHistoryResponse.parse({
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      words,
    }),
  );
});

router.delete("/game/attempt", async (req, res) => {
  if (req.query?.testKey !== TEST_KEY) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const date = getEffectiveDateStr(req);
  const userId = req.user.id;
  await db
    .delete(dailyAttemptsTable)
    .where(
      and(
        eq(dailyAttemptsTable.userId, userId),
        eq(dailyAttemptsTable.date, date),
      ),
    );
  res.json({ ok: true });
});

export default router;
