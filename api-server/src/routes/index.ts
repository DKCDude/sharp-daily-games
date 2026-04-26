import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import gameRouter from "./game";
import leaderboardRouter from "./leaderboard";
import statsRouter from "./stats";
import crossnumbersRouter from "./crossnumbers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(gameRouter);
router.use(leaderboardRouter);
router.use(statsRouter);
router.use(crossnumbersRouter);

export default router;
