import { Router }              from "express";
import { getDashboardStats }   from "../controllers/statsController.js";
import { proteger, soloAdmin } from "../middleware/authMiddleware.js";

const router = Router();
router.use(proteger);

router.get("/dashboard", soloAdmin, getDashboardStats);

export default router;
