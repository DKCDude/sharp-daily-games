import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { dailyAttemptsTable, playerStateTable } from "@workspace/db";
import { GetGlobalStatsResponse } from "@workspace/api-zod";
import { and, count, eq, max } from "drizzle-orm";

const router: IRouter = Router();

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get("/stats", async (_req, res) => {
  const today = todayDateStr();

  const totalPlayersRow = await db
    .select({ value: count() })
    .from(playerStateTable);
  const longestRow = await db
    .select({ value: max(playerStateTable.longestStreak) })
    .from(playerStateTable);
  const playersTodayRow = await db
    .select({ value: count() })
    .from(dailyAttemptsTable)
    .where(eq(dailyAttemptsTable.date, today));
  const successesTodayRow = await db
    .select({ value: count() })
    .from(dailyAttemptsTable)
    .where(
      and(
        eq(dailyAttemptsTable.date, today),
        eq(dailyAttemptsTable.result, "correct"),
      ),
    );

  res.json(
    GetGlobalStatsResponse.parse({
      totalPlayers: totalPlayersRow[0]?.value ?? 0,
      playersToday: playersTodayRow[0]?.value ?? 0,
      successesToday: successesTodayRow[0]?.value ?? 0,
      longestStreakEver: longestRow[0]?.value ?? 0,
    }),
  );
});

export default router;
