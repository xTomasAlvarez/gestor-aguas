import { Router }              from "express";
import { getDashboardStats, getAnnualStats } from "../controllers/statsController.js";
import { proteger, soloAdmin } from "../middleware/authMiddleware.js";

const router = Router();
router.use(proteger);

router.get("/dashboard", soloAdmin, getDashboardStats);
router.get("/annual",    soloAdmin, getAnnualStats);

export default router;
