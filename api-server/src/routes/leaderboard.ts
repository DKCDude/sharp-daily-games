import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playerStateTable, usersTable } from "@workspace/db";
import { GetLeaderboardResponse } from "@workspace/api-zod";
import { desc, eq, gt } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (_req, res) => {
  const topLongestRows = await db
    .select({
      userId: playerStateTable.userId,
      currentStreak: playerStateTable.currentStreak,
      longestStreak: playerStateTable.longestStreak,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(playerStateTable)
    .leftJoin(usersTable, eq(usersTable.id, playerStateTable.userId))
    .where(gt(playerStateTable.longestStreak, 0))
    .orderBy(desc(playerStateTable.longestStreak))
    .limit(10);

  const topCurrentRows = await db
    .select({
      userId: playerStateTable.userId,
      currentStreak: playerStateTable.currentStreak,
      longestStreak: playerStateTable.longestStreak,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      email: usersTable.email,
      profileImageUrl: usersTable.profileImageUrl,
    })
    .from(playerStateTable)
    .leftJoin(usersTable, eq(usersTable.id, playerStateTable.userId))
    .where(gt(playerStateTable.currentStreak, 0))
    .orderBy(desc(playerStateTable.currentStreak))
    .limit(10);

  const toEntry = (r: (typeof topLongestRows)[number]) => {
    const name =
      [r.firstName, r.lastName].filter(Boolean).join(" ").trim() ||
      r.email ||
      "Player";
    return {
      userId: r.userId,
      displayName: name,
      profileImageUrl: r.profileImageUrl,
      currentStreak: r.currentStreak,
      longestStreak: r.longestStreak,
    };
  };

  res.json(
    GetLeaderboardResponse.parse({
      topLongest: topLongestRows.map(toEntry),
      topCurrent: topCurrentRows.map(toEntry),
    }),
  );
});

export default router;
