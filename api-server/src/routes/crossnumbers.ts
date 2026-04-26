import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  crossnumbersAttemptsTable,
  crossnumbersPlayerStateTable,
  crossnumbersRemindersTable,
  usersTable,
} from "@workspace/db";
import {
  GetCrossnumbersStateResponse,
  SaveCrossnumbersProgressBody,
  SaveCrossnumbersProgressResponse,
  GetCrossnumbersPuzzleResponse,
  SubmitCrossnumbersBody,
  SubmitCrossnumbersResponse,
  GetCrossnumbersHistoryResponse,
  GetCrossnumbersLeaderboardResponse,
  GetCrossnumbersStatsResponse,
  GetCrossnumbersReminderResponse,
  UpdateCrossnumbersReminderBody,
  UpdateCrossnumbersReminderResponse,
} from "@workspace/api-zod";
import {
  generatePuzzle,
  validatePuzzle,
  buildShareText,
  type Puzzle,
  type PlayerGrid,
} from "@workspace/crossnumbers-engine";
import { and, asc, count, desc, eq, gt, isNotNull, sql } from "drizzle-orm";

const router: IRouter = Router();

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

// Cache today's generated puzzle in memory (puzzle generation is expensive on
// harder days). Keyed by date string.
const PUZZLE_CACHE = new Map<string, Puzzle>();
function getPuzzleForDate(dateStr: string): Puzzle {
  const cached = PUZZLE_CACHE.get(dateStr);
  if (cached) return cached;
  const puzzle = generatePuzzle(new Date(dateStr + "T00:00:00Z"));
  PUZZLE_CACHE.set(dateStr, puzzle);
  return puzzle;
}

// Strip cell answers so the client never receives the solution. Only `given`
// cells keep their value. Number prefix (clue number) is preserved.
function publicGrid(puzzle: Puzzle) {
  // Engine numbers entries (1-Across, 2-Down) but doesn't stamp those numbers
  // back onto the grid cells. Derive a (row,col) -> number map so the client
  // can render the small clue number in the cell corner.
  const numberAt = new Map<string, number>();
  for (const e of puzzle.entries) {
    if (e.number == null) continue;
    const key = `${e.row},${e.col}`;
    if (!numberAt.has(key)) numberAt.set(key, e.number);
  }
  return puzzle.grid.map((row, r) =>
    row.map((cell, c) => {
      if (cell.type === "black") return { type: "black" as const };
      return {
        type: cell.type,
        given: cell.given ?? false,
        value: cell.given ? cell.value ?? null : null,
        number: numberAt.get(`${r},${c}`) ?? cell.number ?? null,
      };
    }),
  );
}

function publicClues(puzzle: Puzzle) {
  return puzzle.entries
    .filter((e) => e.number != null)
    .map((e) => ({
      id: e.id,
      number: e.number as number,
      direction: e.direction,
      clueType: e.clueType,
      clue: e.clue,
      row: e.row,
      col: e.col,
      length: e.length,
    }));
}

async function getOrCreatePlayerState(userId: string) {
  const existing = await db
    .select()
    .from(crossnumbersPlayerStateTable)
    .where(eq(crossnumbersPlayerStateTable.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db
    .insert(crossnumbersPlayerStateTable)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) return inserted[0];
  const again = await db
    .select()
    .from(crossnumbersPlayerStateTable)
    .where(eq(crossnumbersPlayerStateTable.userId, userId))
    .limit(1);
  return again[0]!;
}

async function getAttempt(userId: string, date: string) {
  const rows = await db
    .select()
    .from(crossnumbersAttemptsTable)
    .where(
      and(
        eq(crossnumbersAttemptsTable.userId, userId),
        eq(crossnumbersAttemptsTable.date, date),
      ),
    )
    .limit(1);
  return rows[0];
}

// If the player missed a day after their last solve, reset the streak.
async function reconcileMissedDays(
  state: typeof crossnumbersPlayerStateTable.$inferSelect,
  today: string,
) {
  if (!state.lastSolvedDate || state.currentStreak === 0) return state;
  const gap = daysBetween(state.lastSolvedDate, today);
  if (gap > 1) {
    const updated = await db
      .update(crossnumbersPlayerStateTable)
      .set({ currentStreak: 0, streakStartDate: null })
      .where(eq(crossnumbersPlayerStateTable.userId, state.userId))
      .returning();
    return updated[0]!;
  }
  return state;
}

router.get("/crossnumbers/state", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const today = getEffectiveDateStr(req);
  let state = await getOrCreatePlayerState(req.user.id);
  state = await reconcileMissedDays(state, today);
  const attempt = await getAttempt(req.user.id, today);
  const puzzle = getPuzzleForDate(today);

  let attemptStatus: "not_started" | "in_progress" | "solved" | "failed" =
    "not_started";
  if (attempt?.completedAt) {
    attemptStatus = attempt.solved ? "solved" : "failed";
  } else if (attempt) {
    attemptStatus = "in_progress";
  }

  res.json(
    GetCrossnumbersStateResponse.parse({
      date: today,
      dayName: puzzle.dayName,
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      totalSolved: state.totalSolved,
      bestSolveTimeMs: state.bestSolveTimeMs ?? null,
      attemptStatus,
      startedAt: attempt?.startedAt
        ? attempt.startedAt.toISOString()
        : null,
      completedAt: attempt?.completedAt
        ? attempt.completedAt.toISOString()
        : null,
      solveTimeMs: attempt?.solveTimeMs ?? null,
      errorCount: attempt?.errorCount ?? 0,
      playerGrid:
        attempt && !attempt.completedAt
          ? (attempt.playerGrid as unknown) ?? null
          : null,
    }),
  );
});

router.put("/crossnumbers/progress", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = SaveCrossnumbersProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const today = getEffectiveDateStr(req);
  const userId = req.user.id;
  const puzzle = getPuzzleForDate(today);
  const playerGrid = parsed.data.playerGrid;

  if (
    playerGrid.length !== puzzle.size ||
    playerGrid.some((row) => row.length !== puzzle.size)
  ) {
    res.status(400).json({ error: "Grid size mismatch" });
    return;
  }

  // Don't overwrite completed attempts.
  const existing = await getAttempt(userId, today);
  if (existing?.completedAt) {
    res.json(SaveCrossnumbersProgressResponse.parse({ ok: true }));
    return;
  }

  await db
    .insert(crossnumbersAttemptsTable)
    .values({
      userId,
      date: today,
      startedAt: existing?.startedAt ?? new Date(),
      playerGrid,
    })
    .onConflictDoUpdate({
      target: [
        crossnumbersAttemptsTable.userId,
        crossnumbersAttemptsTable.date,
      ],
      set: { playerGrid },
    });

  res.json(SaveCrossnumbersProgressResponse.parse({ ok: true }));
});

router.get("/crossnumbers/puzzle", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const today = getEffectiveDateStr(req);
  const puzzle = getPuzzleForDate(today);

  // Mark attempt as started (in_progress) if not already started.
  const existing = await getAttempt(req.user.id, today);
  if (!existing) {
    await db
      .insert(crossnumbersAttemptsTable)
      .values({ userId: req.user.id, date: today })
      .onConflictDoNothing();
  }

  res.json(
    GetCrossnumbersPuzzleResponse.parse({
      date: puzzle.date,
      dayName: puzzle.dayName,
      size: puzzle.size,
      grid: publicGrid(puzzle),
      clues: publicClues(puzzle),
    }),
  );
});

router.post("/crossnumbers/submit", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = SubmitCrossnumbersBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const today = getEffectiveDateStr(req);
  const userId = req.user.id;
  let state = await getOrCreatePlayerState(userId);
  state = await reconcileMissedDays(state, today);

  const existing = await getAttempt(userId, today);
  if (existing?.completedAt && existing.solved) {
    res.status(409).json({ error: "Already solved today" });
    return;
  }

  const puzzle = getPuzzleForDate(today);
  const playerGrid = parsed.data.playerGrid as PlayerGrid;

  // Defensive shape check.
  if (
    playerGrid.length !== puzzle.size ||
    playerGrid.some((row) => row.length !== puzzle.size)
  ) {
    res.status(400).json({ error: "Grid size mismatch" });
    return;
  }

  const result = validatePuzzle(puzzle, playerGrid);
  const solved = result.valid;
  const solveTimeMs = Math.max(0, parsed.data.solveTimeMs | 0);

  // Update attempt row.
  await db
    .insert(crossnumbersAttemptsTable)
    .values({
      userId,
      date: today,
      startedAt: existing?.startedAt ?? new Date(),
      completedAt: solved ? new Date() : null,
      solved,
      solveTimeMs: solved ? solveTimeMs : null,
      errorCount: result.errors.length,
      playerGrid,
    })
    .onConflictDoUpdate({
      target: [
        crossnumbersAttemptsTable.userId,
        crossnumbersAttemptsTable.date,
      ],
      set: {
        completedAt: solved ? new Date() : null,
        solved,
        solveTimeMs: solved ? solveTimeMs : null,
        errorCount: result.errors.length,
        playerGrid,
      },
    });

  let newCurrent = state.currentStreak;
  let newLongest = state.longestStreak;
  let newStart: string | null = state.streakStartDate;
  let newTotal = state.totalSolved;
  let newBest: number | null = state.bestSolveTimeMs;

  if (solved) {
    // Continue streak if last solved was yesterday; start fresh otherwise.
    if (state.lastSolvedDate && daysBetween(state.lastSolvedDate, today) === 1) {
      newCurrent = state.currentStreak + 1;
    } else if (state.lastSolvedDate === today) {
      newCurrent = state.currentStreak;
    } else {
      newCurrent = 1;
      newStart = today;
    }
    newLongest = Math.max(state.longestStreak, newCurrent);
    newStart = newStart ?? today;
    newTotal = state.totalSolved + 1;
    newBest =
      state.bestSolveTimeMs == null
        ? solveTimeMs
        : Math.min(state.bestSolveTimeMs, solveTimeMs);

    await db
      .update(crossnumbersPlayerStateTable)
      .set({
        currentStreak: newCurrent,
        longestStreak: newLongest,
        streakStartDate: newStart,
        lastSolvedDate: today,
        totalSolved: newTotal,
        bestSolveTimeMs: newBest,
      })
      .where(eq(crossnumbersPlayerStateTable.userId, userId));
  }

  let shareText: string | null = null;
  if (solved) {
    try {
      shareText = buildShareText(
        puzzle,
        playerGrid,
        Math.round(solveTimeMs / 1000),
      );
    } catch {
      shareText = null;
    }
  }

  res.json(
    SubmitCrossnumbersResponse.parse({
      solved,
      errors: result.errors,
      currentStreak: newCurrent,
      longestStreak: newLongest,
      totalSolved: newTotal,
      solveTimeMs: solved ? solveTimeMs : null,
      bestSolveTimeMs: newBest,
      shareText,
    }),
  );
});

router.get("/crossnumbers/history", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;
  let state = await getOrCreatePlayerState(userId);
  state = await reconcileMissedDays(state, todayDateStr());

  const rows = await db
    .select()
    .from(crossnumbersAttemptsTable)
    .where(eq(crossnumbersAttemptsTable.userId, userId))
    .orderBy(desc(crossnumbersAttemptsTable.date))
    .limit(60);

  const entries = rows.map((r) => {
    const d = new Date(r.date + "T00:00:00Z");
    const dayName = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ][(d.getUTCDay() + 6) % 7];
    return {
      date: r.date,
      dayName,
      solved: r.solved,
      solveTimeMs: r.solveTimeMs ?? null,
      errorCount: r.errorCount,
    };
  });

  res.json(
    GetCrossnumbersHistoryResponse.parse({
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      totalSolved: state.totalSolved,
      bestSolveTimeMs: state.bestSolveTimeMs ?? null,
      entries,
    }),
  );
});

router.get("/crossnumbers/leaderboard", async (_req, res) => {
  const today = todayDateStr();

  const longestRows = await db
    .select({
      userId: crossnumbersPlayerStateTable.userId,
      currentStreak: crossnumbersPlayerStateTable.currentStreak,
      longestStreak: crossnumbersPlayerStateTable.longestStreak,
      bestSolveTimeMs: crossnumbersPlayerStateTable.bestSolveTimeMs,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(crossnumbersPlayerStateTable)
    .leftJoin(usersTable, eq(usersTable.id, crossnumbersPlayerStateTable.userId))
    .where(gt(crossnumbersPlayerStateTable.longestStreak, 0))
    .orderBy(desc(crossnumbersPlayerStateTable.longestStreak))
    .limit(10);

  const currentRows = await db
    .select({
      userId: crossnumbersPlayerStateTable.userId,
      currentStreak: crossnumbersPlayerStateTable.currentStreak,
      longestStreak: crossnumbersPlayerStateTable.longestStreak,
      bestSolveTimeMs: crossnumbersPlayerStateTable.bestSolveTimeMs,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(crossnumbersPlayerStateTable)
    .leftJoin(usersTable, eq(usersTable.id, crossnumbersPlayerStateTable.userId))
    .where(gt(crossnumbersPlayerStateTable.currentStreak, 0))
    .orderBy(desc(crossnumbersPlayerStateTable.currentStreak))
    .limit(10);

  const fastestRows = await db
    .select({
      userId: crossnumbersAttemptsTable.userId,
      solveTimeMs: crossnumbersAttemptsTable.solveTimeMs,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(crossnumbersAttemptsTable)
    .leftJoin(usersTable, eq(usersTable.id, crossnumbersAttemptsTable.userId))
    .where(
      and(
        eq(crossnumbersAttemptsTable.date, today),
        eq(crossnumbersAttemptsTable.solved, true),
        isNotNull(crossnumbersAttemptsTable.solveTimeMs),
      ),
    )
    .orderBy(asc(crossnumbersAttemptsTable.solveTimeMs))
    .limit(10);

  const displayName = (r: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  }) =>
    [r.firstName, r.lastName].filter(Boolean).join(" ").trim() ||
    r.email ||
    "Player";

  res.json(
    GetCrossnumbersLeaderboardResponse.parse({
      topLongest: longestRows.map((r) => ({
        userId: r.userId,
        displayName: displayName(r),
        profileImageUrl: r.profileImageUrl,
        currentStreak: r.currentStreak,
        longestStreak: r.longestStreak,
        bestSolveTimeMs: r.bestSolveTimeMs ?? null,
      })),
      topCurrent: currentRows.map((r) => ({
        userId: r.userId,
        displayName: displayName(r),
        profileImageUrl: r.profileImageUrl,
        currentStreak: r.currentStreak,
        longestStreak: r.longestStreak,
        bestSolveTimeMs: r.bestSolveTimeMs ?? null,
      })),
      fastestToday: fastestRows.map((r) => ({
        userId: r.userId,
        displayName: displayName(r),
        profileImageUrl: r.profileImageUrl,
        solveTimeMs: r.solveTimeMs!,
      })),
    }),
  );
});

router.get("/crossnumbers/stats", async (_req, res) => {
  const today = todayDateStr();

  const totalPlayersRow = await db
    .select({ value: count() })
    .from(crossnumbersPlayerStateTable);
  const longestRow = await db
    .select({ value: sql<number>`coalesce(max(${crossnumbersPlayerStateTable.longestStreak}), 0)` })
    .from(crossnumbersPlayerStateTable);
  const playersTodayRow = await db
    .select({ value: count() })
    .from(crossnumbersAttemptsTable)
    .where(eq(crossnumbersAttemptsTable.date, today));
  const solvesTodayRow = await db
    .select({ value: count() })
    .from(crossnumbersAttemptsTable)
    .where(
      and(
        eq(crossnumbersAttemptsTable.date, today),
        eq(crossnumbersAttemptsTable.solved, true),
      ),
    );
  const avgRow = await db
    .select({
      value: sql<number | null>`avg(${crossnumbersAttemptsTable.solveTimeMs})`,
    })
    .from(crossnumbersAttemptsTable)
    .where(
      and(
        eq(crossnumbersAttemptsTable.date, today),
        eq(crossnumbersAttemptsTable.solved, true),
        isNotNull(crossnumbersAttemptsTable.solveTimeMs),
      ),
    );

  const avgMs = avgRow[0]?.value;
  const averageSolveSecondsToday =
    avgMs == null ? null : Math.round(Number(avgMs) / 1000);

  res.json(
    GetCrossnumbersStatsResponse.parse({
      totalPlayers: totalPlayersRow[0]?.value ?? 0,
      playersToday: playersTodayRow[0]?.value ?? 0,
      solvesToday: solvesTodayRow[0]?.value ?? 0,
      averageSolveSecondsToday,
      longestStreakEver: Number(longestRow[0]?.value ?? 0),
    }),
  );
});

router.get("/crossnumbers/reminder", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const rows = await db
    .select()
    .from(crossnumbersRemindersTable)
    .where(eq(crossnumbersRemindersTable.userId, req.user.id))
    .limit(1);
  const r = rows[0];
  res.json(
    GetCrossnumbersReminderResponse.parse({
      enabled: r?.enabled ?? false,
      hourLocal: r?.hourLocal ?? 9,
      minuteLocal: r?.minuteLocal ?? 0,
      timezone: r?.timezone ?? "UTC",
      channel: (r?.channel as "browser") ?? "browser",
    }),
  );
});

router.put("/crossnumbers/reminder", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = UpdateCrossnumbersReminderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const data = parsed.data;
  await db
    .insert(crossnumbersRemindersTable)
    .values({
      userId: req.user.id,
      enabled: data.enabled,
      hourLocal: data.hourLocal,
      minuteLocal: data.minuteLocal,
      timezone: data.timezone,
      channel: "browser",
    })
    .onConflictDoUpdate({
      target: crossnumbersRemindersTable.userId,
      set: {
        enabled: data.enabled,
        hourLocal: data.hourLocal,
        minuteLocal: data.minuteLocal,
        timezone: data.timezone,
        channel: "browser",
      },
    });
  res.json(
    UpdateCrossnumbersReminderResponse.parse({
      enabled: data.enabled,
      hourLocal: data.hourLocal,
      minuteLocal: data.minuteLocal,
      timezone: data.timezone,
      channel: "browser",
    }),
  );
});

router.delete("/crossnumbers/attempt", async (req, res) => {
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
    .delete(crossnumbersAttemptsTable)
    .where(
      and(
        eq(crossnumbersAttemptsTable.userId, userId),
        eq(crossnumbersAttemptsTable.date, date),
      ),
    );
  res.json({ ok: true });
});

export default router;
