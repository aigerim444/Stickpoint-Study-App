import { Router, type IRouter } from "express";
import healthRouter from "./health";
import claudeRouter from "./claude";
import aiRouter from "./ai";
import syncRouter from "./sync";

const router: IRouter = Router();

router.use(healthRouter);
router.use(claudeRouter);
router.use(aiRouter);
router.use(syncRouter);

export default router;
